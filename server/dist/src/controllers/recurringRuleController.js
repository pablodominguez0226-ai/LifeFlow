"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringRuleController = void 0;
const recurringRuleService_1 = require("../services/recurringRuleService");
class RecurringRuleController {
    static async getRules(req, res) {
        try {
            const rules = await recurringRuleService_1.RecurringRuleService.getRules();
            res.json(rules);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createRule(req, res) {
        try {
            const rule = await recurringRuleService_1.RecurringRuleService.createRule(req.body);
            res.status(201).json(rule);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateRule(req, res) {
        try {
            const id = req.params.id;
            const rule = await recurringRuleService_1.RecurringRuleService.updateRule(id, req.body);
            res.json(rule);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteRule(req, res) {
        try {
            const id = req.params.id;
            const result = await recurringRuleService_1.RecurringRuleService.deleteRule(id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.RecurringRuleController = RecurringRuleController;
