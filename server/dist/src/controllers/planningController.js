"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningController = void 0;
const planningService_1 = require("../services/planningService");
const date_fns_1 = require("date-fns");
class PlanningController {
    static async generateWeek(req, res) {
        try {
            const { mondayDate, enableRugby, enableMarket, gymSessionsTarget } = req.body;
            const targetMonday = mondayDate
                ? new Date(mondayDate)
                : (0, date_fns_1.startOfWeek)(new Date(), { weekStartsOn: 1 });
            const proposal = await planningService_1.PlanningService.generateWeekProposal(targetMonday, {
                enableRugby,
                enableMarket,
                gymSessionsTarget: gymSessionsTarget ? Number(gymSessionsTarget) : undefined,
            });
            res.json(proposal);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async applyWeek(req, res) {
        try {
            const { proposal } = req.body;
            if (!proposal || !proposal.blocks) {
                return res.status(400).json({ error: 'Falta la propuesta de semana a aplicar.' });
            }
            const result = await planningService_1.PlanningService.applyWeekProposal(proposal);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async planDay(req, res) {
        try {
            const dateStr = req.body?.date || req.query?.date;
            const targetDate = dateStr ? new Date(dateStr) : new Date();
            const plan = await planningService_1.PlanningService.planDay(targetDate);
            res.json(plan);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async replan(req, res) {
        try {
            const { taskId, date } = req.body;
            if (!taskId) {
                return res.status(400).json({ error: 'taskId es requerido para replanificar.' });
            }
            const currentDate = date ? new Date(date) : new Date();
            const replanResult = await planningService_1.PlanningService.replanTask(taskId, currentDate);
            res.json(replanResult);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.PlanningController = PlanningController;
