import { Request, Response } from 'express';
import { AcademicService } from '../services/academicService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class ExamController {
  public static async getExams(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const userId = (req as AuthenticatedRequest).userId;
      const exams = await AcademicService.getExamsSortedByPriority(refDate, userId);
      res.json(exams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createExam(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { subjectId, title, type, date, weight, targetHoursEstimate, completedHours, notes } = req.body;
      if (!subjectId || !title || !date) {
        return res.status(400).json({ error: 'subjectId, title y date son requeridos' });
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }

      const parsedWeight = weight !== undefined ? Math.min(5, Math.max(1, Number(weight))) : 3.0;
      const parsedHours = targetHoursEstimate !== undefined ? Math.max(1, Number(targetHoursEstimate)) : 20.0;
      const parsedCompleted = completedHours !== undefined ? Math.max(0, Number(completedHours)) : 0.0;

      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const exam = await AcademicService.createExam(
        {
          userId,
          subjectId,
          title: String(title).trim(),
          type: type || 'PARCIAL_1',
          date: parsedDate,
          weight: parsedWeight,
          targetHoursEstimate: parsedHours,
          completedHours: parsedCompleted,
          notes: notes ? String(notes) : undefined,
        },
        refDate
      );
      res.status(201).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateExam(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { subjectId, title, type, date, weight, targetHoursEstimate, completedHours, isCompleted, notes } = req.body;

      const data: any = {};
      if (subjectId !== undefined) data.subjectId = subjectId;
      if (title !== undefined) data.title = String(title).trim();
      if (type !== undefined) data.type = type;
      if (date !== undefined) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: 'Fecha inválida' });
        }
        data.date = parsedDate;
      }
      if (weight !== undefined) data.weight = Math.min(5, Math.max(1, Number(weight)));
      if (targetHoursEstimate !== undefined) data.targetHoursEstimate = Math.max(1, Number(targetHoursEstimate));
      if (completedHours !== undefined) data.completedHours = Math.max(0, Number(completedHours));
      if (isCompleted !== undefined) data.isCompleted = Boolean(isCompleted);
      if (notes !== undefined) data.notes = notes ? String(notes) : null;

      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const updated = await AcademicService.updateExam(id, data, refDate);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteExam(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const result = await AcademicService.deleteExam(id, refDate);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

