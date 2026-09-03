import { Request, Response } from 'express';
import { HabitService } from '../services/habitService';

export class CheckinController {
  public static async getHabits(req: Request, res: Response) {
    try {
      const habits = await HabitService.getHabits();
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

  public static async createCheckin(req: Request, res: Response) {
    try {
      const { date, sleepHours, energyLevel, stressLevel, studyHoursDone, workoutDone, notes } = req.body;
      const checkin = await HabitService.createCheckIn({
        date: date ? new Date(date) : new Date('2026-09-02T12:00:00Z'),
        sleepHours: Number(sleepHours) || 7.0,
        energyLevel: Number(energyLevel) || 3,
        stressLevel: Number(stressLevel) || 3,
        studyHoursDone: Number(studyHoursDone) || 0.0,
        workoutDone: Boolean(workoutDone),
        notes,
      });
      res.status(201).json(checkin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async getHistory(req: Request, res: Response) {
    try {
      const days = req.query.days ? Number(req.query.days) : 7;
      const history = await HabitService.getCheckIns(days);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
