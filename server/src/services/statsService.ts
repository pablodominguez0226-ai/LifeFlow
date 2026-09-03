import { prisma } from '../db';
import { subDays } from 'date-fns';

export class StatsService {
  public static async getWeeklyStatistics(referenceDate: Date = new Date('2026-09-02T12:00:00Z')) {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const sevenDaysAgo = subDays(referenceDate, 7);

    // Fetch recent check-ins
    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { date: { gte: sevenDaysAgo, lte: referenceDate } },
      orderBy: { date: 'asc' },
    });

    // Fetch scheduled blocks in the last 7 days
    const blocks = await prisma.scheduleBlock.findMany({
      where: { startTime: { gte: sevenDaysAgo, lte: referenceDate } },
    });

    // Calculate hours by category
    const categoryMinutes: Record<string, number> = {
      ACADEMIA: 0,
      GIMNASIO: 0,
      DEPORTE: 0,
      SUENO: 0,
      LECTURA: 0,
      PERSONAL: 0,
      DESCANSO: 0,
      MERCADO: 0,
    };

    for (const b of blocks) {
      const cat = b.category in categoryMinutes ? b.category : 'PERSONAL';
      categoryMinutes[cat] += b.durationMinutes;
    }

    const categoryHours = Object.fromEntries(
      Object.entries(categoryMinutes).map(([k, v]) => [k, Math.round((v / 60) * 10) / 10])
    );

    // Sleep stats
    const avgSleep =
      checkIns.length > 0
        ? Math.round(
            (checkIns.reduce((acc, c) => acc + c.sleepHours, 0) / checkIns.length) * 10
          ) / 10
        : user.targetSleepHours;

    const workoutCount = checkIns.filter((c) => c.workoutDone).length;
    const totalStudyHoursLogged = checkIns.reduce((acc, c) => acc + c.studyHoursDone, 0);

    // Tasks metrics
    const completedTasks = await prisma.academicTask.count({ where: { status: 'COMPLETADA' } });
    const pendingTasks = await prisma.academicTask.count({ where: { status: 'PENDIENTE' } });

    // Sustainable Achievement Score (Cumplimiento Sostenible)
    // Factors:
    // 1. Sleep health (target 7-8h -> 30 pts)
    // 2. Consistent workout (target >= 3 -> 25 pts)
    // 3. Low chronic stress (avg stress <= 3 -> 25 pts)
    // 4. Study completion (study hours >= 12h -> 20 pts)
    let sleepScore = avgSleep >= 7.0 ? 30 : Math.max(10, Math.round((avgSleep / 7.0) * 30));
    let workoutScore = workoutCount >= 3 ? 25 : Math.round((workoutCount / 3) * 25);
    const avgStress =
      checkIns.length > 0
        ? checkIns.reduce((acc, c) => acc + c.stressLevel, 0) / checkIns.length
        : 2.5;
    let stressScore = avgStress <= 3.0 ? 25 : Math.max(10, 25 - (avgStress - 3) * 7);
    let studyScore = Math.min(20, Math.round((totalStudyHoursLogged / 15) * 20));

    const sustainableScore = Math.min(100, sleepScore + workoutScore + stressScore + studyScore);

    let sustainabilityStatus = 'Óptimo';
    if (sustainableScore < 60) sustainabilityStatus = 'Riesgo de Burnout';
    else if (sustainableScore < 75) sustainabilityStatus = 'Moderado';

    return {
      sustainableScore,
      sustainabilityStatus,
      scoreBreakdown: {
        sleepScore,
        workoutScore,
        stressScore,
        studyScore,
      },
      metrics: {
        avgSleep,
        targetSleep: user.targetSleepHours,
        workoutSessionsThisWeek: workoutCount,
        targetWorkouts: 4,
        studyHoursLogged: Math.round(totalStudyHoursLogged * 10) / 10,
        completedTasks,
        pendingTasks,
      },
      categoryHours,
      checkInsHistory: checkIns,
    };
  }
}
