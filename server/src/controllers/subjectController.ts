import { Request, Response } from 'express';
import { AcademicService } from '../services/academicService';
import { prisma } from '../db';

export class SubjectController {
  public static async getSubjects(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date('2026-09-02T12:00:00Z');
      const subjects = await AcademicService.getSubjectsWithDetails(refDate);
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async getSubjectById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          exams: { orderBy: { date: 'asc' } },
          topics: { orderBy: { orderIndex: 'asc' } },
          academicTasks: { orderBy: { priorityScore: 'desc' } },
        },
      });
      if (!subject) return res.status(404).json({ error: 'Materia no encontrada' });
      res.json(subject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createSubject(req: Request, res: Response) {
    try {
      const { name, code, type, color, professor, masteryLevel, priorityWeight } = req.body;
      const subject = await AcademicService.createSubject({
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
}
