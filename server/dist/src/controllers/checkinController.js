"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinController = void 0;
const habitService_1 = require("../services/habitService");
class CheckinController {
    static async getHabits(req, res) {
        try {
            const habits = await habitService_1.HabitService.getHabits();
            res.json(habits);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async toggleHabit(req, res) {
        try {
            const id = req.params.id;
            const { increment } = req.body;
            const habit = await habitService_1.HabitService.toggleHabitStreak(id, Boolean(increment));
            res.json(habit);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async createCheckin(req, res) {
        try {
            const { date, sleepHours, energyLevel, stressLevel, studyHoursDone, workoutDone, notes } = req.body;
            const checkin = await habitService_1.HabitService.createCheckIn({
                date: date ? new Date(date) : new Date('2026-09-02T12:00:00Z'),
                sleepHours: Number(sleepHours) || 7.0,
                energyLevel: Number(energyLevel) || 3,
                stressLevel: Number(stressLevel) || 3,
                studyHoursDone: Number(studyHoursDone) || 0.0,
                workoutDone: Boolean(workoutDone),
                notes,
            });
            res.status(201).json(checkin);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const days = req.query.days ? Number(req.query.days) : 7;
            const history = await habitService_1.HabitService.getCheckIns(days);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.CheckinController = CheckinController;
