import { prisma } from '../db';
import { startOfWeek, endOfWeek, isSameDay, format } from 'date-fns';
import {
  WeeklyGenerator,
  DailyPlanner,
  Replanner,
  PriorityScorer,
  OverloadDetector,
  CapacityAnalyzer,
  UserConstraints,
  TaskInput,
  SubjectInput,
  TimeSlot,
  UserEnergyContext,
} from '../engine';
import { HabitService } from './habitService';

export class PlanningService {
  /**
   * Builds the comprehensive Dashboard "Hoy" payload
   */
  public static async getDashboardSummary(referenceDate: Date = new Date(), userId?: string) {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(referenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const utcStartOfDay = new Date(referenceDate);
    utcStartOfDay.setUTCHours(0, 0, 0, 0);
    const utcEndOfDay = new Date(referenceDate);
    utcEndOfDay.setUTCHours(23, 59, 59, 999);

    const minStart = startOfDay < utcStartOfDay ? startOfDay : utcStartOfDay;
    const maxEnd = endOfDay > utcEndOfDay ? endOfDay : utcEndOfDay;

    // 1. Get today's checkin if exists
    const todayCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: minStart,
          lte: maxEnd,
        },
      },
      orderBy: { date: 'desc' },
    });

    // 2. Get today's schedule blocks
    const todayBlocks = await prisma.scheduleBlock.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: minStart,
          lte: maxEnd,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // 3. Find next activity
    const nextActivity = todayBlocks.find((b) => b.startTime >= referenceDate) || todayBlocks[0] || null;

    // 4. Calculate study hours planned vs actual for today
    const plannedStudyMinutes = todayBlocks
      .filter((b) => b.category === 'ACADEMIA')
      .reduce((acc, b) => acc + b.durationMinutes, 0);
    const plannedStudyHours = Math.round((plannedStudyMinutes / 60) * 10) / 10;
    const actualStudyHours = todayCheckin?.studyHoursDone || 0;

    // 5. Day load status calculation
    let dayLoadLevel = 'MODERADA';
    if (plannedStudyHours > 6) dayLoadLevel = 'ALTA';
    else if (plannedStudyHours > 9) dayLoadLevel = 'EXCESIVA';
    else if (plannedStudyHours <= 3) dayLoadLevel = 'BAJA';

    // 6. Upcoming exams
    const exams = await prisma.exam.findMany({
      where: { userId: user.id },
      include: { subject: true },
      orderBy: { date: 'asc' },
    });

    const upcomingExams = exams.map((exam) => {
      const daysRemaining = Math.ceil(
        (exam.date.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24)
      );
      return {
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        subjectColor: exam.subject.color,
        date: exam.date,
        daysRemaining,
        type: exam.type,
        weight: exam.weight,
        isUrgent: daysRemaining <= 14,
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    // 7. Top Priority of the day
    const topExam = upcomingExams[0];
    const dayPriority = topExam
      ? `Preparación ${topExam.subjectName} (${topExam.daysRemaining} días para ${topExam.title})`
      : 'Consolidación y repaso general';

    // 8. Active recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: { userId: user.id, dismissed: false },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    // 9. Guided Study Focus (Foco Académico Guiado)
    const pendingReviewTopic = await prisma.academicTopic.findFirst({
      where: {
        status: 'REVISION_PENDIENTE',
        unit: { subject: { userId: user.id } },
      },
      include: {
        unit: {
          include: { subject: true },
        },
      },
      orderBy: { lastStudiedAt: 'asc' },
    });

    const nextNewTopic = await prisma.academicTopic.findFirst({
      where: {
        status: 'PENDIENTE',
        unit: { subject: { userId: user.id } },
      },
      include: {
        unit: {
          include: { subject: true },
        },
      },
      orderBy: [
        { unit: { unitNumber: 'asc' } },
        { createdAt: 'asc' },
      ],
    });

    // 10. Priority Tasks from Night Journal / Check-in
    const priorityTasksData = await HabitService.getLatestPriorityTasks(user.id, referenceDate);

    // 11. Morning Routine status (Lectura matutina -> Sesión de estudio)
    const todayDateStr = format(referenceDate, 'yyyy-MM-dd');
    const readingHabit = await prisma.habit.findFirst({
      where: {
        userId: user.id,
        title: { contains: 'Lectura' },
      },
      include: {
        logs: {
          where: { date: todayDateStr, completed: true },
        },
      },
    });
    const isReadingCompletedToday = Boolean(readingHabit && readingHabit.logs.length > 0);

    return {
      currentDate: referenceDate,
      currentTime: format(referenceDate, 'HH:mm'),
      todayBlocks,
      nextActivity: nextActivity
        ? {
            title: nextActivity.title,
            startTime: nextActivity.startTime,
            endTime: nextActivity.endTime,
            category: nextActivity.category,
            justification: nextActivity.justification,
          }
        : null,
      dayPriority,
      dayLoadLevel,
      studyStats: {
        plannedHours: plannedStudyHours,
        actualHours: actualStudyHours,
        targetSleepHours: user.targetSleepHours,
        actualSleepHours: todayCheckin?.sleepHours || 7.5,
        workoutDone: todayCheckin?.workoutDone || false,
        workoutType: todayCheckin?.workoutType || null,
        tradingResult: todayCheckin?.tradingResult || null,
        tradingPipsRR: todayCheckin?.tradingPipsRR || null,
      },
      upcomingExams: upcomingExams.slice(0, 5),
      recommendations,
      guidedStudy: {
        pendingReviewTopic,
        nextNewTopic,
      },
      priorityTasks: priorityTasksData,
      morningRoutine: {
        firstHabit: {
          id: readingHabit?.id || 'habit_reading',
          title: 'Lectura tranquila matutina (15-20 min)',
          description: 'Activar la mente sin fatiga de estudio de golpe',
          completed: isReadingCompletedToday,
        },
        secondBlock: {
          title: 'Sesión de estudio / Trabajo profundo',
          description: 'Foco cognitivo alto una vez activada la corteza prefrontal',
          suggestedSubject: topExam ? `${topExam.subjectName} (${topExam.title})` : 'Diseño de Sistemas / Paradigmas',
        },
      },
    };
  }

  /**
   * Generates a proposal using the Planning Engine
   */
  public static async generateWeekProposal(
    mondayDate: Date,
    options: { enableRugby?: boolean; enableMarket?: boolean; gymSessionsTarget?: number } = {},
    userId?: string
  ) {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      include: { exams: true, academicTasks: true },
    });

    const tasks = await prisma.academicTask.findMany({
      where: { userId: user.id, status: { not: 'COMPLETADA' } },
      include: { subject: true, exam: true },
    });

    const taskInputs: TaskInput[] = tasks.map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      title: t.title,
      taskType: t.taskType as any,
      estimatedMinutes: t.estimatedMinutes,
      remainingMinutes: t.remainingMinutes,
      energyLevel: t.energyLevel as any,
      dueDate: t.dueDate || undefined,
      examId: t.examId || undefined,
      examDate: t.exam?.date || undefined,
      subjectMastery: t.subject.masteryLevel as any,
      subjectWeight: t.subject.priorityWeight,
    }));

    const subjectInputs: SubjectInput[] = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type as any,
      masteryLevel: s.masteryLevel as any,
      priorityWeight: s.priorityWeight,
      exams: s.exams.map((e) => ({
        id: e.id,
        subjectId: e.subjectId,
        subjectName: s.name,
        title: e.title,
        type: e.type,
        date: e.date,
        weight: e.weight,
        targetHoursEstimate: e.targetHoursEstimate,
        completedHours: e.completedHours,
      })),
      pendingTasksCount: s.academicTasks.filter((t) => t.status !== 'COMPLETADA').length,
      remainingStudyHours: 20,
    }));

    const userConstraints: UserConstraints = {
      targetWakeTime: user.targetWakeTime,
      maxBedTime: user.maxBedTime,
      targetSleepHours: user.targetSleepHours,
      maxFocusBlockMinutes: user.maxFocusBlockMinutes,
      chunkWorkMinutes: 50,
      chunkBreakMinutes: user.defaultBreakMinutes,
      personalBufferRatio: user.personalBufferRatio,
      travelFacultadMinutes: user.travelFacultadMinutes,
      travelGymMinutes: user.travelGymMinutes,
      rugbyPrepTravelMinutes: user.rugbyPrepTravelMinutes,
      windDownStartTime: '22:30',
    };

    // Query active recurring schedule rules from SQLite
    const recurringRulesFromDb = await prisma.recurringScheduleRule.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const recurringRuleInputs = recurringRulesFromDb.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      durationMinutes: r.durationMinutes,
      title: r.title,
      category: r.category as any,
      flexibility: r.flexibility as any,
      isFixed: r.isFixed,
      energyLevel: r.energyLevel as any,
      justification: r.justification || undefined,
      notes: r.notes || undefined,
      location: r.location || undefined,
      isActive: r.isActive,
    }));

    return WeeklyGenerator.generateWeek(
      mondayDate,
      taskInputs,
      subjectInputs,
      recurringRuleInputs,
      userConstraints,
      options
    );
  }

  /**
   * Applies and saves the proposed week into the schedule table
   */
  public static async applyWeekProposal(
    proposal: {
      startDate: string | Date;
      endDate: string | Date;
      macroPhase: string;
      blocks: TimeSlot[];
      sustainabilityScore: number;
      overloadReport: any;
    },
    userId?: string
  ) {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const startDate = new Date(proposal.startDate);
    const endDate = new Date(proposal.endDate);

    // 1. Delete existing flexible blocks in that date range to avoid duplication
    await prisma.scheduleBlock.deleteMany({
      where: {
        userId: user.id,
        startTime: { gte: startDate, lte: endDate },
        isFixed: false,
      },
    });

    // 2. Create WeeklyPlan record
    const weeklyPlan = await prisma.weeklyPlan.create({
      data: {
        userId: user.id,
        startDate,
        endDate,
        macroPhase: proposal.macroPhase,
        status: 'ACTIVO',
        plannedStudyHours: proposal.overloadReport?.studyHours || 15.0,
        sustainabilityScore: proposal.sustainabilityScore,
        overloadLevel: proposal.overloadReport?.level || 'MODERADA',
        sacrificeRecommendation: proposal.overloadReport?.suggestedSacrifices?.join('; ') || null,
      },
    });

    // 3. Persist blocks
    for (const block of proposal.blocks) {
      // Avoid inserting duplicate fixed blocks if they already exist
      const existing = await prisma.scheduleBlock.findFirst({
        where: {
          userId: user.id,
          title: block.title,
          startTime: new Date(block.startTime),
        },
      });

      if (!existing) {
        await prisma.scheduleBlock.create({
          data: {
            weeklyPlanId: weeklyPlan.id,
            userId: user.id,
            title: block.title,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            durationMinutes: block.durationMinutes,
            category: block.category,
            flexibility: block.flexibility,
            isFixed: block.isFixed,
            energyLevel: block.energyLevel,
            justification: block.justification,
          },
        });
      }
    }

    return { success: true, weeklyPlanId: weeklyPlan.id, blockCount: proposal.blocks.length };
  }

  /**
   * Daily breakdown (Morning / Afternoon / Evening)
   */
  /**
   * Daily breakdown (Morning / Afternoon / Evening)
   * Integrates DailyCheckIn energy/fatigue feedback loop
   */
  public static async planDay(targetDate: Date, userId?: string) {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // Fetch closest or matching DailyCheckIn for the requested day, preferring latest created
    let checkin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: user.id,
        date: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!checkin) {
      checkin = await prisma.dailyCheckIn.findFirst({
        where: {
          userId: user.id,
          date: { lte: end },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
    }

    let energyContext: UserEnergyContext | undefined;
    if (checkin) {
      energyContext = {
        date: checkin.date,
        sleepHours: checkin.sleepHours,
        energyLevel: checkin.energyLevel,
        stressLevel: checkin.stressLevel,
        studyHoursDone: checkin.studyHoursDone,
        workoutDone: checkin.workoutDone,
        notes: checkin.notes,
      };
    }

    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        userId: user.id,
        startTime: { gte: start, lte: end },
      },
      orderBy: { startTime: 'asc' },
    });

    const timeSlots: TimeSlot[] = blocks.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: b.durationMinutes,
      category: b.category as any,
      title: b.title,
      isFixed: b.isFixed,
      flexibility: b.flexibility as any,
      energyLevel: b.energyLevel as any,
      justification: b.justification || undefined,
    }));

    const userConstraints = {
      targetWakeTime: user.targetWakeTime,
      maxBedTime: user.maxBedTime,
      targetSleepHours: user.targetSleepHours,
      maxFocusBlockMinutes: user.maxFocusBlockMinutes,
      chunkWorkMinutes: 50,
      chunkBreakMinutes: 10,
      personalBufferRatio: user.personalBufferRatio,
      travelFacultadMinutes: 10,
      travelGymMinutes: 10,
      rugbyPrepTravelMinutes: 90,
      windDownStartTime: '22:30',
    };

    const plan = DailyPlanner.planDay(targetDate, timeSlots, energyContext, userConstraints);

    // If severe fatigue is detected, persist an actionable recommendation in database
    if (plan.fatigueAdjustment?.isFatigued) {
      const existingRec = await prisma.recommendation.findFirst({
        where: {
          userId: user.id,
          type: { in: ['DEFICIT_SUENO', 'DESCANSO_REQUERIDO'] },
          createdAt: { gte: start, lte: end },
        },
      });

      if (!existingRec) {
        const isSleepDeficit = (energyContext?.sleepHours ?? 7.5) < 6.5;
        await prisma.recommendation.create({
          data: {
            userId: user.id,
            type: isSleepDeficit ? 'DEFICIT_SUENO' : 'DESCANSO_REQUERIDO',
            severity:
              (energyContext?.energyLevel ?? 3) <= 1 || (energyContext?.sleepHours ?? 7) < 5.5
                ? 'CRITICAL'
                : 'WARNING',
            title: isSleepDeficit
              ? 'Alerta de Fatiga: Déficit de Sueño Detectado'
              : 'Alerta de Fatiga: Sobrecarga & Estrés Elevado',
            message: `El check-in registró energía ${energyContext?.energyLevel}/5 y ${energyContext?.sleepHours}h de descanso. Se han acotado las sesiones de estudio a máx. 60 min y adelantado el descanso a las 22:00. Se sugiere una siesta estratégica de 20 min o descanso compensatorio.`,
            justification:
              'La saturación cognitiva sin descanso reparador deteriora la consolidación de la memoria y la retención conceptual.',
          },
        });
      }
    }

    return plan;
  }

  /**
   * Replanning options for missed task
   */
  public static async replanTask(taskId: string, currentDate: Date = new Date(), userId?: string) {
    const task = await prisma.academicTask.findUnique({
      where: { id: taskId },
      include: { subject: true, exam: true },
    });
    if (!task) throw new Error('Task not found');

    const targetUserId = userId || task.userId || task.subject.userId;

    const checkin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { lte: currentDate },
      },
      orderBy: { date: 'desc' },
    });

    let energyContext: UserEnergyContext | undefined;
    if (checkin) {
      energyContext = {
        date: checkin.date,
        sleepHours: checkin.sleepHours,
        energyLevel: checkin.energyLevel,
        stressLevel: checkin.stressLevel,
        studyHoursDone: checkin.studyHoursDone,
        workoutDone: checkin.workoutDone,
        notes: checkin.notes,
      };
    }

    const existingBlocks = await prisma.scheduleBlock.findMany({
      where: {
        userId: targetUserId,
        startTime: { gte: currentDate },
      },
    });

    const slots: TimeSlot[] = existingBlocks.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: b.durationMinutes,
      category: b.category as any,
      title: b.title,
      isFixed: b.isFixed,
      flexibility: b.flexibility as any,
      energyLevel: b.energyLevel as any,
    }));

    const taskInput: TaskInput = {
      id: task.id,
      subjectId: task.subjectId,
      subjectName: task.subject.name,
      title: task.title,
      taskType: task.taskType as any,
      estimatedMinutes: task.estimatedMinutes,
      remainingMinutes: task.remainingMinutes,
      energyLevel: task.energyLevel as any,
      dueDate: task.dueDate || undefined,
      examDate: task.exam?.date || undefined,
      subjectMastery: task.subject.masteryLevel as any,
      subjectWeight: task.subject.priorityWeight,
    };

    const user = await prisma.user.findUnique({ where: { id: task.subject.userId } });
    const userConstraints = user
      ? {
          targetWakeTime: user.targetWakeTime,
          maxBedTime: user.maxBedTime,
          targetSleepHours: user.targetSleepHours,
          maxFocusBlockMinutes: user.maxFocusBlockMinutes,
          chunkWorkMinutes: 50,
          chunkBreakMinutes: 10,
          personalBufferRatio: user.personalBufferRatio,
          travelFacultadMinutes: 10,
          travelGymMinutes: 10,
          rugbyPrepTravelMinutes: 90,
          windDownStartTime: '22:30',
        }
      : undefined;

    return Replanner.evaluateMissedTask(taskInput, currentDate, slots, userConstraints, energyContext);
  }
}
