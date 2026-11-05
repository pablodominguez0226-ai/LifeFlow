import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getHabitsOverview(req: Request, res: Response) {
  try {
    const definitions = await prisma.habitDefinition.findMany({ orderBy: { createdAt: 'asc' } });
    
    // Semana actual: Lun 2/11 al Dom 8/11
    const weekStart = new Date("2026-11-02T00:00:00Z");
    const weekEnd = new Date("2026-11-08T23:59:59Z");
    const today = new Date("2026-11-04T00:00:00Z");

    const logs = await prisma.habitLog.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } }
    });

    const todayDayOfWeek = 3; // Miércoles

    // Formatear grilla semanal y métricas
    const matrix = definitions.map(h => {
      const weekDays = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
        const offset = dayNum === 0 ? 6 : dayNum - 1;
        const curDate = new Date(weekStart);
        curDate.setDate(curDate.getDate() + offset);

        const log = logs.find(l => 
          l.habitKey === h.key && 
          new Date(l.date).toISOString().split('T')[0] === curDate.toISOString().split('T')[0]
        );

        return {
          dayOfWeek: dayNum,
          date: curDate.toISOString().split('T')[0],
          isTarget: h.targetDays.includes(dayNum),
          completed: log ? log.completed : false
        };
      });

      return {
        id: h.id,
        key: h.key,
        name: h.name,
        category: h.category,
        streakDays: h.streakDays,
        targetDays: h.targetDays,
        weekDays
      };
    });

    const habitsToday = matrix.filter(h => h.targetDays.includes(todayDayOfWeek));
    const completedToday = habitsToday.filter(h => h.weekDays.find(d => d.dayOfWeek === todayDayOfWeek)?.completed).length;

    return res.status(200).json({
      activeHabitsCount: definitions.length,
      todayCompletedCount: completedToday,
      todayTotalCount: habitsToday.length,
      maxStreakDays: Math.max(...definitions.map(d => d.streakDays), 0),
      weeklyConsistency: 85,
      checkInToday: habitsToday.map(h => ({
        key: h.key,
        name: h.name,
        completed: h.weekDays.find(d => d.dayOfWeek === todayDayOfWeek)?.completed || false
      })),
      matrix
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBooksOverview(req: Request, res: Response) {
  try {
    const reading = await prisma.book.findFirst({ where: { status: 'READING' } });
    const queued = await prisma.book.findMany({ where: { status: 'QUEUED' }, orderBy: { createdAt: 'asc' } });
    return res.status(200).json({ currentBook: reading, queuedBooks: queued });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function startReadingBook(req: Request, res: Response) {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "bookId requerido" });

    // Pasar cualquier libro activo a cola
    await prisma.book.updateMany({
      where: { status: "READING" },
      data: { status: "QUEUED" }
    });

    // Activar el libro seleccionado
    const activated = await prisma.book.update({
      where: { id: bookId },
      data: { status: "READING" }
    });

    return res.status(200).json({ success: true, book: activated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
