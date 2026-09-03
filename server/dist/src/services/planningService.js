"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningService = void 0;
const db_1 = require("../db");
const date_fns_1 = require("date-fns");
const engine_1 = require("../engine");
class PlanningService {
    /**
     * Builds the comprehensive Dashboard "Hoy" payload
     */
    static async getDashboardSummary(referenceDate = new Date('2026-09-02T12:00:00Z')) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('No user found');
        // 1. Get today's checkin if exists
        const todayCheckin = await db_1.prisma.dailyCheckIn.findFirst({
            where: {
                date: {
                    gte: new Date('2026-09-02T00:00:00Z'),
                    lte: new Date('2026-09-02T23:59:59Z'),
                },
            },
        });
        // 2. Get today's schedule blocks
        const todayBlocks = await db_1.prisma.scheduleBlock.findMany({
            where: {
                startTime: {
                    gte: new Date('2026-09-02T00:00:00Z'),
                    lte: new Date('2026-09-02T23:59:59Z'),
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
        if (plannedStudyHours > 6)
            dayLoadLevel = 'ALTA';
        else if (plannedStudyHours > 9)
            dayLoadLevel = 'EXCESIVA';
        else if (plannedStudyHours <= 3)
            dayLoadLevel = 'BAJA';
        // 6. Upcoming exams
        const exams = await db_1.prisma.exam.findMany({
            include: { subject: true },
            orderBy: { date: 'asc' },
        });
        const upcomingExams = exams.map((exam) => {
            const daysRemaining = Math.ceil((exam.date.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));
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
        const recommendations = await db_1.prisma.recommendation.findMany({
            where: { dismissed: false },
            orderBy: { createdAt: 'desc' },
            take: 4,
        });
        return {
            currentDate: referenceDate,
            currentTime: (0, date_fns_1.format)(referenceDate, 'HH:mm'),
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
            },
            upcomingExams: upcomingExams.slice(0, 5),
            recommendations,
        };
    }
    /**
     * Generates a proposal using the Planning Engine
     */
    static async generateWeekProposal(mondayDate, options = {}) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('No user found');
        const subjects = await db_1.prisma.subject.findMany({
            include: { exams: true, academicTasks: true },
        });
        const tasks = await db_1.prisma.academicTask.findMany({
            where: { status: { not: 'COMPLETADA' } },
            include: { subject: true, exam: true },
        });
        const taskInputs = tasks.map((t) => ({
            id: t.id,
            subjectId: t.subjectId,
            subjectName: t.subject.name,
            title: t.title,
            taskType: t.taskType,
            estimatedMinutes: t.estimatedMinutes,
            remainingMinutes: t.remainingMinutes,
            energyLevel: t.energyLevel,
            dueDate: t.dueDate || undefined,
            examId: t.examId || undefined,
            examDate: t.exam?.date || undefined,
            subjectMastery: t.subject.masteryLevel,
            subjectWeight: t.subject.priorityWeight,
        }));
        const subjectInputs = subjects.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            masteryLevel: s.masteryLevel,
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
        const userConstraints = {
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
        return engine_1.WeeklyGenerator.generateWeek(mondayDate, taskInputs, subjectInputs, userConstraints, options);
    }
    /**
     * Applies and saves the proposed week into the schedule table
     */
    static async applyWeekProposal(proposal) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('No user found');
        const startDate = new Date(proposal.startDate);
        const endDate = new Date(proposal.endDate);
        // 1. Delete existing flexible blocks in that date range to avoid duplication
        await db_1.prisma.scheduleBlock.deleteMany({
            where: {
                userId: user.id,
                startTime: { gte: startDate, lte: endDate },
                isFixed: false,
            },
        });
        // 2. Create WeeklyPlan record
        const weeklyPlan = await db_1.prisma.weeklyPlan.create({
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
            const existing = await db_1.prisma.scheduleBlock.findFirst({
                where: {
                    userId: user.id,
                    title: block.title,
                    startTime: new Date(block.startTime),
                },
            });
            if (!existing) {
                await db_1.prisma.scheduleBlock.create({
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
    static async planDay(targetDate) {
        const start = new Date(targetDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);
        const blocks = await db_1.prisma.scheduleBlock.findMany({
            where: {
                startTime: { gte: start, lte: end },
            },
            orderBy: { startTime: 'asc' },
        });
        const timeSlots = blocks.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            durationMinutes: b.durationMinutes,
            category: b.category,
            title: b.title,
            isFixed: b.isFixed,
            flexibility: b.flexibility,
            energyLevel: b.energyLevel,
            justification: b.justification || undefined,
        }));
        return engine_1.DailyPlanner.planDay(targetDate, timeSlots);
    }
    /**
     * Replanning options for missed task
     */
    static async replanTask(taskId, currentDate = new Date('2026-09-02T12:00:00Z')) {
        const task = await db_1.prisma.academicTask.findUnique({
            where: { id: taskId },
            include: { subject: true, exam: true },
        });
        if (!task)
            throw new Error('Task not found');
        const existingBlocks = await db_1.prisma.scheduleBlock.findMany({
            where: { startTime: { gte: currentDate } },
        });
        const slots = existingBlocks.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            durationMinutes: b.durationMinutes,
            category: b.category,
            title: b.title,
            isFixed: b.isFixed,
            flexibility: b.flexibility,
            energyLevel: b.energyLevel,
        }));
        const taskInput = {
            id: task.id,
            subjectId: task.subjectId,
            subjectName: task.subject.name,
            title: task.title,
            taskType: task.taskType,
            estimatedMinutes: task.estimatedMinutes,
            remainingMinutes: task.remainingMinutes,
            energyLevel: task.energyLevel,
            dueDate: task.dueDate || undefined,
            examDate: task.exam?.date || undefined,
            subjectMastery: task.subject.masteryLevel,
            subjectWeight: task.subject.priorityWeight,
        };
        return engine_1.Replanner.evaluateMissedTask(taskInput, currentDate, slots);
    }
}
exports.PlanningService = PlanningService;
