import ical, { ICalCalendarMethod } from 'ical-generator';
import { PrismaClient } from '@prisma/client';
import { subDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

export interface IcsFeedOptions {
  pastDays?: number;
  futureDays?: number;
}

export class IcalService {
  /**
   * Generates a standard RFC 5545 iCalendar (.ics) string containing
   * all scheduled blocks for the given user within the specified window.
   */
  public static async generateIcsFeed(
    userId?: string,
    options: IcsFeedOptions = {}
  ): Promise<string> {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();

    if (!user) {
      throw new Error('Usuario no encontrado para generar el feed de calendario.');
    }

    const pastDays = options.pastDays ?? 14; // Include 2 weeks of history
    const futureDays = options.futureDays ?? 60; // Include next 2 months of planning

    const now = new Date();
    const fromDate = subDays(now, pastDays);
    const toDate = addDays(now, futureDays);

    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        activity: true,
        academicTask: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const calendar = ical({
      name: 'LifeFlow Agenda Personal',
      description: 'Agenda inteligente y planning engine sincronizado de LifeFlow (Academia, Gimnasio, Hábitos y Descanso)',
      method: ICalCalendarMethod.PUBLISH,
      timezone: 'America/Argentina/Buenos_Aires',
      prodId: {
        company: 'LifeFlow',
        product: 'LifeFlow Agenda Personal',
        language: 'ES',
      },
    });

    for (const block of blocks) {
      // Build clear, informative description with flexibility and cognitive justification
      const descLines: string[] = [
        `📌 Categoría: ${block.category}`,
        `🔒 Flexibilidad: ${block.flexibility}${block.isFixed ? ' (Bloque Fijo Inamovible)' : ' (Reubicable)'}`,
        `⚡ Exigencia de Energía: ${block.energyLevel}`,
      ];

      if (block.academicTask?.subject) {
        descLines.push(`📚 Asignatura: ${block.academicTask.subject.name}`);
      }

      if (block.justification) {
        descLines.push(`🎯 Justificación Cognitiva: ${block.justification}`);
      }

      if (block.status) {
        descLines.push(`📊 Estado: ${block.status}`);
      }

      let location = '';
      if (block.category === 'ACADEMIA') location = 'Facultad';
      else if (block.category === 'GIMNASIO') location = 'Gimnasio';
      else if (block.category === 'DEPORTE') location = 'Club / Cancha';

      calendar.createEvent({
        id: `${block.id}@lifeflow.app`,
        start: block.startTime,
        end: block.endTime,
        summary: `[${block.category}] ${block.title}`,
        description: descLines.join('\n'),
        location: location || undefined,
        categories: [{ name: block.category }],
      });
    }

    return calendar.toString();
  }
}
