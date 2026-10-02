import { Request, Response } from 'express';
import { AcademicService } from '../services/academicService';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class TaskController {
  public static async getTasks(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { subjectId, status } = req.query;
      const where: any = {};
      if (userId) where.userId = userId;
      if (subjectId) where.subjectId = subjectId as string;
      if (status) where.status = status as string;

      const tasks = await prisma.academicTask.findMany({
        where,
        include: {
          subject: true,
          exam: true,
          topic: true,
        },
        orderBy: { priorityScore: 'desc' },
      });

      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createTask(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { subjectId, examId, topicId, title, taskType, estimatedMinutes, energyLevel, dueDate } = req.body;
      const task = await AcademicService.createTask({
        userId,
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = { ...req.body };
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      const updated = await prisma.academicTask.update({
        where: { id },
        data,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateTopicStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const updated = await AcademicService.updateTopicStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.academicTask.delete({ where: { id } });
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
