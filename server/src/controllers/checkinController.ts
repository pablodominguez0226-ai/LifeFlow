import { Request, Response } from 'express';
import { HabitService } from '../services/habitService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class CheckinController {
  public static async getHabits(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const habits = await HabitService.getHabits(userId);
      res.json(habits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async toggleHabit(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { increment } = req.body;
      const habit = await HabitService.toggleHabitStreak(id, Boolean(increment));
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async toggleHabitDate(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ error: 'La fecha YYYY-MM-DD es obligatoria' });
      }
      const habit = await HabitService.toggleHabitDate(id, String(date));
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async createHabit(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { title, category, targetFrequency, frequencyUnit } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'El título del hábito es obligatorio' });
      }
      const habit = await HabitService.createHabit(userId, {
        title,
        category,
        targetFrequency: Number(targetFrequency) || 7,
        frequencyUnit,
      });
      res.status(201).json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateHabit(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const habit = await HabitService.updateHabit(id, req.body);
      res.json(habit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteHabit(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await HabitService.deleteHabit(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async createCheckin(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const {
        date,
        sleepHours,
        energyLevel,
        stressLevel,
        studyHoursDone,
        workoutDone,
        workoutType,
        tradingResult,
        tradingPipsRR,
        tradingNotes,
        dayClosure,
        tomorrowTasks,
        notes,
      } = req.body;

      const checkin = await HabitService.createCheckIn(userId, {
        date: date ? new Date(date) : new Date(),
        sleepHours: Number(sleepHours) || 7.0,
        energyLevel: Number(energyLevel) || 3,
        stressLevel: Number(stressLevel) || 3,
        studyHoursDone: Number(studyHoursDone) || 0.0,
        workoutDone: Boolean(workoutDone),
        workoutType,
        tradingResult,
        tradingPipsRR,
        tradingNotes,
        dayClosure,
        tomorrowTasks: typeof tomorrowTasks === 'string' ? tomorrowTasks : tomorrowTasks ? JSON.stringify(tomorrowTasks) : undefined,
        notes,
      });
      res.status(201).json(checkin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const days = req.query.days ? Number(req.query.days) : 7;
      const history = await HabitService.getCheckIns(days, userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async getPriorityTasks(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const result = await HabitService.getLatestPriorityTasks(userId, date);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async togglePriorityTask(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const taskId = req.params.taskId as string;
      const { completed } = req.body;
      const result = await HabitService.togglePriorityTask(taskId, completed, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async addPriorityTask(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'El texto de la tarea es obligatorio' });
      }
      const result = await HabitService.addPriorityTask(text, userId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

