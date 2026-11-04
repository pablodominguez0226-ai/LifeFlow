import { Request, Response } from 'express';
import { PrismaClient, Category, SlotStatus } from '@prisma/client';
import { calculateExamPriorities } from '../services/scheduler.service';

const prisma = new PrismaClient();

// Definición estricta de hábitos del sistema
export const SYSTEM_HABITS = [
  { key: 'wake_up_7am', label: 'Despertar 07:00 AM', category: 'PERSONAL', days: [1, 2, 3, 4, 5] },
  { key: 'trading_10am', label: 'Operar Trading 10:00 AM', category: 'TRADING', days: [1, 2, 3, 4, 5] },
  { key: 'gym', label: 'Gimnasio (15:00 - 17:00)', category: 'GYM', days: [1, 2, 4, 5] }, // 4 días: Lun, Mar, Jue, Vie
  { key: 'running', label: 'Salir a Correr', category: 'GYM', days: [3, 6, 0] }, // Mié, Sáb, Dom
  { key: 'reading', label: 'Lectura de Libros (30 min)', category: 'READING', days: [0, 1, 2, 3, 4, 5, 6] },
  { key: 'dev_bots_ai', label: 'Sistemas Propios, Bots & IA', category: 'PERSONAL', days: [1, 2, 3, 4] }
];

export async function getHabitsToday(req: Request, res: Response) {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const logs = await prisma.habitLog.findMany({
      where: { date: startOfDay }
    });

    const logsMap = new Map(logs.map(l => [l.habitKey, l.completed]));

    // Filtrar únicamente los hábitos que corresponden al día actual
    const habitsForToday = SYSTEM_HABITS
      .filter(h => h.days.includes(dayOfWeek))
      .map(h => ({
        key: h.key,
        label: h.label,
        category: h.category,
        completed: logsMap.get(h.key) || false
      }));

    return res.status(200).json(habitsForToday);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function toggleHabit(req: Request, res: Response) {
  try {
    const { habitKey, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const existing = await prisma.habitLog.findUnique({
      where: { habitKey_date: { habitKey, date: targetDate } }
    });

    const isCompleted = existing ? !existing.completed : true;

    await prisma.habitLog.upsert({
      where: { habitKey_date: { habitKey, date: targetDate } },
      update: { completed: isCompleted },
      create: { habitKey, date: targetDate, completed: true }
    });

    let dynamicSlot = null;

    // Reactividad: Si se completa Gym un día programado, liberar el slot y agregar estudio sugerido
    if (habitKey === 'gym' && isCompleted) {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const gymSlot = await prisma.plannedSlot.findFirst({
        where: {
          category: Category.GYM,
          start: { gte: startOfDay, lte: endOfDay },
          status: SlotStatus.PENDING
        }
      });

      if (gymSlot) {
        await prisma.plannedSlot.update({
          where: { id: gymSlot.id },
          data: { status: SlotStatus.FREED }
        });

        const exams = await prisma.exam.findMany({ where: { date: { gte: new Date() } } });
        const priorities = calculateExamPriorities(exams, new Date());
        const topSubject = Object.entries(priorities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Paradigmas';

        dynamicSlot = await prisma.plannedSlot.create({
          data: {
            weeklyPlanId: gymSlot.weeklyPlanId,
            title: `Estudio Sugerido (Post-Gym): ${topSubject}`,
            category: Category.STUDY_DEEP,
            subject: topSubject,
            start: gymSlot.start,
            end: gymSlot.end,
            isAutoSlot: true,
            status: SlotStatus.PENDING
          }
        });
      }
    }

    return res.status(200).json({ success: true, completed: isCompleted, dynamicSlot });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export const HabitsController = {
  getHabitsToday,
  toggleHabit,
};
