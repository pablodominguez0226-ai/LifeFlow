import { prisma } from '../db';

export class ScheduleService {
  public static async getBlocksForRange(startDate: Date, endDate: Date) {
    return prisma.scheduleBlock.findMany({
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

  public static async createBlock(data: {
    userId?: string;
    title: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    category: string;
    flexibility?: string;
    isFixed?: boolean;
    energyLevel?: string;
    justification?: string;
    academicTaskId?: string;
    activityId?: string;
    weeklyPlanId?: string;
  }) {
    let uid = data.userId;
    if (!uid) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      uid = user.id;
    }

    return prisma.scheduleBlock.create({
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

  public static async updateBlock(
    blockId: string,
    data: Partial<{
      title: string;
      startTime: Date;
      endTime: Date;
      durationMinutes: number;
      category: string;
      status: string;
      justification: string;
    }>
  ) {
    return prisma.scheduleBlock.update({
      where: { id: blockId },
      data,
    });
  }

  public static async deleteBlock(blockId: string) {
    return prisma.scheduleBlock.delete({
      where: { id: blockId },
    });
  }
}
