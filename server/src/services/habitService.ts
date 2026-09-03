import { prisma } from '../db';

export class HabitService {
  public static async getHabits() {
    return prisma.habit.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  public static async toggleHabitStreak(habitId: string, increment: boolean) {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new Error('Habit not found');

    const newStreak = increment ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    return prisma.habit.update({
      where: { id: habitId },
      data: { streak: newStreak },
    });
  }

  public static async createCheckIn(data: {
    date: Date;
    sleepHours: number;
    energyLevel: number;
    stressLevel: number;
    studyHoursDone: number;
    workoutDone: boolean;
    notes?: string;
  }) {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    return prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        ...data,
      },
    });
  }

  public static async getCheckIns(days: number = 7) {
    return prisma.dailyCheckIn.findMany({
      orderBy: { date: 'desc' },
      take: days,
    });
  }
}
