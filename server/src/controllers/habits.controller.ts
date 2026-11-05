import { Request, Response } from 'express';
import { PrismaClient, Category, SlotStatus } from '@prisma/client';
import { subDays, addDays } from 'date-fns';
import { calculateExamPriorities } from '../services/scheduler.service';

const prisma = new PrismaClient();

// Definición estricta de hábitos del sistema
export const SYSTEM_HABITS = [
  { key: 'wake_up_7am', label: 'Despertar 07:00 AM', category: 'PERSONAL', days: [1, 2, 3, 4, 5] },
  { key: 'trading_10am', label: 'Operar Trading 10:00 AM', category: 'TRADING', days: [1, 2, 3, 4, 5] },
  { key: 'gym', label: 'Gimnasio (15:00 - 17:00)', category: 'GYM', days: [1, 2, 4, 5] }, // 4 días: Lun, Mar, Jue, Vie
  { key: 'running', label: 'Salir a Correr', category: 'GYM', days: [3, 6, 0] }, // Mié, Sáb, Dom
  { key: 'reading', label: 'Lectura de Libros (30 min)', category: 'READING', days: [0, 1, 2, 3, 4, 5, 6] },
  { key: 'dev_bots_ai', label: 'Sistemas Propios, Bots & IA', category: 'PERSONAL', days: [1, 2, 3, 4] },
];

/**
 * Asegura datos históricos realistas para el Heatmap si existen pocos registros en la base de datos.
 */
async function ensureHistoricalHabitLogs() {
  const count = await prisma.habitLog.count();
  if (count < 35) {
    const definitions = await prisma.habitDefinition.findMany();
    if (definitions.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsToCreate: any[] = [];

    // Poblar los últimos 90 días con consistencia realista (~80%)
    for (let i = 90; i >= 5; i--) {
      const curDate = subDays(today, i);
      const dayOfWeek = curDate.getDay();

      // Días especiales congelados como demostración (ej: hace 22 días viaje)
      const isTripFreeze = i === 22 || i === 23;
      const isHolidayFreeze = i === 54;

      for (const def of definitions) {
        if (!def.targetDays.includes(dayOfWeek)) continue;

        if (isTripFreeze) {
          logsToCreate.push({
            habitKey: def.key,
            date: curDate,
            completed: false,
            isFrozen: true,
            freezeNote: 'Viaje a Malargüe (Descanso programado)',
          });
        } else if (isHolidayFreeze) {
          logsToCreate.push({
            habitKey: def.key,
            date: curDate,
            completed: false,
            isFrozen: true,
            freezeNote: 'Feriado Nacional',
          });
        } else {
          // Completado con alta consistencia (~85%)
          const completed = (i + def.key.length) % 7 !== 0;
          logsToCreate.push({
            habitKey: def.key,
            date: curDate,
            completed,
            isFrozen: false,
            freezeNote: null,
          });
        }
      }
    }

    if (logsToCreate.length > 0) {
      for (const item of logsToCreate) {
        await prisma.habitLog.upsert({
          where: { habitKey_date: { habitKey: item.habitKey, date: item.date } },
          update: {},
          create: item,
        });
      }
    }
  }
}

/**
 * Recalcula rachas para cada hábito respetando la regla:
 * Si un día está marcado como isFrozen, la racha NO se reinicia a cero (se mantiene intacta).
 */
export async function recalculateHabitStreaks() {
  try {
    const definitions = await prisma.habitDefinition.findMany();
    const allLogs = await prisma.habitLog.findMany({
      orderBy: { date: 'desc' },
    });

    const logMap = new Map<string, { completed: boolean; isFrozen: boolean }>();
    for (const log of allLogs) {
      const dStr = new Date(log.date).toISOString().split('T')[0];
      logMap.set(`${log.habitKey}_${dStr}`, {
        completed: log.completed,
        isFrozen: Boolean(log.isFrozen),
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const habit of definitions) {
      let streak = 0;
      // Evaluar hacia atrás hasta 365 días
      for (let i = 0; i < 365; i++) {
        const checkDate = subDays(today, i);
        const dayOfWeek = checkDate.getDay();
        const dStr = checkDate.toISOString().split('T')[0];

        // Si el hábito no estaba asignado para este día de la semana, no penaliza la racha
        if (!habit.targetDays.includes(dayOfWeek)) {
          continue;
        }

        const log = logMap.get(`${habit.key}_${dStr}`);

        // Si es hoy y aún no está completado, no romper la racha todavía
        if (i === 0 && (!log || (!log.completed && !log.isFrozen))) {
          continue;
        }

        if (log?.isFrozen) {
          // El Streak Freeze protege la racha: NO la reinicia, continúa evaluando días previos
          continue;
        }

        if (log?.completed) {
          streak++;
        } else {
          // Día sin completar no congelado -> racha rota
          break;
        }
      }

      await prisma.habitDefinition.update({
        where: { id: habit.id },
        data: { streakDays: Math.max(streak, 1) },
      });
    }
  } catch (err) {
    console.warn('Error recalculating habit streaks:', err);
  }
}

export async function getHabitsToday(req: Request, res: Response) {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const logs = await prisma.habitLog.findMany({
      where: { date: startOfDay },
    });

    const logsMap = new Map(logs.map((l) => [l.habitKey, l.completed]));

    // Filtrar únicamente los hábitos que corresponden al día actual
    const habitsForToday = SYSTEM_HABITS
      .filter((h) => h.days.includes(dayOfWeek))
      .map((h) => ({
        key: h.key,
        label: h.label,
        category: h.category,
        completed: logsMap.get(h.key) || false,
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
      where: { habitKey_date: { habitKey, date: targetDate } },
    });

    const isCompleted = existing ? !existing.completed : true;

    await prisma.habitLog.upsert({
      where: { habitKey_date: { habitKey, date: targetDate } },
      update: { completed: isCompleted, isFrozen: false, freezeNote: null },
      create: { habitKey, date: targetDate, completed: true, isFrozen: false },
    });

    // Recalcular rachas reactivamente
    await recalculateHabitStreaks();

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
          status: SlotStatus.PENDING,
        },
      });

      if (gymSlot) {
        await prisma.plannedSlot.update({
          where: { id: gymSlot.id },
          data: { status: SlotStatus.FREED },
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
            status: SlotStatus.PENDING,
          },
        });
      }
    }

    return res.status(200).json({ success: true, completed: isCompleted, dynamicSlot });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/habits/heatmap
 * Retorna datos agrupados por día para el Heatmap estilo GitHub con intensidad y estado de Streak Freeze.
 */
