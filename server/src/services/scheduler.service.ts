import { differenceInCalendarDays } from 'date-fns';
import { Category, SlotStatus } from '@prisma/client';
import { prisma } from '../db';

export interface TimeWindow {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface RoutineInput {
  id?: string;
  title?: string;
  category?: Category | string;
  dayOfWeek?: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  isFlexible?: boolean;
}

export interface ExamInput {
  id?: string;
  subject: string;
  type?: string;
  date: Date | string;
  weight?: number;
}

export interface AllocatedStudySlot {
  title: string;
  category: Category;
  subject: string;
  start: Date;
  end: Date;
  status: SlotStatus;
  isAutoSlot: boolean;
  durationMinutes?: number;
}

export class SchedulerService {
  /**
   * Pondera materias considerando la proximidad del examen.
   * - Si días restantes <= 7: aceleración crítica con factor 5 * (8 - d).
   * - Si días restantes <= 35: peso hiperbólico con factor 35 / d.
   * - Si días restantes <= 45: extensión hiperbólica 35 / d.
   * - Si días restantes > 45: se ignora el examen.
   * - Exámenes pasados (d < 0): se ignoran.
   * - Normaliza los pesos resultantes para que sumen 1.
   */
  public static calculateExamPriorities(
    exams: ExamInput[],
    referenceDate: Date | string = new Date()
  ): Record<string, number> {
    const refDate = new Date(referenceDate);
    const subjectRawScores: Record<string, number> = {};

    for (const exam of exams) {
      if (!exam.subject || !exam.date) continue;

      const examDate = new Date(exam.date);
      const daysRemaining = differenceInCalendarDays(examDate, refDate);

      // Ignorar exámenes pasados o con más de 45 días restantes
      if (daysRemaining < 0 || daysRemaining > 45) {
        continue;
      }

      let proximityFactor = 0;
      if (daysRemaining <= 7) {
        // Aceleración crítica: factor 5 * (8 - d)
        // d=7 -> 5*1=5; d=1 -> 5*7=35; d=0 -> 5*8=40
        proximityFactor = 5 * (8 - daysRemaining);
      } else if (daysRemaining <= 35) {
        // Peso hiperbólico: 35 / d
        // d=7 -> 35/7=5; d=35 -> 35/35=1
        proximityFactor = 35 / daysRemaining;
      } else {
        // 35 < d <= 45: decaimiento continuo
        proximityFactor = 35 / daysRemaining;
      }

      const examWeight = typeof exam.weight === 'number' && exam.weight > 0 ? exam.weight : 1.0;
      const score = examWeight * proximityFactor;

      subjectRawScores[exam.subject] = (subjectRawScores[exam.subject] || 0) + score;
    }

    const totalScore = Object.values(subjectRawScores).reduce((acc, curr) => acc + curr, 0);
    const normalizedWeights: Record<string, number> = {};

    if (totalScore > 0) {
      for (const [subject, score] of Object.entries(subjectRawScores)) {
        normalizedWeights[subject] = Number((score / totalScore).toFixed(4));
      }

      // Ajuste fino para garantizar suma exacta de 1.0
      const sum = Object.values(normalizedWeights).reduce((a, b) => a + b, 0);
      const diff = 1.0 - sum;
      if (Math.abs(diff) > 0.00001) {
        const firstSubject = Object.keys(normalizedWeights)[0];
        if (firstSubject) {
          normalizedWeights[firstSubject] = Number((normalizedWeights[firstSubject] + diff).toFixed(4));
        }
      }
    }

    return normalizedWeights;
  }

