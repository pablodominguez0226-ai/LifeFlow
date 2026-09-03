"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringRuleService = void 0;
const db_1 = require("../db");
class RecurringRuleService {
    /**
     * List all recurring rules for the default user
     */
    static async getRules() {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('Usuario no encontrado');
        return db_1.prisma.recurringScheduleRule.findMany({
            where: { userId: user.id },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }
    /**
     * Create a new recurring rule
     */
    static async createRule(data) {
        const user = await db_1.prisma.user.findFirst();
        if (!user)
            throw new Error('Usuario no encontrado');
        // Calculate durationMinutes if not provided
        let duration = data.durationMinutes;
        if (!duration && data.startTime && data.endTime) {
            const [sh, sm] = data.startTime.split(':').map(Number);
            const [eh, em] = data.endTime.split(':').map(Number);
            duration = (eh * 60 + em) - (sh * 60 + sm);
            if (duration < 0)
                duration += 24 * 60;
        }
        return db_1.prisma.recurringScheduleRule.create({
            data: {
                userId: user.id,
                dayOfWeek: Number(data.dayOfWeek),
                startTime: data.startTime,
                endTime: data.endTime,
                durationMinutes: duration || 60,
                title: data.title,
                category: data.category || 'ACADEMIA',
                flexibility: data.flexibility || 'FIJA',
                isFixed: data.isFixed !== undefined ? Boolean(data.isFixed) : true,
                energyLevel: data.energyLevel || 'ALTA',
                justification: data.justification || null,
                notes: data.notes || null,
                location: data.location || null,
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            },
        });
    }
    /**
     * Update a recurring rule
     */
    static async updateRule(id, data) {
        let duration = data.durationMinutes;
        if (!duration && data.startTime && data.endTime) {
            const [sh, sm] = data.startTime.split(':').map(Number);
            const [eh, em] = data.endTime.split(':').map(Number);
            duration = (eh * 60 + em) - (sh * 60 + sm);
            if (duration < 0)
                duration += 24 * 60;
        }
        return db_1.prisma.recurringScheduleRule.update({
            where: { id },
            data: {
                ...(data.dayOfWeek !== undefined && { dayOfWeek: Number(data.dayOfWeek) }),
                ...(data.startTime && { startTime: data.startTime }),
                ...(data.endTime && { endTime: data.endTime }),
                ...(duration !== undefined && { durationMinutes: duration }),
                ...(data.title && { title: data.title }),
                ...(data.category && { category: data.category }),
                ...(data.flexibility && { flexibility: data.flexibility }),
                ...(data.isFixed !== undefined && { isFixed: Boolean(data.isFixed) }),
                ...(data.energyLevel && { energyLevel: data.energyLevel }),
                ...(data.justification !== undefined && { justification: data.justification }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
            },
        });
    }
    /**
     * Delete a recurring rule
     */
    static async deleteRule(id) {
        await db_1.prisma.recurringScheduleRule.delete({
            where: { id },
        });
        return { success: true };
    }
}
exports.RecurringRuleService = RecurringRuleService;
