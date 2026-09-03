"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const db_1 = require("../db");
class ScheduleService {
    static async getBlocksForRange(startDate, endDate) {
        return db_1.prisma.scheduleBlock.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                academicTask: true,
                activity: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });
    }
    static async createBlock(data) {
        let uid = data.userId;
        if (!uid) {
            const user = await db_1.prisma.user.findFirst();
            if (!user)
                throw new Error('No user found');
            uid = user.id;
        }
        return db_1.prisma.scheduleBlock.create({
            data: {
                userId: uid,
                title: data.title,
                startTime: data.startTime,
                endTime: data.endTime,
                durationMinutes: data.durationMinutes,
                category: data.category,
                flexibility: data.flexibility || 'FLEXIBLE',
                isFixed: data.isFixed || false,
                energyLevel: data.energyLevel || 'MEDIA',
                justification: data.justification,
                academicTaskId: data.academicTaskId,
                activityId: data.activityId,
                weeklyPlanId: data.weeklyPlanId,
            },
        });
    }
    static async updateBlock(blockId, data) {
        return db_1.prisma.scheduleBlock.update({
            where: { id: blockId },
            data,
        });
    }
    static async deleteBlock(blockId) {
        return db_1.prisma.scheduleBlock.delete({
            where: { id: blockId },
        });
    }
}
exports.ScheduleService = ScheduleService;
