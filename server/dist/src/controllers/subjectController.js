"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectController = void 0;
const academicService_1 = require("../services/academicService");
const db_1 = require("../db");
class SubjectController {
    static async getSubjects(req, res) {
        try {
            const refDate = req.query.date ? new Date(req.query.date) : new Date('2026-09-02T12:00:00Z');
            const subjects = await academicService_1.AcademicService.getSubjectsWithDetails(refDate);
            res.json(subjects);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getSubjectById(req, res) {
        try {
            const id = req.params.id;
            const subject = await db_1.prisma.subject.findUnique({
                where: { id },
                include: {
                    exams: { orderBy: { date: 'asc' } },
                    topics: { orderBy: { orderIndex: 'asc' } },
                    academicTasks: { orderBy: { priorityScore: 'desc' } },
                },
            });
            if (!subject)
                return res.status(404).json({ error: 'Materia no encontrada' });
            res.json(subject);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createSubject(req, res) {
        try {
            const { name, code, type, color, professor, masteryLevel, priorityWeight } = req.body;
            const subject = await academicService_1.AcademicService.createSubject({
                name,
                code,
                type: type || 'CURSADA',
                color: color || '#3b82f6',
                professor,
                masteryLevel: masteryLevel || 'MEDIO',
                priorityWeight: Number(priorityWeight) || 1.0,
            });
            res.status(201).json(subject);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateSubject(req, res) {
        try {
            const id = req.params.id;
            const updated = await db_1.prisma.subject.update({
                where: { id },
                data: req.body,
            });
            res.json(updated);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteSubject(req, res) {
        try {
            const id = req.params.id;
            await db_1.prisma.subject.delete({ where: { id } });
            res.json({ success: true, id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.SubjectController = SubjectController;
