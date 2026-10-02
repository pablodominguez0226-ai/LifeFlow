import { Request, Response } from 'express';
import { PlanningService } from '../services/planningService';
import { startOfWeek } from 'date-fns';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class PlanningController {
  public static async generateWeek(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { mondayDate, enableRugby, enableMarket, gymSessionsTarget } = req.body;
      const targetMonday = mondayDate
        ? new Date(mondayDate)
        : startOfWeek(new Date(), { weekStartsOn: 1 });

      const proposal = await PlanningService.generateWeekProposal(
        targetMonday,
        {
          enableRugby,
          enableMarket,
          gymSessionsTarget: gymSessionsTarget ? Number(gymSessionsTarget) : undefined,
        },
        userId
      );

      res.json(proposal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async applyWeek(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { proposal } = req.body;
      if (!proposal || !proposal.blocks) {
        return res.status(400).json({ error: 'Falta la propuesta de semana a aplicar.' });
      }

      const result = await PlanningService.applyWeekProposal(proposal, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async planDay(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const dateStr = req.body?.date || req.query?.date;
      const targetDate = dateStr ? new Date(dateStr as string) : new Date();

      const plan = await PlanningService.planDay(targetDate, userId);
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async replan(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const { taskId, date } = req.body;
      if (!taskId) {
        return res.status(400).json({ error: 'taskId es requerido para replanificar.' });
      }

      const currentDate = date ? new Date(date) : new Date();
      const replanResult = await PlanningService.replanTask(taskId, currentDate, userId);
      res.json(replanResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
