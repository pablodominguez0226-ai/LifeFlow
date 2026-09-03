"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const scheduleService_1 = require("../services/scheduleService");
const icalService_1 = require("../services/icalService");
const date_fns_1 = require("date-fns");
class CalendarController {
    static async getIcsFeed(req, res) {
        try {
            const { futureDays, pastDays, download } = req.query;
            const icsData = await icalService_1.IcalService.generateIcsFeed(undefined, {
                futureDays: futureDays ? Number(futureDays) : undefined,
                pastDays: pastDays ? Number(pastDays) : undefined,
            });
            const disposition = download === 'true' ? 'attachment' : 'inline';
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
            res.setHeader('Content-Disposition', `${disposition}; filename="lifeflow-calendar.ics"`);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.send(icsData);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getBlocks(req, res) {
        try {
            const { start, end, date } = req.query;
            let startDate;
            let endDate;
            if (start) {
                startDate = new Date(start);
            }
            else if (date) {
                startDate = (0, date_fns_1.startOfWeek)(new Date(date), { weekStartsOn: 1 });
            }
            else {
                startDate = (0, date_fns_1.startOfWeek)(new Date(), { weekStartsOn: 1 });
            }
            if (end) {
                endDate = new Date(end);
            }
            else {
                endDate = (0, date_fns_1.endOfWeek)(startDate, { weekStartsOn: 1 });
            }
            const blocks = await scheduleService_1.ScheduleService.getBlocksForRange(startDate, endDate);
            res.json(blocks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createBlock(req, res) {
        try {
            const { title, startTime, endTime, durationMinutes, category, flexibility, isFixed, energyLevel, justification, academicTaskId, } = req.body;
            const block = await scheduleService_1.ScheduleService.createBlock({
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
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateBlock(req, res) {
        try {
            const id = req.params.id;
            const updates = req.body;
            if (updates.startTime)
                updates.startTime = new Date(updates.startTime);
            if (updates.endTime)
                updates.endTime = new Date(updates.endTime);
            const block = await scheduleService_1.ScheduleService.updateBlock(id, updates);
            res.json(block);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteBlock(req, res) {
        try {
            const id = req.params.id;
            await scheduleService_1.ScheduleService.deleteBlock(id);
            res.json({ success: true, id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.CalendarController = CalendarController;
