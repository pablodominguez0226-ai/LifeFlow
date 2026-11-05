import { Request, Response } from 'express';
import ical, { ICalCalendarMethod, ICalEventRepeatingFreq, ICalWeekday } from 'ical-generator';
import { subWeeks, addDays, startOfWeek } from 'date-fns';
import { prisma } from '../db';

/**
 * Formatea el título del slot asignándole el prefijo e ícono semántico según la especificación de LifeFlow.
 */
function getSlotSummary(title: string, category: string, subject?: string | null): string {
  const cat = (category || '').toUpperCase();
  const lower = (title || '').toLowerCase();

  // Limpiar emojis o prefijos previos para evitar duplicados
  const cleanTitle = title
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '')
    .replace(/^\[CURSADO\]\s*/i, '')
    .replace(/^\[EXAMEN\]\s*/i, '')
    .trim();

  // 1. Cursadas
  if (cat === 'ACADEMIC_CLASS' || lower.includes('cursad') || lower.includes('facultad') || lower.includes('clase')) {
    return `🏛️ [CURSADO] ${cleanTitle}`;
  }

  // 2. Estudio
  if (cat === 'STUDY_DEEP' || lower.includes('estudio') || lower.includes('repaso') || lower.includes('parcial') || lower.includes('final')) {
    return `📚 ${cleanTitle}`;
  }

  // 3. Trading
  if (cat === 'TRADING' || lower.includes('trading') || lower.includes('nyse')) {
    return `📈 ${cleanTitle}`;
  }

  // 4. Entrenamiento / Running / Gym
  if (cat === 'GYM' || lower.includes('gym') || lower.includes('gimnasio') || lower.includes('corr') || lower.includes('entren')) {
    return `⚡ ${cleanTitle}`;
  }

  // Lectura u otros
  if (cat === 'READING' || lower.includes('lectura') || lower.includes('libro')) {
    return `📚 ${cleanTitle}`;
  }

  return cleanTitle || title;
}

const weekdayMap: Record<number, ICalWeekday> = {
  0: ICalWeekday.SU,
  1: ICalWeekday.MO,
  2: ICalWeekday.TU,
  3: ICalWeekday.WE,
  4: ICalWeekday.TH,
  5: ICalWeekday.FR,
  6: ICalWeekday.SA,
};

/**
 * Exporta el feed dinámico iCalendar (RFC 5545) con exámenes, bloques planificados
 * y rutinas fijas para sincronización en tiempo real con Google Calendar / Apple Calendar.
 */
export async function exportCalendarFeed(req: Request, res: Response) {
  try {
    const calendar = ical({
      name: 'LifeFlow Agenda',
      description: 'LifeFlow Agenda Inteligente Sincronizada',
      method: ICalCalendarMethod.PUBLISH,
      prodId: {
        company: 'LifeFlow',
        product: 'LifeFlow Scheduler',
        language: 'ES',
      },
    });

    // 1. Todos los Exam ordenados por fecha
    const exams = await prisma.exam.findMany({
      orderBy: { date: 'asc' },
    });

    for (const exam of exams) {
      const startDate = new Date(exam.date);
      // Duración estándar de examen: 2 horas
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      calendar.createEvent({
        id: `lifeflow-exam-${exam.id}@lifeflow.app`,
        start: startDate,
        end: endDate,
        summary: `🚨 [EXAMEN] ${exam.subject} - ${exam.type}`,
        description: 'Creado automáticamente por LifeFlow Scheduler.',
        status: 'CONFIRMED' as any,
      });
    }

    // 2. Todos los PlannedSlot del WeeklyPlan activo (y de las últimas 2 semanas para mantener histórico)
    const twoWeeksAgo = subWeeks(new Date(), 2);
    const activeOrRecentPlans = await prisma.weeklyPlan.findMany({
      where: {
        OR: [
          { isActive: true },
          { endDate: { gte: twoWeeksAgo } },
          { startDate: { gte: twoWeeksAgo } },
        ],
      },
      select: { id: true },
    });
    const planIds = activeOrRecentPlans.map((p) => p.id);

    const slots = await prisma.plannedSlot.findMany({
      where: {
        OR: [
          { weeklyPlanId: { in: planIds } },
          { start: { gte: twoWeeksAgo } },
        ],
      },
      orderBy: { start: 'asc' },
    });

    if (slots.length > 0) {
      for (const slot of slots) {
        calendar.createEvent({
          id: `lifeflow-slot-${slot.id}@lifeflow.app`,
          start: new Date(slot.start),
          end: new Date(slot.end),
          summary: getSlotSummary(slot.title, slot.category, slot.subject),
          description: 'Creado automáticamente por LifeFlow Scheduler.',
          status: 'CONFIRMED' as any,
        });
      }
    } else {
      // 3. Las FixedRoutine registradas para poblar eventos recurrentes si no hay slots generados
      const routines = await prisma.fixedRoutine.findMany();
      const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });

      for (const routine of routines) {
        const dayOffset = routine.dayOfWeek === 0 ? 6 : routine.dayOfWeek - 1;
        const eventDate = addDays(baseMonday, dayOffset);
        const [startH, startM] = routine.startTime.split(':').map(Number);
        const [endH, endM] = routine.endTime.split(':').map(Number);

        const startDate = new Date(eventDate);
        startDate.setHours(startH || 0, startM || 0, 0, 0);

        const endDate = new Date(eventDate);
        endDate.setHours(endH || 0, endM || 0, 0, 0);

        calendar.createEvent({
          id: `lifeflow-routine-${routine.id}@lifeflow.app`,
          start: startDate,
          end: endDate,
          summary: getSlotSummary(routine.title, routine.category),
          description: 'Creado automáticamente por LifeFlow Scheduler.',
          status: 'CONFIRMED' as any,
          repeating: {
            freq: ICalEventRepeatingFreq.WEEKLY,
            byDay: [weekdayMap[routine.dayOfWeek] || ICalWeekday.MO],
          },
        });
      }
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="lifeflow-agenda.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(calendar.toString());
  } catch (error: any) {
    console.error('Error in exportCalendarFeed:', error);
    return res.status(500).json({ error: error.message || 'Error generating iCalendar feed' });
  }
}
