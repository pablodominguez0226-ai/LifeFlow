import { Request, Response } from 'express';
import { StatsService } from '../services/statsService';
import { prisma } from '../db';

export class StatsController {
  public static async getStats(req: Request, res: Response) {
    try {
      const refDate = req.query.date ? new Date(req.query.date as string) : new Date('2026-09-02T12:00:00Z');
      const stats = await StatsService.getWeeklyStatistics(refDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export class RecommendationController {
  public static async getRecommendations(req: Request, res: Response) {
    try {
      const recommendations = await prisma.recommendation.findMany({
        where: { dismissed: false },
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
