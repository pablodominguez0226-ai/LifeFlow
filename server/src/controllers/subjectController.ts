import { Request, Response } from 'express';
import { AcademicService } from '../services/academicService';
import { prisma } from '../db';
import { differenceInCalendarDays } from 'date-fns';
import { PriorityScorer } from '../engine/priorityScorer';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class SubjectController {
  public static async getSubjects(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const userId = (req as AuthenticatedRequest).userId;
      const subjects = await AcademicService.getSubjectsWithDetails(refDate, userId);
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async getSubjectById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          exams: { orderBy: { date: 'asc' } },
          topics: { orderBy: { orderIndex: 'asc' } },
          units: {
            include: {
              topics: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { unitNumber: 'asc' },
          },
          academicTasks: { orderBy: { priorityScore: 'desc' } },
        },
      });
      if (!subject) return res.status(404).json({ error: 'Materia no encontrada' });

      const examsWithDays = subject.exams.map((exam) => {
        const daysRemaining = differenceInCalendarDays(exam.date, refDate);
        return {
          ...exam,
          daysRemaining,
          isUrgent: daysRemaining <= 14,
        };
      });

      let progress = subject.progressManualOverride;
      if (progress === null || progress === undefined) {
        const allUnitTopics = subject.units.flatMap((u) => u.topics);
        if (allUnitTopics.length > 0) {
          const completed = allUnitTopics.filter(
            (t) => t.status === 'DOMINADO' || t.status === 'REVISION_PENDIENTE'
          ).length;
          progress = Math.round((completed / allUnitTopics.length) * 100);
        } else if (subject.topics.length > 0) {
          const completedTopics = subject.topics.filter(
            (t) => t.status === 'DOMINADO' || t.status === 'REPASAR'
          ).length;
          progress = Math.round((completedTopics / subject.topics.length) * 100);
        } else {
          progress = 0;
        }
      }

      const priorityInfo = PriorityScorer.calculateSubjectPriority(
        {
          id: subject.id,
          name: subject.name,
          type: subject.type as 'CURSADA' | 'FINAL',
          masteryLevel: subject.masteryLevel as 'BAJO' | 'MEDIO' | 'ALTO',
          priorityWeight: subject.priorityWeight,
          exams: subject.exams.map((e) => ({
            id: e.id,
            subjectId: e.subjectId,
            subjectName: subject.name,
            title: e.title,
            type: e.type,
            date: e.date,
            weight: e.weight,
            targetHoursEstimate: e.targetHoursEstimate,
            completedHours: e.completedHours,
          })),
          pendingTasksCount: subject.academicTasks.filter((t) => t.status !== 'COMPLETADA').length,
          remainingStudyHours: Math.max(
            5,
            subject.exams.reduce((acc, curr) => acc + (curr.targetHoursEstimate - curr.completedHours), 0)
          ),
        },
        refDate
      );

      res.json({
        ...subject,
        progress,
        priorityScore: priorityInfo.priorityScore,
        nearestExamDays: priorityInfo.nearestExamDays,
        priorityExplanation: priorityInfo.explanation,
        exams: examsWithDays,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createSubject(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { name, code, type, color, professor, masteryLevel, priorityWeight } = req.body;
      const subject = await AcademicService.createSubject(userId, {
        name,
        code,
        type: type || 'CURSADA',
        color: color || '#3b82f6',
        professor,
        masteryLevel: masteryLevel || 'MEDIO',
        priorityWeight: Number(priorityWeight) || 1.0,
      });
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateSubject(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await prisma.subject.update({
        where: { id },
        data: req.body,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteSubject(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.subject.delete({ where: { id } });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async logFocusSession(req: Request, res: Response) {
    try {
      const subjectId = req.params.id as string;
      const { minutes, taskId, examId, notes } = req.body;
      const sessionMinutes = Math.max(1, Number(minutes) || 50);
      const sessionHours = Math.round((sessionMinutes / 60) * 10) / 10;

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          exams: { orderBy: { date: 'asc' } },
          academicTasks: true,
        },
      });

      if (!subject) {
        return res.status(404).json({ error: 'Materia no encontrada' });
      }

      // 1. Update target exam completedHours
      const targetExam = examId
        ? subject.exams.find((e) => e.id === examId)
        : subject.exams[0];

      if (targetExam) {
        const newCompleted = Math.round((targetExam.completedHours + sessionHours) * 10) / 10;
        await prisma.exam.update({
          where: { id: targetExam.id },
          data: { completedHours: newCompleted },
        });
      }

      // 2. If a specific task is provided, decrement remainingMinutes or mark completed
      let matchedTaskId: string | undefined = taskId;
      if (!matchedTaskId && subject.academicTasks.length > 0) {
        const pendingTask = subject.academicTasks.find((t) => t.status !== 'COMPLETADA');
        if (pendingTask) matchedTaskId = pendingTask.id;
      }

      if (matchedTaskId) {
        const task = subject.academicTasks.find((t) => t.id === matchedTaskId);
        if (task) {
          const newRemaining = Math.max(0, task.remainingMinutes - sessionMinutes);
          await prisma.academicTask.update({
            where: { id: matchedTaskId },
            data: {
              remainingMinutes: newRemaining,
              status: newRemaining === 0 ? 'COMPLETADA' : task.status,
            },
          });
        }
      }

      // 3. Update subject manual progress if set
      if (subject.progressManualOverride !== null && subject.progressManualOverride !== undefined) {
        const bumpedProgress = Math.min(100, Math.round(subject.progressManualOverride + 2.5));
        await prisma.subject.update({
          where: { id: subjectId },
          data: { progressManualOverride: bumpedProgress },
        });
      }

      // 4. Update or create today's DailyCheckIn studyHoursDone and create a completed ScheduleBlock
      const authUserId = (req as AuthenticatedRequest).userId || subject.userId;
      const user = authUserId ? await prisma.user.findUnique({ where: { id: authUserId } }) : await prisma.user.findFirst();
      if (user) {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const existingCheckin = await prisma.dailyCheckIn.findFirst({
          where: {
            userId: user.id,
            date: { gte: startOfDay, lte: endOfDay },
          },
        });

        if (existingCheckin) {
          await prisma.dailyCheckIn.update({
            where: { id: existingCheckin.id },
            data: {
              studyHoursDone: Math.round((existingCheckin.studyHoursDone + sessionHours) * 10) / 10,
            },
          });
        } else {
          await prisma.dailyCheckIn.create({
            data: {
              userId: user.id,
              date: now,
              studyHoursDone: sessionHours,
              sleepHours: user.targetSleepHours || 7.5,
              energyLevel: 4,
              stressLevel: 2,
              workoutDone: false,
              notes: notes || 'Sesión de Foco Inmediato',
            },
          });
        }

        // Record completed ScheduleBlock in calendar
        const startTime = new Date(now.getTime() - sessionMinutes * 60000);
        await prisma.scheduleBlock.create({
          data: {
            userId: user.id,
            title: `Foco: ${subject.name}`,
            startTime,
            endTime: now,
            durationMinutes: sessionMinutes,
            category: 'ACADEMIA',
            flexibility: 'FLEXIBLE',
            status: 'COMPLETADO',
            energyLevel: 'ALTA',
            justification: `Sesión de foco completada (${sessionMinutes} min)`,
            isFixed: false,
          },
        });
      }

      // 5. Recalculate and persist subject priority
      await AcademicService.recalculateSubjectPriority(subjectId);

      const updatedSubject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          exams: { orderBy: { date: 'asc' } },
          topics: { orderBy: { orderIndex: 'asc' } },
          academicTasks: true,
        },
      });

      res.json({
        success: true,
        minutesLogged: sessionMinutes,
        hoursLogged: sessionHours,
        subject: updatedSubject,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
