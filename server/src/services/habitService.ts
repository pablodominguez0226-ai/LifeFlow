import { prisma } from '../db';

export const PREDEFINED_HABITS = [
  { title: 'Levantarse temprano', category: 'SUENO', targetFrequency: 7, frequencyUnit: 'SEMANAL' },
  { title: 'Lectura', category: 'LECTURA', targetFrequency: 7, frequencyUnit: 'SEMANAL' },
  { title: 'Estudiar', category: 'ESTUDIO', targetFrequency: 7, frequencyUnit: 'SEMANAL' },
  { title: 'Operar/Trading', category: 'FINANZAS', targetFrequency: 5, frequencyUnit: 'SEMANAL' },
  { title: 'Ordenar pieza', category: 'PERSONAL', targetFrequency: 7, frequencyUnit: 'SEMANAL' },
  { title: 'Descanso', category: 'DESCANSO', targetFrequency: 7, frequencyUnit: 'SEMANAL' },
  { title: 'Gimnasio', category: 'GIMNASIO', targetFrequency: 4, frequencyUnit: 'SEMANAL' },
];

export class HabitService {
  public static async ensurePredefinedHabits(userId: string) {
    const existing = await prisma.habit.findMany({ where: { userId } });
    const existingTitles = new Set(existing.map((h) => h.title.toLowerCase().trim()));

    // Rename legacy seeded habits if present to match the clean names
    const legacyRenames: Record<string, string> = {
      'despertar 06:30 - 07:00': 'Levantarse temprano',
      'lectura nocturna sin pantallas (22:30)': 'Lectura',
      'bloque de estudio profundo matutino': 'Estudiar',
      'gimnasio 4x por semana (lun, mar, jue, vie)': 'Gimnasio',
      'dormir antes de las 00:00': 'Descanso',
    };

    for (const habit of existing) {
      const lower = habit.title.toLowerCase().trim();
      if (legacyRenames[lower]) {
        const newTitle = legacyRenames[lower];
        if (!existingTitles.has(newTitle.toLowerCase())) {
          await prisma.habit.update({
            where: { id: habit.id },
            data: { title: newTitle },
          });
          existingTitles.add(newTitle.toLowerCase());
        }
      }
    }

    // Now ensure all 7 predefined habits exist
    for (const item of PREDEFINED_HABITS) {
      if (!existingTitles.has(item.title.toLowerCase())) {
        await prisma.habit.create({
          data: {
            userId,
            title: item.title,
            category: item.category,
            targetFrequency: item.targetFrequency,
            frequencyUnit: item.frequencyUnit,
            streak: 0,
          },
        });
        existingTitles.add(item.title.toLowerCase());
      }
    }
  }

