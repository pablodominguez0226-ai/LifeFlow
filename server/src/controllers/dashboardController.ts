import { Request, Response } from 'express';
import { PlanningService } from '../services/planningService';

export class DashboardController {
  public static async getSummary(req: Request, res: Response) {
    try {
      const dateQuery = req.query.date as string;
      const refDate = dateQuery ? new Date(dateQuery) : new Date();
      const data = await PlanningService.getDashboardSummary(refDate);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