export async function getHabitsHeatmap(req: Request, res: Response) {
  try {
    await ensureHistoricalHabitLogs();

    const daysParam = req.query.days ? parseInt(req.query.days as string, 10) : 180;
    const daysCount = isNaN(daysParam) || daysParam <= 0 ? 180 : Math.min(daysParam, 365);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = subDays(today, daysCount - 1);
    const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Definición de hábitos meta
    let definitions = await prisma.habitDefinition.findMany();
    if (definitions.length === 0) {
      definitions = SYSTEM_HABITS.map((h) => ({
        id: h.key,
        userId: null,
        key: h.key,
        name: h.label,
        category: h.category as any,
        targetDays: h.days,
        streakDays: 0,
        createdAt: new Date(),
      }));
    }

    // Consulta de todos los logs en el rango
    const logs = await prisma.habitLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Agrupar logs por YYYY-MM-DD
    const logsByDate = new Map<string, typeof logs>();
    for (const log of logs) {
      const dStr = new Date(log.date).toISOString().split('T')[0];
      const existing = logsByDate.get(dStr) || [];
      existing.push(log);
      logsByDate.set(dStr, existing);
    }

    // Construir respuesta para cada día del rango
    const heatmap = [];
    for (let i = 0; i < daysCount; i++) {
      const curDate = addDays(startDate, i);
      const dateStr = curDate.toISOString().split('T')[0];
      const dayOfWeek = curDate.getDay();

      const targetHabits = definitions.filter((d) => d.targetDays.includes(dayOfWeek));
      const totalTargetCount = targetHabits.length > 0 ? targetHabits.length : definitions.length;

      const dayLogs = logsByDate.get(dateStr) || [];
      const isFrozen = dayLogs.some((l) => l.isFrozen);
      const freezeNote = dayLogs.find((l) => l.isFrozen)?.freezeNote || null;
      const completedCount = dayLogs.filter((l) => l.completed).length;

      let intensity = 0;
      if (completedCount > 0 && totalTargetCount > 0) {
        const ratio = completedCount / totalTargetCount;
        if (ratio <= 0.25) intensity = 1;
        else if (ratio <= 0.50) intensity = 2;
        else if (ratio <= 0.75) intensity = 3;
        else intensity = 4;
      }

      heatmap.push({
        date: dateStr,
        completedCount,
        totalTargetCount,
        intensity,
        isFrozen,
        freezeNote,
      });
    }

    return res.status(200).json(heatmap);
  } catch (error: any) {
    console.error('Error in getHabitsHeatmap:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/habits/freeze
 * Congela la racha para un día específico (viaje, descanso programado o feriado).
 */
export async function freezeStreakDay(req: Request, res: Response) {
  try {
    const { date, reason } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'La fecha (date) es requerida en formato YYYY-MM-DD.' });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Usar YYYY-MM-DD.' });
    }

    let definitions = await prisma.habitDefinition.findMany();
    if (definitions.length === 0) {
      definitions = SYSTEM_HABITS.map((h) => ({
        id: h.key,
        userId: null,
        key: h.key,
        name: h.label,
        category: h.category as any,
        targetDays: h.days,
        streakDays: 0,
        createdAt: new Date(),
      }));
    }

    const note = reason?.trim() || 'Streak Freeze Programado';
    const results = [];

    for (const habit of definitions) {
      const record = await prisma.habitLog.upsert({
        where: {
          habitKey_date: {
            habitKey: habit.key,
            date: targetDate,
          },
        },
        update: {
          isFrozen: true,
          completed: false,
          freezeNote: note,
        },
        create: {
          habitKey: habit.key,
          date: targetDate,
          completed: false,
          isFrozen: true,
          freezeNote: note,
        },
      });
      results.push(record);
    }

    // Recalcular rachas protegiendo los días congelados
    await recalculateHabitStreaks();

    return res.status(200).json({
      success: true,
      message: `Día ${date} congelado correctamente. Racha preservada.`,
      date,
      reason: note,
      frozenCount: results.length,
    });
  } catch (error: any) {
    console.error('Error in freezeStreakDay:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const HabitsController = {
  getHabitsToday,
  toggleHabit,
  getHabitsHeatmap,
  freezeStreakDay,
  recalculateHabitStreaks,
};
