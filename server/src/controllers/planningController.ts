import { Request, Response } from 'express';
import { PlanningService } from '../services/planningService';

export class PlanningController {
  public static async generateWeek(req: Request, res: Response) {
    try {
      const { mondayDate, enableRugby, enableMarket, gymSessionsTarget } = req.body;
      const targetMonday = mondayDate ? new Date(mondayDate) : new Date('2026-08-31T00:00:00Z');

      const proposal = await PlanningService.generateWeekProposal(targetMonday, {
        enableRugby,
        enableMarket,
        gymSessionsTarget: gymSessionsTarget ? Number(gymSessionsTarget) : undefined,
      });

      res.json(proposal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async applyWeek(req: Request, res: Response) {
    try {
      const { proposal } = req.body;
      if (!proposal || !proposal.blocks) {
        return res.status(400).json({ error: 'Falta la propuesta de semana a aplicar.' });
      }

      const result = await PlanningService.applyWeekProposal(proposal);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async planDay(req: Request, res: Response) {
    try {
      const dateStr = req.body.date || req.query.date;
      const targetDate = dateStr ? new Date(dateStr as string) : new Date('2026-09-02T12:00:00Z');

      const plan = await PlanningService.planDay(targetDate);
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async replan(req: Request, res: Response) {
    try {
      const { taskId, date } = req.body;
      if (!taskId) {
        return res.status(400).json({ error: 'taskId es requerido para replanificar.' });
      }

      const currentDate = date ? new Date(date) : new Date('2026-09-02T12:00:00Z');
      const replanResult = await PlanningService.replanTask(taskId, currentDate);
      res.json(replanResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