  /**
   * Ordena rutinas fijas del día (despertar 07:00, cursado, trading 10:00, gym)
   * y extrae ventanas libres >= 45 minutos dentro del horario operativo [dayStartHour, dayEndHour].
   */
  public static findFreeWindows(
    dayDate: Date | string,
    routines: RoutineInput[],
    dayStartHour = 7,
    dayEndHour = 23
  ): TimeWindow[] {
    const targetDate = new Date(dayDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const targetDayOfWeek = targetDate.getDay();

    const dayStart = new Date(year, month, day, dayStartHour, 0, 0, 0);
    const dayEnd = new Date(year, month, day, dayEndHour, 0, 0, 0);

    // Filtrar rutinas correspondientes al día de la semana si está definido
    const dayRoutines = routines.filter((r) => {
      if (typeof r.dayOfWeek === 'number') {
        return r.dayOfWeek === targetDayOfWeek;
      }
      return true;
    });

    // Mapear rutinas a intervalos de fecha absolutos y recortar a la jornada
    const busyIntervals: Array<{ start: Date; end: Date }> = [];

    for (const r of dayRoutines) {
      if (!r.startTime || !r.endTime) continue;

      const [startH, startM] = r.startTime.split(':').map(Number);
      const [endH, endM] = r.endTime.split(':').map(Number);

      const rStart = new Date(year, month, day, startH, startM, 0, 0);
      const rEnd = new Date(year, month, day, endH, endM, 0, 0);

      // Si la rutina es inválida o fuera del rango del día, descartar
      if (rEnd <= dayStart || rStart >= dayEnd || rEnd <= rStart) {
        continue;
      }

      const clampedStart = rStart < dayStart ? dayStart : rStart;
      const clampedEnd = rEnd > dayEnd ? dayEnd : rEnd;

      busyIntervals.push({ start: clampedStart, end: clampedEnd });
    }

    // Ordenar cronológicamente por hora de inicio
    busyIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Unificar/fusionar intervalos superpuestos o contiguos
    const mergedBusy: Array<{ start: Date; end: Date }> = [];
    for (const interval of busyIntervals) {
      if (mergedBusy.length === 0) {
        mergedBusy.push({ ...interval });
        continue;
      }

      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.start.getTime() <= last.end.getTime()) {
        if (interval.end.getTime() > last.end.getTime()) {
          last.end = interval.end;
        }
      } else {
        mergedBusy.push({ ...interval });
      }
    }

    // Extraer ventanas libres entre huecos ocupados
    const freeWindows: TimeWindow[] = [];
    let currentCursor = new Date(dayStart.getTime());

    for (const busy of mergedBusy) {
      if (busy.start.getTime() > currentCursor.getTime()) {
        const durationMinutes = Math.round((busy.start.getTime() - currentCursor.getTime()) / (1000 * 60));
        if (durationMinutes >= 45) {
          freeWindows.push({
            start: new Date(currentCursor.getTime()),
            end: new Date(busy.start.getTime()),
            durationMinutes,
          });
        }
      }
      if (busy.end.getTime() > currentCursor.getTime()) {
        currentCursor = new Date(busy.end.getTime());
      }
    }

    // Ventana final hasta el cierre del día
    if (dayEnd.getTime() > currentCursor.getTime()) {
      const durationMinutes = Math.round((dayEnd.getTime() - currentCursor.getTime()) / (1000 * 60));
      if (durationMinutes >= 45) {
        freeWindows.push({
          start: new Date(currentCursor.getTime()),
          end: new Date(dayEnd.getTime()),
          durationMinutes,
        });
      }
    }

    return freeWindows;
  }

  /**
   * Asigna bloques de estudio profundo (entre 45 y 90 min) en los huecos disponibles
   * intercalando las materias según su peso relativo.
   */
  public static allocateStudyToWindows(
    windows: TimeWindow[],
    subjectWeights: Record<string, number> | Array<{ subject: string; weight: number }>
  ): AllocatedStudySlot[] {
    // Normalizar pesos de entrada a lista ordenada
    let subjects: Array<{ subject: string; weight: number }> = [];

    if (Array.isArray(subjectWeights)) {
      subjects = subjectWeights.filter((s) => s.weight > 0);
    } else if (typeof subjectWeights === 'object' && subjectWeights !== null) {
      subjects = Object.entries(subjectWeights)
        .map(([subject, weight]) => ({ subject, weight }))
        .filter((s) => s.weight > 0);
    }

    if (subjects.length === 0) {
      subjects = [{ subject: 'Estudio Profundo General', weight: 1.0 }];
    }

    const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0);
    const normalizedSubjects = subjects
      .map((s) => ({ subject: s.subject, weight: s.weight / totalWeight }))
      .sort((a, b) => b.weight - a.weight);

    // Dividir ventanas en bloques de estudio profundo de entre 45 y 90 minutos
    interface RawSlot {
      start: Date;
      end: Date;
      durationMinutes: number;
    }
    const rawSlots: RawSlot[] = [];

