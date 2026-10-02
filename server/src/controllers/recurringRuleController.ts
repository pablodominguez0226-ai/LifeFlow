import { Request, Response } from 'express';
import { RecurringRuleService } from '../services/recurringRuleService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class RecurringRuleController {
  public static async getRules(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const rules = await RecurringRuleService.getRules(userId);
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createRule(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const rule = await RecurringRuleService.createRule(userId, req.body);
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const rule = await RecurringRuleService.updateRule(id, req.body);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await RecurringRuleService.deleteRule(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
