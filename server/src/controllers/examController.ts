import { Request, Response } from 'express';
import { AcademicService } from '../services/academicService';
import { prisma } from '../db';

export class ExamController {
  public static async getExams(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const exams = await AcademicService.getExamsSortedByPriority(refDate);
      res.json(exams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createExam(req: Request, res: Response) {
    try {
      const { subjectId, title, type, date, weight, targetHoursEstimate } = req.body;
      const exam = await AcademicService.createExam({
        subjectId,
        title,
        type: type || 'PARCIAL_1',
        date: new Date(date),
        weight: Number(weight) || 3.0,
        targetHoursEstimate: Number(targetHoursEstimate) || 20.0,
      });
      res.status(201).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateExam(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = { ...req.body };
      if (data.date) data.date = new Date(data.date);
      const updated = await prisma.exam.update({
        where: { id },
        data,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteExam(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.exam.delete({ where: { id } });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
