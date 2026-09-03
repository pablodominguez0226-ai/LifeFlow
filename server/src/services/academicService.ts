import { prisma } from '../db';
import { differenceInCalendarDays } from 'date-fns';
import { PriorityScorer } from '../engine/priorityScorer';

export class AcademicService {
  public static async getSubjectsWithDetails(referenceDate: Date = new Date()) {
    const subjects = await prisma.subject.findMany({
      include: {
        exams: {
          orderBy: { date: 'asc' },
        },
        topics: {
          orderBy: { orderIndex: 'asc' },
        },
        academicTasks: {
          orderBy: { priorityScore: 'desc' },
        },
      },
    });

    return subjects.map((subj) => {
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
        if (subj.topics.length > 0) {
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

      return {
        ...subj,
        progress,
        priorityScore: priorityInfo.priorityScore,
        nearestExamDays: priorityInfo.nearestExamDays,
        priorityExplanation: priorityInfo.explanation,
        exams: examsWithDays,
      };
    });
  }

  public static async getExamsSortedByPriority(referenceDate: Date = new Date()) {
    const exams = await prisma.exam.findMany({
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

  public static async createSubject(data: {
    name: string;
    code?: string;
    type: string;
    color: string;
    professor?: string;
    masteryLevel: string;
    priorityWeight: number;
  }) {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    return prisma.subject.create({
      data: {
        userId: user.id,
        ...data,
      },
    });
  }

  public static async createExam(data: {
    subjectId: string;
    title: string;
    type: string;
    date: Date;
    weight: number;
    targetHoursEstimate: number;
  }) {
    return prisma.exam.create({
      data,
    });
  }

  public static async createTask(data: {
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
        ...data,
        remainingMinutes: data.estimatedMinutes,
        priorityScore: priority.totalScore,
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