    for (const window of windows) {
      const totalMinutes = window.durationMinutes;
      if (totalMinutes < 45) continue;

      if (totalMinutes <= 90) {
        rawSlots.push({
          start: new Date(window.start.getTime()),
          end: new Date(window.end.getTime()),
          durationMinutes: totalMinutes,
        });
      } else {
        // Cuántos bloques de máximo 90 min entran
        const numBlocks = Math.ceil(totalMinutes / 90);
        const baseDuration = Math.floor(totalMinutes / numBlocks);
        const remainder = totalMinutes % numBlocks;

        let slotCursor = new Date(window.start.getTime());
        for (let i = 0; i < numBlocks; i++) {
          const duration = baseDuration + (i < remainder ? 1 : 0);
          const slotEnd = new Date(slotCursor.getTime() + duration * 60 * 1000);

          rawSlots.push({
            start: new Date(slotCursor.getTime()),
            end: slotEnd,
            durationMinutes: duration,
          });

          slotCursor = slotEnd;
        }
      }
    }

    // Intercalar materias según su peso usando selección proporcional con anti-repetición
    const allocatedSlots: AllocatedStudySlot[] = [];
    const countAllocated: Record<string, number> = {};
    for (const s of normalizedSubjects) {
      countAllocated[s.subject] = 0;
    }

    let lastSubject: string | null = null;

    for (let slotIndex = 0; slotIndex < rawSlots.length; slotIndex++) {
      const slot = rawSlots[slotIndex];

      // Determinar materia con mayor déficit respecto a su peso teórico
      let bestSubject = normalizedSubjects[0].subject;
      let highestPriority = -Infinity;

      for (const s of normalizedSubjects) {
        // Proporción ideal acumulada menos lo asignado
        const expected = s.weight * (slotIndex + 1);
        const actual = countAllocated[s.subject];
        let priority = expected - actual;

        // Penalizar levemente si fue la materia inmediatamente anterior para forzar intercalado
        if (s.subject === lastSubject && normalizedSubjects.length > 1) {
          priority -= 0.35;
        }

        if (priority > highestPriority) {
          highestPriority = priority;
          bestSubject = s.subject;
        }
      }

      countAllocated[bestSubject] = (countAllocated[bestSubject] || 0) + 1;
      lastSubject = bestSubject;

      allocatedSlots.push({
        title: `Estudio Profundo: ${bestSubject}`,
        category: Category.STUDY_DEEP,
        subject: bestSubject,
        start: slot.start,
        end: slot.end,
        status: SlotStatus.PENDING,
        isAutoSlot: true,
        durationMinutes: slot.durationMinutes,
      });
    }

    return allocatedSlots;
  }

  /**
   * Persistencia completa: toma exámenes y rutinas fijas de la base de datos,
   * calcula prioridades, extrae ventanas libres y persiste los PlannedSlots
   * asociados al WeeklyPlan activo.
   */
  public static async scheduleDailyStudy(
    dayDate: Date | string,
    weeklyPlanId?: string
  ) {
    const targetDate = new Date(dayDate);

    // Obtener exámenes y rutinas fijas desde PostgreSQL
    const exams = await prisma.exam.findMany();
    const routines = await prisma.fixedRoutine.findMany();

    const priorities = this.calculateExamPriorities(exams, targetDate);
    const windows = this.findFreeWindows(targetDate, routines);
    const studySlots = this.allocateStudyToWindows(windows, priorities);

    let planId = weeklyPlanId;
    if (!planId) {
      let activePlan = await prisma.weeklyPlan.findFirst({
        where: { isActive: true },
      });

      if (!activePlan) {
        activePlan = await prisma.weeklyPlan.create({
          data: {
            startDate: targetDate,
            endDate: new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        });
      }
      planId = activePlan.id;
    }

    // Persistir PlannedSlots en base de datos
    if (studySlots.length > 0 && planId) {
      await prisma.plannedSlot.createMany({
        data: studySlots.map((slot) => ({
          weeklyPlanId: planId!,
          title: slot.title,
          category: slot.category,
          subject: slot.subject,
          start: slot.start,
          end: slot.end,
          status: slot.status,
          isAutoSlot: slot.isAutoSlot,
        })),
      });
    }

    return {
      planId,
      priorities,
      windowsCount: windows.length,
      allocatedSlots: studySlots,
    };
  }
}

// Exportaciones individuales para máxima compatibilidad con tests e imports
export const calculateExamPriorities = SchedulerService.calculateExamPriorities.bind(SchedulerService);
export const findFreeWindows = SchedulerService.findFreeWindows.bind(SchedulerService);
export const allocateStudyToWindows = SchedulerService.allocateStudyToWindows.bind(SchedulerService);
