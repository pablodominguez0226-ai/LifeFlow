"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitService = void 0;
const db_1 = require("../db");
class HabitService {
    static async getHabits() {
        return db_1.prisma.habit.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }
    static async toggleHabitStreak(habitId, increment) {
        const habit = await db_1.prisma.habit.findUnique({ where: { id: habitId } });
        if (!habit)
            throw new Error('Habit not found');
        const newStreak = increment ? habit.streak + 1 : Math.max(0, habit.streak - 1);
        return db_1.prisma.habit.update({
            where: { id: habitId },
            data: { streak: newStreak },
        });
    }
    static async createCheckIn(data) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('No user found');
        return db_1.prisma.dailyCheckIn.create({
            data: {
                userId: user.id,
                ...data,
            },
        });
    }
    static async getCheckIns(days = 7) {
        return db_1.prisma.dailyCheckIn.findMany({
            orderBy: { date: 'desc' },
            take: days,
        });
    }
}
exports.HabitService = HabitService;
