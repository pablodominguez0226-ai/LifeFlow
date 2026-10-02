import { Request, Response } from 'express';
import { AiService } from '../services/aiService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AiController {
  public static async getDailyBriefing(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const userId = (req as AuthenticatedRequest).userId;
      const briefing = await AiService.getDailyBriefing(refDate, userId);
      res.json(briefing);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
