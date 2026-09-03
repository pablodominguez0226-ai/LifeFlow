"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicService = void 0;
const db_1 = require("../db");
const date_fns_1 = require("date-fns");
const priorityScorer_1 = require("../engine/priorityScorer");
class AcademicService {
    static async getSubjectsWithDetails(referenceDate = new Date()) {
        const subjects = await db_1.prisma.subject.findMany({
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
                const daysRemaining = (0, date_fns_1.differenceInCalendarDays)(exam.date, referenceDate);
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
                    const completedTopics = subj.topics.filter((t) => t.status === 'DOMINADO' || t.status === 'REPASAR').length;
                    progress = Math.round((completedTopics / subj.topics.length) * 100);
                }
                else {
                    progress = 0;
                }
            }
            // Priority calculation from engine
            const priorityInfo = priorityScorer_1.PriorityScorer.calculateSubjectPriority({
                id: subj.id,
                name: subj.name,
                type: subj.type,
                masteryLevel: subj.masteryLevel,
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
                remainingStudyHours: Math.max(5, subj.exams.reduce((acc, curr) => acc + (curr.targetHoursEstimate - curr.completedHours), 0)),
            }, referenceDate);
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
    static async getExamsSortedByPriority(referenceDate = new Date()) {
        const exams = await db_1.prisma.exam.findMany({
            include: {
                subject: true,
            },
            orderBy: {
                date: 'asc',
            },
        });
        return exams.map((exam) => {
            const daysRemaining = (0, date_fns_1.differenceInCalendarDays)(exam.date, referenceDate);
            return {
                ...exam,
                subjectName: exam.subject.name,
                subjectColor: exam.subject.color,
                daysRemaining,
                isUrgent: daysRemaining <= 14,
            };
        }).sort((a, b) => a.daysRemaining - b.daysRemaining);
    }
    static async createSubject(data) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('No user found');
        return db_1.prisma.subject.create({
            data: {
                userId: user.id,
                ...data,
            },
        });
    }
    static async createExam(data) {
        return db_1.prisma.exam.create({
            data,
        });
    }
    static async createTask(data) {
        const subject = await db_1.prisma.subject.findUnique({
            where: { id: data.subjectId },
            include: { exams: true },
        });
        if (!subject)
            throw new Error('Subject not found');
        const exam = data.examId
            ? subject.exams.find((e) => e.id === data.examId)
            : subject.exams[0];
        // Calculate priority score using engine
        const priority = priorityScorer_1.PriorityScorer.calculateTaskPriority({
            id: 'temp',
            subjectId: subject.id,
            subjectName: subject.name,
            title: data.title,
            taskType: data.taskType,
            estimatedMinutes: data.estimatedMinutes,
            remainingMinutes: data.estimatedMinutes,
            energyLevel: data.energyLevel,
            dueDate: data.dueDate,
            examId: exam?.id,
            examDate: exam?.date,
            subjectMastery: subject.masteryLevel,
            subjectWeight: subject.priorityWeight,
        });
        return db_1.prisma.academicTask.create({
            data: {
                ...data,
                remainingMinutes: data.estimatedMinutes,
                priorityScore: priority.totalScore,
            },
        });
    }
    static async updateTaskStatus(taskId, status) {
        return db_1.prisma.academicTask.update({
            where: { id: taskId },
            data: { status },
        });
    }
    static async updateTopicStatus(topicId, status) {
        return db_1.prisma.topic.update({
            where: { id: topicId },
            data: { status },
        });
    }
}
exports.AcademicService = AcademicService;
