import { Request, Response } from 'express';
import { ScheduleService } from '../services/scheduleService';
import { IcalService } from '../services/icalService';
import { startOfWeek, endOfWeek } from 'date-fns';

export class CalendarController {
  public static async getIcsFeed(req: Request, res: Response) {
    try {
      const { futureDays, pastDays, download } = req.query;
      const icsData = await IcalService.generateIcsFeed(undefined, {
        futureDays: futureDays ? Number(futureDays) : undefined,
        pastDays: pastDays ? Number(pastDays) : undefined,
      });

      const disposition = download === 'true' ? 'attachment' : 'inline';
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `${disposition}; filename="lifeflow-calendar.ics"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      res.send(icsData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  public static async getBlocks(req: Request, res: Response) {
    try {
      const { start, end, date } = req.query;
      let startDate: Date;
      let endDate: Date;

      if (start) {
        startDate = new Date(start as string);
      } else if (date) {
        startDate = startOfWeek(new Date(date as string), { weekStartsOn: 1 });
      } else {
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      }

      if (end) {
        endDate = new Date(end as string);
      } else {
        endDate = endOfWeek(startDate, { weekStartsOn: 1 });
      }

      const blocks = await ScheduleService.getBlocksForRange(startDate, endDate);
      res.json(blocks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public static async createBlock(req: Request, res: Response) {
    try {
      const {
        title,
        startTime,
        endTime,
        durationMinutes,
        category,
        flexibility,
        isFixed,
        energyLevel,
        justification,
        academicTaskId,
      } = req.body;

      const block = await ScheduleService.createBlock({
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes: Number(durationMinutes),
        category: category || 'ACADEMIA',
        flexibility,
        isFixed: Boolean(isFixed),
        energyLevel,
        justification,
        academicTaskId,
      });

      res.status(201).json(block);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async updateBlock(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updates = req.body;
      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);

      const block = await ScheduleService.updateBlock(id, updates);
      res.json(block);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async deleteBlock(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await ScheduleService.deleteBlock(id);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
