"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const planningService_1 = require("../services/planningService");
class DashboardController {
    static async getSummary(req, res) {
        try {
            const dateQuery = req.query.date;
            const refDate = dateQuery ? new Date(dateQuery) : new Date('2026-09-02T12:00:00Z');
            const data = await planningService_1.PlanningService.getDashboardSummary(refDate);
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.DashboardController = DashboardController;
