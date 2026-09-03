import { prisma } from '../db';

export class RecurringRuleService {
  /**
   * List all recurring rules for the default user
   */
  public static async getRules() {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('Usuario no encontrado');

    return prisma.recurringScheduleRule.findMany({
      where: { userId: user.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Create a new recurring rule
   */
  public static async createRule(data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    title: string;
    category?: string;
    flexibility?: string;
    isFixed?: boolean;
    energyLevel?: string;
    justification?: string;
    notes?: string;
    location?: string;
    isActive?: boolean;
  }) {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('Usuario no encontrado');

    // Calculate durationMinutes if not provided
    let duration = data.durationMinutes;
    if (!duration && data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(':').map(Number);
      const [eh, em] = data.endTime.split(':').map(Number);
      duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60;
    }

    return prisma.recurringScheduleRule.create({
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
  public static async updateRule(
    id: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      title?: string;
      category?: string;
      flexibility?: string;
      isFixed?: boolean;
      energyLevel?: string;
      justification?: string;
      notes?: string;
      location?: string;
      isActive?: boolean;
    }
  ) {
    let duration = data.durationMinutes;
    if (!duration && data.startTime && data.endTime) {
      const [sh, sm] = data.startTime.split(':').map(Number);
      const [eh, em] = data.endTime.split(':').map(Number);
      duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60;
    }

    return prisma.recurringScheduleRule.update({
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
  public static async deleteRule(id: string) {
    await prisma.recurringScheduleRule.delete({
      where: { id },
    });
    return { success: true };
  }
}