  public static async getHabits(userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) targetUserId = firstUser.id;
    }

    if (targetUserId) {
      await this.ensurePredefinedHabits(targetUserId);
    }

    const where: any = {};
    if (targetUserId) where.userId = targetUserId;

    return prisma.habit.findMany({
      where,
      include: {
        logs: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  public static async createHabit(
    userId: string | undefined,
    data: {
      title: string;
      category?: string;
      targetFrequency?: number;
      frequencyUnit?: string;
    }
  ) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    return prisma.habit.create({
      data: {
        userId: targetUserId,
        title: data.title,
        category: data.category || 'GENERAL',
        targetFrequency: data.targetFrequency || 7,
        frequencyUnit: data.frequencyUnit || 'SEMANAL',
        streak: 0,
      },
      include: { logs: true },
    });
  }

  public static async updateHabit(
    habitId: string,
    data: {
      title?: string;
      category?: string;
      targetFrequency?: number;
      frequencyUnit?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.habit.update({
      where: { id: habitId },
      data,
      include: { logs: true },
    });
  }

  public static async deleteHabit(habitId: string) {
    return prisma.habit.delete({
      where: { id: habitId },
    });
  }

  public static async toggleHabitDate(habitId: string, dateStr: string) {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new Error('Habit not found');

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: dateStr,
        },
      },
    });

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: !existingLog.completed },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId,
          date: dateStr,
          completed: true,
        },
      });
    }

    // Recalculate streak
    const logs = await prisma.habitLog.findMany({
      where: { habitId, completed: true },
      select: { date: true },
    });

    const completedDates = new Set(logs.map((l) => l.date));
    const streak = this.computeStreak(completedDates);

    return prisma.habit.update({
      where: { id: habitId },
      data: { streak },
      include: { logs: true },
    });
  }

  private static computeStreak(completedDates: Set<string>): number {
    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const checkDate = new Date();
    const todayStr = toDateStr(checkDate);

    // If today is not completed, check if yesterday was completed
    if (!completedDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!completedDates.has(toDateStr(checkDate))) {
        return 0;
      }
    }

    let streak = 0;
    while (completedDates.has(toDateStr(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  public static async toggleHabitStreak(habitId: string, increment: boolean) {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new Error('Habit not found');

    const newStreak = increment ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    return prisma.habit.update({
      where: { id: habitId },
      data: { streak: newStreak },
      include: { logs: true },
    });
  }

  public static async createCheckIn(
    userId: string | undefined,
    data: {
      date: Date;
      sleepHours: number;
      energyLevel: number;
      stressLevel: number;
      studyHoursDone: number;
      workoutDone: boolean;
      workoutType?: string;
      tradingResult?: string;
      tradingPipsRR?: string;
      tradingNotes?: string;
      dayClosure?: string;
      tomorrowTasks?: string;
      notes?: string;
    }
  ) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    const checkinDate = new Date(data.date);
    const startOfDay = new Date(checkinDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkinDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let checkin;
    if (existingCheckin) {
      checkin = await prisma.dailyCheckIn.update({
        where: { id: existingCheckin.id },
        data: {
          sleepHours: data.sleepHours,
          energyLevel: data.energyLevel,
          stressLevel: data.stressLevel,
          studyHoursDone: data.studyHoursDone,
          workoutDone: data.workoutDone,
          workoutType: data.workoutType !== undefined ? data.workoutType : existingCheckin.workoutType,
          tradingResult: data.tradingResult !== undefined ? data.tradingResult : existingCheckin.tradingResult,
          tradingPipsRR: data.tradingPipsRR !== undefined ? data.tradingPipsRR : existingCheckin.tradingPipsRR,
          tradingNotes: data.tradingNotes !== undefined ? data.tradingNotes : existingCheckin.tradingNotes,
          dayClosure: data.dayClosure !== undefined ? data.dayClosure : existingCheckin.dayClosure,
          tomorrowTasks: data.tomorrowTasks !== undefined ? data.tomorrowTasks : existingCheckin.tomorrowTasks,
          notes: data.notes !== undefined ? data.notes : existingCheckin.notes,
        },
      });
    } else {
      checkin = await prisma.dailyCheckIn.create({
        data: {
          userId: targetUserId,
          ...data,
        },
      });
    }

    // Keep JournalEntry synced if journal or trading content exists
    if (data.dayClosure || data.tradingResult || data.tradingNotes || data.tomorrowTasks) {
      const existingJournal = await prisma.journalEntry.findFirst({
        where: {
          userId: targetUserId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingJournal) {
        await prisma.journalEntry.update({
          where: { id: existingJournal.id },
          data: {
            dayClosure: data.dayClosure,
            tomorrowTasks: data.tomorrowTasks,
            tradingResult: data.tradingResult,
            tradingPipsRR: data.tradingPipsRR,
            tradingNotes: data.tradingNotes,
            workoutType: data.workoutType,
          },
        });
      } else {
        await prisma.journalEntry.create({
          data: {
            userId: targetUserId,
            date: checkinDate,
            dayClosure: data.dayClosure,
            tomorrowTasks: data.tomorrowTasks,
            tradingResult: data.tradingResult,
            tradingPipsRR: data.tradingPipsRR,
            tradingNotes: data.tradingNotes,
            workoutType: data.workoutType,
          },
        });
      }
    }

    return checkin;
  }

  public static async getCheckIns(days: number = 7, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    return prisma.dailyCheckIn.findMany({
      where,
      orderBy: { date: 'desc' },
      take: days,
    });
  }

  public static async getLatestPriorityTasks(userId?: string, referenceDate: Date = new Date()) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) return { tasks: [], checkinId: null, sourceDate: null };
      targetUserId = user.id;
    }

    const refDayStart = new Date(referenceDate);
    refDayStart.setHours(0, 0, 0, 0);

    // 1. Look for check-in submitted yesterday / before today with tomorrowTasks
    const yesterdayCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { lt: refDayStart },
        tomorrowTasks: { not: null },
      },
      orderBy: { date: 'desc' },
    });

    if (yesterdayCheckin?.tomorrowTasks) {
      try {
        const tasks = JSON.parse(yesterdayCheckin.tomorrowTasks);
        if (Array.isArray(tasks) && tasks.length > 0) {
          return {
            checkinId: yesterdayCheckin.id,
            sourceDate: yesterdayCheckin.date,
            isFromYesterday: true,
            tasks,
          };
        }
      } catch (e) {
        console.error('Failed to parse yesterday tomorrowTasks:', e);
      }
    }

    // 2. Look for today's checkin if already submitted with tomorrowTasks
    const todayEnd = new Date(referenceDate);
    todayEnd.setHours(23, 59, 59, 999);
    const todayCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: refDayStart, lte: todayEnd },
        tomorrowTasks: { not: null },
      },
      orderBy: { date: 'desc' },
    });

    if (todayCheckin?.tomorrowTasks) {
      try {
        const tasks = JSON.parse(todayCheckin.tomorrowTasks);
        if (Array.isArray(tasks) && tasks.length > 0) {
          return {
            checkinId: todayCheckin.id,
            sourceDate: todayCheckin.date,
            isFromYesterday: false,
            tasks,
          };
        }
      } catch (e) {
        console.error('Failed to parse today tomorrowTasks:', e);
      }
    }

    // 3. Fallback to latest checkin with tomorrowTasks
    const latestCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        tomorrowTasks: { not: null },
      },
      orderBy: { date: 'desc' },
    });

    if (latestCheckin?.tomorrowTasks) {
      try {
        const tasks = JSON.parse(latestCheckin.tomorrowTasks);
        if (Array.isArray(tasks) && tasks.length > 0) {
          return {
            checkinId: latestCheckin.id,
            sourceDate: latestCheckin.date,
            isFromYesterday: false,
            tasks,
          };
        }
      } catch (e) {
        console.error('Failed to parse latest tomorrowTasks:', e);
      }
    }

    return {
      checkinId: null,
      sourceDate: null,
      isFromYesterday: false,
      tasks: [],
    };
  }

  public static async togglePriorityTask(taskId: string, completed?: boolean, userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    // Find the checkin containing this task
    const checkins = await prisma.dailyCheckIn.findMany({
      where: {
        userId: targetUserId,
        tomorrowTasks: { not: null },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    for (const checkin of checkins) {
      if (!checkin.tomorrowTasks) continue;
      try {
        const tasks = JSON.parse(checkin.tomorrowTasks);
        if (Array.isArray(tasks)) {
          const task = tasks.find((t: any) => t.id === taskId);
          if (task) {
            task.completed = completed !== undefined ? completed : !task.completed;
            const updatedTomorrowTasks = JSON.stringify(tasks);
            await prisma.dailyCheckIn.update({
              where: { id: checkin.id },
              data: { tomorrowTasks: updatedTomorrowTasks },
            });
            return { checkinId: checkin.id, tasks };
          }
        }
      } catch (err) {
        console.error('Error toggling task:', err);
      }
    }

    throw new Error('Task not found in recent check-ins');
  }

  public static async addPriorityTask(text: string, userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let checkin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let tasks: Array<{ id: string; text: string; completed: boolean }> = [];
    if (checkin?.tomorrowTasks) {
      try {
        tasks = JSON.parse(checkin.tomorrowTasks);
      } catch (e) {
        tasks = [];
      }
    } else {
      // Check yesterday's checkin tasks to inherit or copy
      const prev = await prisma.dailyCheckIn.findFirst({
        where: {
          userId: targetUserId,
          date: { lt: startOfDay },
          tomorrowTasks: { not: null },
        },
        orderBy: { date: 'desc' },
      });
      if (prev?.tomorrowTasks) {
        try {
          tasks = JSON.parse(prev.tomorrowTasks);
        } catch (e) {
          tasks = [];
        }
      }
    }

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: text.trim(),
      completed: false,
    };
    tasks.push(newTask);

    if (checkin) {
      await prisma.dailyCheckIn.update({
        where: { id: checkin.id },
        data: { tomorrowTasks: JSON.stringify(tasks) },
      });
    } else {
      checkin = await prisma.dailyCheckIn.create({
        data: {
          userId: targetUserId,
          date: today,
          tomorrowTasks: JSON.stringify(tasks),
        },
      });
    }

    return { checkinId: checkin.id, tasks };
  }
}

