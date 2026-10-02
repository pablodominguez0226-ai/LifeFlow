import { prisma } from '../db';
import { differenceInCalendarDays } from 'date-fns';
import { PriorityScorer } from '../engine/priorityScorer';

export class AcademicService {
  public static async getSubjectsWithDetails(referenceDate: Date = new Date(), userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        exams: {
          orderBy: { date: 'asc' },
        },
        topics: {
          orderBy: { orderIndex: 'asc' },
        },
        units: {
          include: {
            topics: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { unitNumber: 'asc' },
        },
        academicTasks: {
          orderBy: { priorityScore: 'desc' },
        },
      },
    });

    return Promise.all(
      subjects.map(async (subj) => {
        // Calculate dynamic days remaining for exams
        const examsWithDays = subj.exams.map((exam) => {
          const daysRemaining = differenceInCalendarDays(exam.date, referenceDate);
          return {
            ...exam,
            daysRemaining,
            isUrgent: daysRemaining <= 14,
          };
        });

        // Calculate progress percentage
        let progress = subj.progressManualOverride;
        if (progress === null || progress === undefined) {
          const allUnitTopics = subj.units.flatMap((u) => u.topics);
          if (allUnitTopics.length > 0) {
            const completed = allUnitTopics.filter(
              (t) => t.status === 'DOMINADO' || t.status === 'REVISION_PENDIENTE'
            ).length;
            progress = Math.round((completed / allUnitTopics.length) * 100);
          } else if (subj.topics.length > 0) {
            const completedTopics = subj.topics.filter(
              (t) => t.status === 'DOMINADO' || t.status === 'REPASAR'
            ).length;
            progress = Math.round((completedTopics / subj.topics.length) * 100);
          } else {
            progress = 0;
          }
        }

        // Priority calculation from engine
        const priorityInfo = PriorityScorer.calculateSubjectPriority(
          {
            id: subj.id,
            name: subj.name,
            type: subj.type as 'CURSADA' | 'FINAL',
            masteryLevel: subj.masteryLevel as 'BAJO' | 'MEDIO' | 'ALTO',
            priorityWeight: subj.priorityWeight,
            exams: subj.exams.map((e) => ({
              id: e.id,
              subjectId: e.subjectId,
              subjectName: subj.name,
              title: e.title,
              type: e.type,
              date: e.date,
              weight: e.weight,
              targetHoursEstimate: e.targetHoursEstimate,
              completedHours: e.completedHours,
            })),
            pendingTasksCount: subj.academicTasks.filter((t) => t.status !== 'COMPLETADA').length,
            remainingStudyHours: Math.max(
              5,
              subj.exams.reduce((acc, curr) => acc + (curr.targetHoursEstimate - curr.completedHours), 0)
            ),
          },
          referenceDate
        );

        if (subj.priorityScore !== priorityInfo.priorityScore) {
          await prisma.subject.update({
            where: { id: subj.id },
            data: { priorityScore: priorityInfo.priorityScore },
          });
        }

        return {
          ...subj,
          progress,
          priorityScore: priorityInfo.priorityScore,
          nearestExamDays: priorityInfo.nearestExamDays,
          priorityExplanation: priorityInfo.explanation,
          exams: examsWithDays,
        };
      })
    );
  }

  public static async getExamsSortedByPriority(referenceDate: Date = new Date(), userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return exams.map((exam) => {
      const daysRemaining = differenceInCalendarDays(exam.date, referenceDate);
      return {
        ...exam,
        subjectName: exam.subject.name,
        subjectColor: exam.subject.color,
        daysRemaining,
        isUrgent: daysRemaining <= 14,
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  public static async createSubject(
    userId: string | undefined,
    data: {
      name: string;
      code?: string;
      type: string;
      color: string;
      professor?: string;
      masteryLevel: string;
      priorityWeight: number;
    }
  ) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    return prisma.subject.create({
      data: {
        userId: targetUserId,
        ...data,
      },
    });
  }

  public static async recalculateSubjectPriority(subjectId: string, referenceDate: Date = new Date()) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        exams: { orderBy: { date: 'asc' } },
        academicTasks: true,
      },
    });

    if (!subject) return null;

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
      referenceDate
    );

    // Persist priorityScore in SQLite Subject table
    await prisma.subject.update({
      where: { id: subjectId },
      data: {
        priorityScore: priorityInfo.priorityScore,
      },
    });

    // Recalculate and persist priorityScore for all tasks of this subject
    for (const task of subject.academicTasks) {
      const exam = task.examId ? subject.exams.find((e) => e.id === task.examId) : subject.exams[0];
      const taskPriority = PriorityScorer.calculateTaskPriority(
        {
          id: task.id,
          subjectId: subject.id,
          subjectName: subject.name,
          title: task.title,
          taskType: task.taskType as any,
          estimatedMinutes: task.estimatedMinutes,
          remainingMinutes: task.remainingMinutes,
          energyLevel: task.energyLevel as any,
          dueDate: task.dueDate || undefined,
          examId: exam?.id,
          examDate: exam?.date,
          subjectMastery: subject.masteryLevel as any,
          subjectWeight: subject.priorityWeight,
        },
        referenceDate
      );

      await prisma.academicTask.update({
        where: { id: task.id },
        data: { priorityScore: taskPriority.totalScore },
      });
    }

    return priorityInfo;
  }

  public static async createExam(
    data: {
      userId?: string;
      subjectId: string;
      title: string;
      type: string;
      date: Date;
      weight: number;
      targetHoursEstimate: number;
      completedHours?: number;
      notes?: string;
    },
    referenceDate: Date = new Date()
  ) {
    let targetUserId = data.userId;
    if (!targetUserId) {
      const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
      targetUserId = subject?.userId;
    }
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('Usuario no encontrado');
      targetUserId = user.id;
    }

    const exam = await prisma.exam.create({
      data: {
        userId: targetUserId,
        subjectId: data.subjectId,
        title: data.title,
        type: data.type,
        date: data.date,
        weight: data.weight,
        targetHoursEstimate: data.targetHoursEstimate,
        completedHours: data.completedHours || 0,
        notes: data.notes,
      },
      include: {
        subject: true,
      },
    });

    const priorityInfo = await this.recalculateSubjectPriority(data.subjectId, referenceDate);
    const daysRemaining = differenceInCalendarDays(exam.date, referenceDate);

    return {
      ...exam,
      subjectName: exam.subject.name,
      subjectColor: exam.subject.color,
      daysRemaining,
      nearestExamDays: priorityInfo?.nearestExamDays ?? daysRemaining,
      subjectPriorityScore: priorityInfo?.priorityScore,
      isUrgent: daysRemaining <= 14,
    };
  }

  public static async updateExam(
    id: string,
    data: {
      subjectId?: string;
      title?: string;
      type?: string;
      date?: Date;
      weight?: number;
      targetHoursEstimate?: number;
      completedHours?: number;
      isCompleted?: boolean;
      notes?: string | null;
    },
    referenceDate: Date = new Date()
  ) {
    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Examen no encontrado');
    }
    const oldSubjectId = existing.subjectId;

    const updated = await prisma.exam.update({
      where: { id },
      data,
      include: {
        subject: true,
      },
    });

    const priorityInfo = await this.recalculateSubjectPriority(updated.subjectId, referenceDate);
    if (oldSubjectId !== updated.subjectId) {
      await this.recalculateSubjectPriority(oldSubjectId, referenceDate);
    }

    const daysRemaining = differenceInCalendarDays(updated.date, referenceDate);

    return {
      ...updated,
      subjectName: updated.subject.name,
      subjectColor: updated.subject.color,
      daysRemaining,
      nearestExamDays: priorityInfo?.nearestExamDays ?? daysRemaining,
      subjectPriorityScore: priorityInfo?.priorityScore,
      isUrgent: daysRemaining <= 14,
    };
  }

  public static async deleteExam(id: string, referenceDate: Date = new Date()) {
    const exam = await prisma.exam.findUnique({
      where: { id },
    });
    if (!exam) {
      throw new Error('Examen no encontrado');
    }

    const subjectId = exam.subjectId;

    // Disassociate academic tasks before deleting exam to ensure SQLite referential integrity
    await prisma.academicTask.updateMany({
      where: { examId: id },
      data: { examId: null },
    });

    await prisma.exam.delete({
      where: { id },
    });

    const priorityInfo = await this.recalculateSubjectPriority(subjectId, referenceDate);

    return {
      success: true,
      id,
      subjectId,
      nearestExamDays: priorityInfo?.nearestExamDays ?? null,
      subjectPriorityScore: priorityInfo?.priorityScore ?? 0,
    };
  }

  public static async createTask(data: {
    userId?: string;
    subjectId: string;
    examId?: string;
    topicId?: string;
    title: string;
    taskType: string;
    estimatedMinutes: number;
    energyLevel: string;
    dueDate?: Date;
  }) {
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
      include: { exams: true },
    });
    if (!subject) throw new Error('Subject not found');

    let targetUserId = data.userId || subject.userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('Usuario no encontrado');
      targetUserId = user.id;
    }

    const exam = data.examId
      ? subject.exams.find((e) => e.id === data.examId)
      : subject.exams[0];

    // Calculate priority score using engine
    const priority = PriorityScorer.calculateTaskPriority({
      id: 'temp',
      subjectId: subject.id,
      subjectName: subject.name,
      title: data.title,
      taskType: data.taskType as any,
      estimatedMinutes: data.estimatedMinutes,
      remainingMinutes: data.estimatedMinutes,
      energyLevel: data.energyLevel as any,
      dueDate: data.dueDate,
      examId: exam?.id,
      examDate: exam?.date,
      subjectMastery: subject.masteryLevel as any,
      subjectWeight: subject.priorityWeight,
    });

    return prisma.academicTask.create({
      data: {
        userId: targetUserId,
        subjectId: data.subjectId,
        examId: data.examId,
        topicId: data.topicId,
        title: data.title,
        taskType: data.taskType,
        estimatedMinutes: data.estimatedMinutes,
        remainingMinutes: data.estimatedMinutes,
        priorityScore: priority.totalScore,
        energyLevel: data.energyLevel,
        dueDate: data.dueDate,
      },
    });
  }

  public static async updateTaskStatus(taskId: string, status: string) {
    return prisma.academicTask.update({
      where: { id: taskId },
      data: { status },
    });
  }

  public static async updateTopicStatus(topicId: string, status: string) {
    return prisma.topic.update({
      where: { id: topicId },
      data: { status },
    });
  }
}
