"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamController = void 0;
const academicService_1 = require("../services/academicService");
const db_1 = require("../db");
class ExamController {
    static async getExams(req, res) {
        try {
            const refDate = req.query.date ? new Date(req.query.date) : new Date();
            const exams = await academicService_1.AcademicService.getExamsSortedByPriority(refDate);
            res.json(exams);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createExam(req, res) {
        try {
            const { subjectId, title, type, date, weight, targetHoursEstimate } = req.body;
            const exam = await academicService_1.AcademicService.createExam({
                subjectId,
                title,
                type: type || 'PARCIAL_1',
                date: new Date(date),
                weight: Number(weight) || 3.0,
                targetHoursEstimate: Number(targetHoursEstimate) || 20.0,
            });
            res.status(201).json(exam);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateExam(req, res) {
        try {
            const id = req.params.id;
            const data = { ...req.body };
            if (data.date)
                data.date = new Date(data.date);
            const updated = await db_1.prisma.exam.update({
                where: { id },
                data,
            });
            res.json(updated);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteExam(req, res) {
        try {
            const id = req.params.id;
            await db_1.prisma.exam.delete({ where: { id } });
            res.json({ success: true, id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.ExamController = ExamController;
