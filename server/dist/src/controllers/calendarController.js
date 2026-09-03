"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const scheduleService_1 = require("../services/scheduleService");
class CalendarController {
    static async getBlocks(req, res) {
        try {
            const { start, end } = req.query;
            const startDate = start ? new Date(start) : new Date('2026-08-31T00:00:00Z');
            const endDate = end ? new Date(end) : new Date('2026-09-07T23:59:59Z');
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
