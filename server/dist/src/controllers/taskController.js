"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const academicService_1 = require("../services/academicService");
const db_1 = require("../db");
class TaskController {
    static async getTasks(req, res) {
        try {
            const { subjectId, status } = req.query;
            const where = {};
            if (subjectId)
                where.subjectId = subjectId;
            if (status)
                where.status = status;
            const tasks = await db_1.prisma.academicTask.findMany({
                where,
                include: {
                    subject: true,
                    exam: true,
                    topic: true,
                },
                orderBy: { priorityScore: 'desc' },
            });
            res.json(tasks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createTask(req, res) {
        try {
            const { subjectId, examId, topicId, title, taskType, estimatedMinutes, energyLevel, dueDate } = req.body;
            const task = await academicService_1.AcademicService.createTask({
                subjectId,
                examId,
                topicId,
                title,
                taskType: taskType || 'ESTUDIO_PROFUNDO',
                estimatedMinutes: Number(estimatedMinutes) || 60,
                energyLevel: energyLevel || 'ALTA',
                dueDate: dueDate ? new Date(dueDate) : undefined,
            });
            res.status(201).json(task);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateTask(req, res) {
        try {
            const id = req.params.id;
            const data = { ...req.body };
            if (data.dueDate)
                data.dueDate = new Date(data.dueDate);
            const updated = await db_1.prisma.academicTask.update({
                where: { id },
                data,
            });
            res.json(updated);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateTopicStatus(req, res) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            const updated = await academicService_1.AcademicService.updateTopicStatus(id, status);
            res.json(updated);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteTask(req, res) {
        try {
            const id = req.params.id;
            await db_1.prisma.academicTask.delete({ where: { id } });
            res.json({ success: true, id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.TaskController = TaskController;
