import { Request, Response } from 'express';
import { StatsService } from '../services/statsService';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class StatsController {
  public static async getStats(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const userId = (req as AuthenticatedRequest).userId;
      const stats = await StatsService.getWeeklyStatistics(refDate, userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export class RecommendationController {
  public static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const where: any = { dismissed: false };
      if (userId) where.userId = userId;

      const recommendations = await prisma.recommendation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async dismissRecommendation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await prisma.recommendation.update({
        where: { id },
        data: { dismissed: true },
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
