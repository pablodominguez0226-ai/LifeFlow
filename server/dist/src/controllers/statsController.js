"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = exports.StatsController = void 0;
const statsService_1 = require("../services/statsService");
const db_1 = require("../db");
class StatsController {
    static async getStats(req, res) {
        try {
            const refDate = req.query.date ? new Date(req.query.date) : new Date('2026-09-02T12:00:00Z');
            const stats = await statsService_1.StatsService.getWeeklyStatistics(refDate);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.StatsController = StatsController;
class RecommendationController {
    static async getRecommendations(req, res) {
        try {
            const recommendations = await db_1.prisma.recommendation.findMany({
                where: { dismissed: false },
                orderBy: { createdAt: 'desc' },
            });
            res.json(recommendations);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async dismissRecommendation(req, res) {
        try {
            const id = req.params.id;
            const updated = await db_1.prisma.recommendation.update({
                where: { id },
                data: { dismissed: true },
            });
            res.json(updated);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.RecommendationController = RecommendationController;
