import { Request, Response } from 'express';
import { prisma } from '../db';
import { Category, SlotStatus } from '@prisma/client';
import { SchedulerService } from '../services/scheduler.service';
import { differenceInCalendarDays } from 'date-fns';

export class PlannerController {
  /**
   * Helper para asegurar que existan datos iniciales en la base de datos
   * (Rutinas Fijas, Exámenes y Progreso Académico).
   */
  private static async ensureInitialSeed() {
    const routineCount = await prisma.fixedRoutine.count();
    if (routineCount === 0) {
      // Días: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 0=Domingo
      const defaultRoutines = [];
      for (let day = 0; day <= 6; day++) {
        defaultRoutines.push(
          { title: 'Despertar 07:00 AM', category: Category.REST, dayOfWeek: day, startTime: '07:00', endTime: '07:30', isFlexible: false },
          { title: 'Operar Trading NYSE', category: Category.TRADING, dayOfWeek: day, startTime: '10:00', endTime: '11:30', isFlexible: false }
        );
        // De lunes a viernes: cursado
        if (day >= 1 && day <= 5) {
          defaultRoutines.push({
            title: 'Cursado Facultad',
            category: Category.ACADEMIC_CLASS,
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '17:30',
            isFlexible: false,
          });
        }
        // Gimnasio: Lunes (1), Martes (2), Jueves (4), Viernes (5)
        if ([1, 2, 4, 5].includes(day)) {
          defaultRoutines.push({
            title: 'Gimnasio',
            category: Category.GYM,
            dayOfWeek: day,
            startTime: '15:00',
            endTime: '17:00',
            isFlexible: true,
          });
        }
        // Correr: Miércoles (3), Sábado (6), Domingo (0)
        if ([3, 6, 0].includes(day)) {
          defaultRoutines.push({
            title: 'Salir a Correr',
            category: Category.GYM,
            dayOfWeek: day,
            startTime: day === 3 ? '18:00' : '09:00',
            endTime: day === 3 ? '19:00' : '10:00',
            isFlexible: false,
          });
        }
      }
      await prisma.fixedRoutine.createMany({ data: defaultRoutines });
    }

    const examCount = await prisma.exam.count();
    if (examCount === 0) {
      const now = new Date();
      await prisma.exam.createMany({
        data: [
          { subject: 'Paradigmas de Programación', type: '1.º Parcial', date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), weight: 1.5 },
          { subject: 'Sistemas Operativos', type: '1.º Parcial', date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000), weight: 1.2 },
          { subject: 'Diseño de Sistemas', type: '2.º Parcial', date: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000), weight: 1.0 },
          { subject: 'Investigación Operativa', type: 'Final Global', date: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000), weight: 1.0 },
        ],
      });
    }

    const progressCount = await prisma.academicProgress.count();
    if (progressCount === 0) {
      await prisma.academicProgress.createMany({
        data: [
          { subject: 'Paradigmas de Programación', progressPerc: 65 },
          { subject: 'Sistemas Operativos', progressPerc: 40 },
          { subject: 'Diseño de Sistemas', progressPerc: 80 },
          { subject: 'Investigación Operativa', progressPerc: 25 },
        ],
      });
    }
  }

  /**
   * GET /api/planner/pre-check
   * Retorna datos de pre-auditoría para el Asistente Interactivo de Planificación Semanal:
   * a) Exámenes de la semana y próximos 35 días con días restantes.
   * b) Rutinas fijas activas (cursados, gym, running, trading, bots/ia).
   */
  public static async getPreCheck(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      let monday: Date;
      if (typeof req.query.startDate === 'string' && req.query.startDate.trim()) {
        const parts = req.query.startDate.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          monday = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        } else {
          monday = new Date(req.query.startDate);
          monday.setHours(0, 0, 0, 0);
        }
      } else {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
      }

      const weekEnd = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // a) Exámenes de la base de datos
      const allExams = await prisma.exam.findMany({
        orderBy: { date: 'asc' },
      });

      const examsThisWeek = allExams
        .filter((e) => {
          const d = new Date(e.date);
          return d >= monday && d < weekEnd;
        })
        .map((e) => ({
          id: e.id,
          subject: e.subject,
          type: e.type,
          date: e.date,
          weight: e.weight,
          daysRemaining: differenceInCalendarDays(new Date(e.date), now),
        }));

      const upcomingExams35Days = allExams
        .map((e) => ({
          id: e.id,
          subject: e.subject,
          type: e.type,
          date: e.date,
          weight: e.weight,
          daysRemaining: differenceInCalendarDays(new Date(e.date), now),
        }))
        .filter((e) => e.daysRemaining >= 0 && e.daysRemaining <= 35);

      // b) Rutinas fijas activas
      const routines = await prisma.fixedRoutine.findMany({
        orderBy: { startTime: 'asc' },
      });

      const lunClass = routines.find(
        (r) =>
          r.dayOfWeek === 1 &&
          (r.category === Category.ACADEMIC_CLASS ||
            r.title.toLowerCase().includes('facultad') ||
            r.title.toLowerCase().includes('paradigmas'))
      );
      const jueClass = routines.find(
        (r) =>
          r.dayOfWeek === 4 &&
          (r.category === Category.ACADEMIC_CLASS ||
            r.title.toLowerCase().includes('facultad') ||
            r.title.toLowerCase().includes('noche'))
      );
      const vieClass = routines.find(
        (r) =>
          r.dayOfWeek === 5 &&
          (r.category === Category.ACADEMIC_CLASS || r.title.toLowerCase().includes('facultad'))
      );

      const defaultClasses = [
        {
          id: lunClass ? lunClass.id : 'class-lun',
          day: 'Lunes',
          time: lunClass ? `${lunClass.startTime} - ${lunClass.endTime}` : '08:00 - 12:00',
          subject: 'Paradigmas',
          active: true,
        },
        {
          id: jueClass ? jueClass.id : 'class-jue',
          day: 'Jueves',
          time: jueClass ? `${jueClass.startTime} - ${jueClass.endTime}` : '19:30 - 22:30',
          subject: 'Cursado Noche',
          active: true,
        },
        {
          id: vieClass ? vieClass.id : 'class-vie',
          day: 'Viernes',
          time: vieClass ? `${vieClass.startTime} - ${vieClass.endTime}` : '08:00 - 12:00',
          subject: 'Facultad / Parcial',
          active: true,
        },
      ];

      const gymRoutines = routines.filter(
        (r) => r.category === Category.GYM && !r.title.toLowerCase().includes('correr')
      );
      const rawGymDays =
        gymRoutines.length > 0
          ? Array.from(new Set(gymRoutines.map((r) => r.dayOfWeek))).sort((a, b) => a - b)
          : [1, 2, 4, 5];
      // Regla estricta: Gimnasio nunca en Miércoles (3)
      const gymDays = rawGymDays.filter((d) => d !== 3);

      const runningRoutines = routines.filter((r) => r.title.toLowerCase().includes('correr'));
      const rawRunningDays =
        runningRoutines.length > 0
          ? Array.from(new Set(runningRoutines.map((r) => r.dayOfWeek)))
          : [3, 6, 0];
      const runningDays = Array.from(new Set([...rawRunningDays, 3])).sort((a, b) => a - b);

      return res.json({
        startDate: monday.toISOString().split('T')[0],
        examsThisWeek,
        upcomingExams35Days,
        defaultClasses,
        gymDays,
        runningDays,
      });
    } catch (error: any) {
      console.error('Error in getPreCheck:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/planner/summary
   * Retorna horas reales vs planificadas de estudio, ratio de hábitos de los últimos 7 días y veredicto.
   */
  public static async getWeeklySummary(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Obtener el plan activo o slots de los últimos 7 días
      const activePlan = await prisma.weeklyPlan.findFirst({
        where: { isActive: true },
        include: {
          slots: true,
        },
      });

      const slots = activePlan ? activePlan.slots : await prisma.plannedSlot.findMany({
        where: {
          start: { gte: sevenDaysAgo },
        },
      });

      // Calcular horas planificadas vs reales de STUDY_DEEP
      let plannedMinutes = 0;
      let completedMinutes = 0;

      for (const slot of slots) {
        if (slot.category === Category.STUDY_DEEP) {
          const duration = Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / (1000 * 60));
          plannedMinutes += duration;
          if (slot.status === SlotStatus.COMPLETED) {
            completedMinutes += duration;
          }
        }
      }

      const plannedStudyHours = Number((plannedMinutes / 60).toFixed(1));
      const completedStudyHours = Number((completedMinutes / 60).toFixed(1));
      const studyHoursRatio = plannedStudyHours > 0 ? Number((completedStudyHours / plannedStudyHours).toFixed(2)) : 0;

      // 2. Ratio de hábitos en los últimos 7 días
      // 4 hábitos diarios esperados: wake_up_7am, trading_10am, reading, gym -> 28 registros esperados en 7 días
      const sevenDaysDateOnly = new Date(Date.UTC(
        sevenDaysAgo.getUTCFullYear(),
        sevenDaysAgo.getUTCMonth(),
        sevenDaysAgo.getUTCDate()
      ));

      const habitLogs = await prisma.habitLog.findMany({
        where: {
          date: { gte: sevenDaysDateOnly },
          completed: true,
        },
      });

      const habitsCompleted = habitLogs.length;
      const expectedHabits = 28; // 4 hábitos * 7 días
      const consistencyRate = Math.min(100, Math.round((habitsCompleted / expectedHabits) * 100));

      // 3. Veredicto (Excelente, Regular, Crítico)
      let verdict = 'Regular';
      if (consistencyRate >= 75 && (studyHoursRatio >= 0.7 || plannedStudyHours === 0)) {
        verdict = 'Excelente';
      } else if (consistencyRate < 45 || (studyHoursRatio < 0.35 && plannedStudyHours > 5)) {
        verdict = 'Crítico';
      }

      return res.json({
        verdict,
        consistencyRate,
        habitsCompleted,
        plannedStudyHours,
        completedStudyHours,
        studyHoursRatio,
      });
    } catch (error: any) {
      console.error('Error in getWeeklySummary:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /api/planner/generate
   * Genera el plan semanal respetando las personalizaciones del Wizard:
   * - startDate: string
   * - classesConfig: { id, day, active, subject, time }[]
   * - gymDays: number[]
   * - runningDays: number[]
   * - specialEvent?: { date: string, startTime: string, endTime?: string, reason: string }
   * - fixedBlocks?: { trading?: boolean, bots?: boolean, reading?: boolean }
   * - studyWeights?: Record<string, number>
   */
  public static async generateWeeklyPlan(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      const {
        startDate,
        classesConfig,
        gymDays,
        runningDays,
        specialEvent,
        fixedBlocks,
        studyWeights,
      } = req.body || {};

      let planStart: Date;
      if (typeof startDate === 'string' && startDate.trim()) {
        const parts = startDate.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          planStart = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        } else {
          planStart = new Date(startDate);
          planStart.setHours(0, 0, 0, 0);
        }
      } else {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        planStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
      }

      const planEnd = new Date(planStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Desactivar planes anteriores
      await prisma.weeklyPlan.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Crear nuevo plan semanal
      const plan = await prisma.weeklyPlan.create({
        data: {
          startDate: planStart,
          endDate: planEnd,
          isActive: true,
        },
      });

      const routines = await prisma.fixedRoutine.findMany();
      const exams = await prisma.exam.findMany({ orderBy: { date: 'asc' } });

      const targetGymDays: number[] = (Array.isArray(gymDays) ? gymDays : [1, 2, 4, 5]).filter((d) => d !== 3);
      const targetRunningDays: number[] = Array.isArray(runningDays) ? runningDays : [3, 6, 0];

      const slotsToInsert: any[] = [];

      // Iterar por los 7 días de la semana (Lunes a Domingo)
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDay = new Date(planStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const dayOfWeek = currentDay.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
        const dateStr = currentDay.toISOString().split('T')[0];

        // Verificar si este día tiene evento especial / viaje
        const isTravelDay =
          specialEvent &&
          (specialEvent.date === dateStr ||
            (dayOfWeek === 5 &&
              (specialEvent.date?.toLowerCase()?.includes('vie') ||
                specialEvent.date === '2026-11-06')));

        let travelStart: Date | null = null;
        let travelEnd: Date | null = null;

        if (isTravelDay) {
          const [sH, sM] = (specialEvent.startTime || '13:00').split(':').map(Number);
          const [eH, eM] = (specialEvent.endTime || '23:00').split(':').map(Number);

          travelStart = new Date(currentDay);
          travelStart.setHours(sH, sM, 0, 0);

          travelEnd = new Date(currentDay);
          travelEnd.setHours(eH, eM, 0, 0);

          slotsToInsert.push({
            weeklyPlanId: plan.id,
            title: specialEvent.reason || 'Viaje / Evento Especial',
            category: Category.PERSONAL,
            subject: null,
            start: travelStart,
            end: travelEnd,
            status: SlotStatus.PENDING,
            isAutoSlot: false,
          });
        }

        // Helper para chequear si un bloque choca con el viaje
        const isBlockedByTravel = (startTimeStr: string, endTimeStr: string) => {
          if (!isTravelDay || !travelStart || !travelEnd) return false;
          const [bSH, bSM] = startTimeStr.split(':').map(Number);
          const [bEH, bEM] = endTimeStr.split(':').map(Number);
          const bStart = new Date(currentDay);
          bStart.setHours(bSH, bSM, 0, 0);
          const bEnd = new Date(currentDay);
          bEnd.setHours(bEH, bEM, 0, 0);
          return bStart < travelEnd && bEnd > travelStart;
        };

        // 1. Despertar + Rutina Matutina (07:00 - 08:00)
        if (!isBlockedByTravel('07:00', '08:00')) {
          const wStart = new Date(currentDay);
          wStart.setHours(7, 0, 0, 0);
          const wEnd = new Date(currentDay);
          wEnd.setHours(8, 0, 0, 0);
          slotsToInsert.push({
            weeklyPlanId: plan.id,
            title: 'Despertar + Rutina Matutina',
            category: Category.PERSONAL,
            subject: null,
            start: wStart,
            end: wEnd,
            status: SlotStatus.PENDING,
            isAutoSlot: false,
          });
        }

        // 2. Cursados de Facultad
        if (dayOfWeek === 1) {
          // Lunes Mañana (08:00 - 12:00)
          const lunCfg = classesConfig?.find((c: any) => c.day === 'Lunes' || c.dayOfWeek === 1);
          if (!lunCfg || lunCfg.active !== false) {
            const cStart = new Date(currentDay);
            cStart.setHours(8, 0, 0, 0);
            const cEnd = new Date(currentDay);
            cEnd.setHours(12, 0, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Cursado Facultad (Paradigmas)',
              category: Category.ACADEMIC_CLASS,
              subject: 'Paradigmas',
              start: cStart,
              end: cEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        } else if (dayOfWeek === 4) {
          // Jueves Noche (19:30 - 22:30)
          const jueCfg = classesConfig?.find((c: any) => c.day === 'Jueves' || c.dayOfWeek === 4);
          if (!jueCfg || jueCfg.active !== false) {
            const cStart = new Date(currentDay);
            cStart.setHours(19, 30, 0, 0);
            const cEnd = new Date(currentDay);
            cEnd.setHours(22, 30, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Cursado Facultad (Noche)',
              category: Category.ACADEMIC_CLASS,
              subject: 'Cursado Noche',
              start: cStart,
              end: cEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        } else if (dayOfWeek === 5) {
          // Viernes Mañana (08:00 - 12:00)
          const examOnDay = exams.find((e) => {
            const ed = new Date(e.date);
            return (
              ed.getFullYear() === currentDay.getFullYear() &&
              ed.getMonth() === currentDay.getMonth() &&
              ed.getDate() === currentDay.getDate()
            );
          });

          const cStart = new Date(currentDay);
          cStart.setHours(8, 0, 0, 0);
          const cEnd = new Date(currentDay);
          cEnd.setHours(12, 0, 0, 0);

          if (examOnDay) {
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: `Parcial: ${examOnDay.subject} (${examOnDay.type})`,
              category: Category.ACADEMIC_CLASS,
              subject: examOnDay.subject,
              start: cStart,
              end: cEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          } else {
            const vieCfg = classesConfig?.find((c: any) => c.day === 'Viernes' || c.dayOfWeek === 5);
            if (!vieCfg || vieCfg.active !== false) {
              slotsToInsert.push({
                weeklyPlanId: plan.id,
                title: 'Cursado Facultad',
                category: Category.ACADEMIC_CLASS,
                subject: 'Facultad',
                start: cStart,
                end: cEnd,
                status: SlotStatus.PENDING,
                isAutoSlot: false,
              });
            }
          }
        }

        // 3. Trading 10:00 AM (Activo aun en cursado, Lunes a Viernes)
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && (!fixedBlocks || fixedBlocks.trading !== false)) {
          if (!isBlockedByTravel('10:00', '11:00')) {
            const tStart = new Date(currentDay);
            tStart.setHours(10, 0, 0, 0);
            const tEnd = new Date(currentDay);
            tEnd.setHours(11, 0, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Operar Trading (Mercado)',
              category: Category.TRADING,
              subject: null,
              start: tStart,
              end: tEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        }

        // 4. Gimnasio (15:00 - 17:00)
        if (targetGymDays.includes(dayOfWeek)) {
          if (!isBlockedByTravel('15:00', '17:00')) {
            const gStart = new Date(currentDay);
            gStart.setHours(15, 0, 0, 0);
            const gEnd = new Date(currentDay);
            gEnd.setHours(17, 0, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Gimnasio',
              category: Category.GYM,
              subject: null,
              start: gStart,
              end: gEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        }

        // 5. Salir a Correr (Miércoles 18:00, Sáb/Dom 09:00)
        if (targetRunningDays.includes(dayOfWeek)) {
          const runStartTime = dayOfWeek === 3 ? '18:00' : '09:00';
          const runEndTime = dayOfWeek === 3 ? '19:00' : '10:00';
          if (!isBlockedByTravel(runStartTime, runEndTime)) {
            const [rH, rM] = runStartTime.split(':').map(Number);
            const [reH, reM] = runEndTime.split(':').map(Number);
            const rStart = new Date(currentDay);
            rStart.setHours(rH, rM, 0, 0);
            const rEnd = new Date(currentDay);
            rEnd.setHours(reH, reM, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Salir a Correr',
              category: Category.GYM,
              subject: null,
              start: rStart,
              end: rEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        }

        // 6. Sistemas Propios, Bots & IA (17:30 - 19:00, Lun a Jue)
        if (dayOfWeek >= 1 && dayOfWeek <= 4 && (!fixedBlocks || fixedBlocks.bots !== false)) {
          // En miércoles si hay running a las 18:00, no superponer si corre
          const hasRunningConflict = dayOfWeek === 3 && targetRunningDays.includes(3);
          const bStartTime = hasRunningConflict ? '16:45' : '17:30';
          const bEndTime = hasRunningConflict ? '18:00' : '19:00';

          if (!isBlockedByTravel(bStartTime, bEndTime)) {
            const [bH, bM] = bStartTime.split(':').map(Number);
            const [beH, beM] = bEndTime.split(':').map(Number);
            const bStart = new Date(currentDay);
            bStart.setHours(bH, bM, 0, 0);
            const bEnd = new Date(currentDay);
            bEnd.setHours(beH, beM, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Sistemas Propios, Bots & IA',
              category: Category.PERSONAL,
              subject: null,
              start: bStart,
              end: bEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        }

        // 7. Lectura de Libros (22:30 - 23:00 Diario)
        if (!fixedBlocks || fixedBlocks.reading !== false) {
          if (!isBlockedByTravel('22:30', '23:00')) {
            const lStart = new Date(currentDay);
            lStart.setHours(22, 30, 0, 0);
            const lEnd = new Date(currentDay);
            lEnd.setHours(23, 0, 0, 0);
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: 'Lectura de Libros',
              category: Category.READING,
              subject: null,
              start: lStart,
              end: lEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            });
          }
        }

        // 8. Motor de Estudio Inteligente (Distribución de Bloques de 1.5h a 2h)
        // Calcula horas según la inminencia de exámenes:
        // Paradigmas (viernes examen): Lun, Mar, Mié
        // Economía (próxima semana): Mar, Mié, Jue
        // No colocar estudio durante viaje ni sobrecargar días pesados.
        const studySlotsToAdd: Array<{
          title: string;
          subject: string;
          startH: number;
          startM: number;
          durationMin: number;
        }> = [];

        if (dayOfWeek === 1) {
          // Lunes
          const lunCfg = classesConfig?.find((c: any) => c.day === 'Lunes' || c.dayOfWeek === 1);
          if (lunCfg && lunCfg.active === false) {
            // Mañana libre por feriado: excelente hueco para 2h de Paradigmas
            studySlotsToAdd.push({
              title: 'Estudio Profundo: Paradigmas (Fundamentos)',
              subject: 'Paradigmas',
              startH: 8,
              startM: 30,
              durationMin: 120, // 2h
            });
          } else {
            // Tarde / Noche (1.5h)
            studySlotsToAdd.push({
              title: 'Estudio Profundo: Paradigmas (Resolución de Parciales)',
              subject: 'Paradigmas',
              startH: 19,
              startM: 30,
              durationMin: 90, // 1.5h
            });
          }
        } else if (dayOfWeek === 2) {
          // Martes: 2h Paradigmas a la mañana + 1.5h Economía a la tarde
          studySlotsToAdd.push({
            title: 'Estudio Profundo: Paradigmas (Modelado & Lógica)',
            subject: 'Paradigmas',
            startH: 8,
            startM: 0,
            durationMin: 120, // 2h
          });
          studySlotsToAdd.push({
            title: 'Estudio Profundo: Economía (Unidades Clave)',
            subject: 'Economía',
            startH: 11,
            startM: 30,
            durationMin: 90, // 1.5h
          });
        } else if (dayOfWeek === 3) {
          // Miércoles: 2h Paradigmas (Repaso clave pre-parcial)
          studySlotsToAdd.push({
            title: 'Estudio Profundo: Paradigmas (Repaso Clave Pre-Parcial)',
            subject: 'Paradigmas',
            startH: 8,
            startM: 0,
            durationMin: 120, // 2h
          });
          // Si Gym pasó a miércoles (15:00-17:00), ubicar Economía a las 11:30 o 13:30; si no, 15:00
          if (targetGymDays.includes(3)) {
            studySlotsToAdd.push({
              title: 'Estudio Profundo: Economía (Ejercicios Prácticos)',
              subject: 'Economía',
              startH: 11,
              startM: 30,
              durationMin: 90, // 1.5h
            });
          } else {
            studySlotsToAdd.push({
              title: 'Estudio Profundo: Economía (Ejercicios Prácticos)',
              subject: 'Economía',
              startH: 15,
              startM: 0,
              durationMin: 90, // 1.5h
            });
          }
        } else if (dayOfWeek === 4) {
          // Jueves: 1.5h Economía (a la siesta antes del cursado de la noche)
          studySlotsToAdd.push({
            title: 'Estudio Profundo: Economía (Teoría & Casos)',
            subject: 'Economía',
            startH: 15,
            startM: 0,
            durationMin: 90, // 1.5h
          });
        }
        // Viernes: Rinde Paradigmas a la mañana, viaje a la tarde -> 0 horas de estudio (no sobrecargar).
        // Sábado / Domingo: Descanso y running

        for (const sSlot of studySlotsToAdd) {
          const sStart = new Date(currentDay);
          sStart.setHours(sSlot.startH, sSlot.startM, 0, 0);
          const sEnd = new Date(sStart.getTime() + sSlot.durationMin * 60 * 1000);

          // Verificar que no choque con viaje ni rutina
          const endTimeStr = `${String(sEnd.getHours()).padStart(2, '0')}:${String(sEnd.getMinutes()).padStart(2, '0')}`;
          const startTimeStr = `${String(sSlot.startH).padStart(2, '0')}:${String(sSlot.startM).padStart(2, '0')}`;

          if (!isBlockedByTravel(startTimeStr, endTimeStr)) {
            slotsToInsert.push({
              weeklyPlanId: plan.id,
              title: sSlot.title,
              category: Category.STUDY_DEEP,
              subject: sSlot.subject,
              start: sStart,
              end: sEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: true,
            });
          }
        }
      }

      // Auditoría de negocio: Miércoles NUNCA tiene Gimnasio
      const auditedSlotsToInsert = slotsToInsert.filter((slot) => {
        const d = new Date(slot.start).getDay();
        if (d === 3 && slot.category === Category.GYM && slot.title.toLowerCase().includes('gimnasio')) {
          return false;
        }
        return true;
      });

      if (auditedSlotsToInsert.length > 0) {
        await prisma.plannedSlot.createMany({
          data: auditedSlotsToInsert,
        });
      }

      const fullPlan = await prisma.weeklyPlan.findUnique({
        where: { id: plan.id },
        include: {
          slots: {
            orderBy: { start: 'asc' },
          },
        },
      });

      return res.json({
        success: true,
        plan: fullPlan,
        totalSlots: slotsToInsert.length,
      });
    } catch (error: any) {
      console.error('Error in generateWeeklyPlan:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/dashboard
   * Retorna exámenes ordenados con días restantes calculados, agenda de hoy, hábitos del día y progreso académico.
   */
  public static async getDashboardData(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const dateOnly = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));

      // 1. Exámenes ordenados con días restantes calculados
      const rawExams = await prisma.exam.findMany({
        orderBy: { date: 'asc' },
      });

      const exams = rawExams.map((exam) => {
        const daysRemaining = differenceInCalendarDays(new Date(exam.date), now);
        return {
          ...exam,
          daysRemaining,
        };
      });

      // 2. Slots semanales del plan activo
      let activePlan = await prisma.weeklyPlan.findFirst({
        where: { isActive: true },
        include: {
          slots: {
            orderBy: { start: 'asc' },
          },
        },
      });

      if (!activePlan || !activePlan.slots || activePlan.slots.length === 0) {
        await PlannerController.generateWeeklyPlan(
          { body: { startDate: startOfDay.toISOString() } } as any,
          { json: () => {} } as any
        );

        activePlan = await prisma.weeklyPlan.findFirst({
          where: { isActive: true },
          include: {
            slots: {
              orderBy: { start: 'asc' },
            },
          },
        });
      }

      // Agenda de hoy a partir del plan activo
      let todayAgenda = (activePlan?.slots || []).filter((slot) => {
        const sTime = new Date(slot.start).getTime();
        return sTime >= startOfDay.getTime() && sTime <= endOfDay.getTime();
      });

      // Auditoría estricta de gimnasio y running:
      // - Días de Gimnasio: LUNES (1), MARTES (2), JUEVES (4), VIERNES (5)
      // - Días de Correr: MIÉRCOLES (3), SÁBADO (6), DOMINGO (0)
      // - Miércoles NUNCA tiene slot GYM de Gimnasio
      todayAgenda = todayAgenda.filter((slot) => {
        const d = new Date(slot.start).getDay();
        if (d === 3 && slot.title.toLowerCase().includes('gimnasio')) {
          return false;
        }
        return true;
      });

      // Si hoy es miércoles (3), garantizar que figure "Salir a Correr" a las 18:00
      if (now.getDay() === 3) {
        const hasRunningToday = todayAgenda.some(
          (s) => s.title.toLowerCase().includes('correr') || s.title.toLowerCase().includes('running')
        );
        if (!hasRunningToday && activePlan) {
          const runStart = new Date(startOfDay);
          runStart.setHours(18, 0, 0, 0);
          const runEnd = new Date(startOfDay);
          runEnd.setHours(19, 0, 0, 0);

          const createdRunning = await prisma.plannedSlot.create({
            data: {
              weeklyPlanId: activePlan.id,
              title: 'Salir a Correr',
              category: Category.GYM,
              subject: null,
              start: runStart,
              end: runEnd,
              status: SlotStatus.PENDING,
              isAutoSlot: false,
            },
          });
          todayAgenda.push(createdRunning);
          todayAgenda.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          if (activePlan.slots) {
            activePlan.slots.push(createdRunning);
          }
        }
      }

      // 3. Hábitos de hoy
      const habitsToday = await prisma.habitLog.findMany({
        where: {
          date: dateOnly,
        },
      });

      // 4. Slots semanales sanitizados y auditados
      const rawWeeklySlots = activePlan ? activePlan.slots : todayAgenda;

      const sanitizedWeeklySlots = (rawWeeklySlots || [])
        .map((slot) => ({
          id: slot.id,
          title: slot.title,
          category: slot.category,
          subject: slot.subject || null,
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
          startTime: new Date(slot.start).toISOString(),
          endTime: new Date(slot.end).toISOString(),
          status: slot.status,
          isAutoSlot: Boolean(slot.isAutoSlot),
        }))
        .filter((slot) => {
          const d = new Date(slot.start).getDay();
          // Ningún miércoles debe tener Gimnasio
          if (d === 3 && slot.title.toLowerCase().includes('gimnasio')) {
            return false;
          }
          return true;
        });

      // 5. Progreso Académico
      const academicProgress = await prisma.academicProgress.findMany({
        orderBy: { subject: 'asc' },
      });

      return res.json({
        exams,
        todayAgenda,
        habitsToday,
        weeklySlots: sanitizedWeeklySlots,
        slots: sanitizedWeeklySlots,
        academicProgress,
      });
    } catch (error: any) {
      console.error('Error in getDashboardData:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /api/planner/current-week
   * Retorna una estructura plana y sanitizada de slots de la semana activa.
   * Si no existe un WeeklyPlan activo, retorna { slots: [] } con HTTP 200.
   */
  public static async getCurrentWeek(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      const activePlan = await prisma.weeklyPlan.findFirst({
        where: { isActive: true },
        include: {
          slots: {
            orderBy: { start: 'asc' },
          },
        },
      });

      if (!activePlan || !activePlan.slots || activePlan.slots.length === 0) {
        return res.status(200).json({
          slots: [],
          weeklySlots: [],
          weeklyPlanId: null,
          startDate: null,
          endDate: null,
        });
      }

      const sanitizedSlots = activePlan.slots
        .filter((slot) => {
          const d = new Date(slot.start).getDay();
          return !(d === 3 && slot.title.toLowerCase().includes('gimnasio'));
        })
        .map((slot) => ({
          id: slot.id,
          title: slot.title,
          category: slot.category,
          subject: slot.subject || null,
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
          startTime: new Date(slot.start).toISOString(),
          endTime: new Date(slot.end).toISOString(),
          status: slot.status,
          isAutoSlot: Boolean(slot.isAutoSlot),
        }));

      return res.status(200).json({
        slots: sanitizedSlots,
        weeklySlots: sanitizedSlots,
        weeklyPlanId: activePlan.id,
        startDate: activePlan.startDate.toISOString(),
        endDate: activePlan.endDate.toISOString(),
      });
    } catch (error: any) {
      console.error('Error in getCurrentWeek:', error);
      return res.status(200).json({ slots: [], weeklySlots: [] });
    }
  }

  /**
   * GET /api/calendar
   * Endpoint de calendario con filtrado opcional de fecha y sanitización plana.
   * Retorna siempre HTTP 200 con { slots: [...] } garantizado.
   */
  public static async getCalendar(req: Request, res: Response) {
    try {
      await PlannerController.ensureInitialSeed();

      const startQuery = req.query.start ? new Date(req.query.start as string) : null;
      const endQuery = req.query.end ? new Date(req.query.end as string) : null;

      let whereClause: any = {
        weeklyPlan: { isActive: true },
      };
      if (startQuery && !isNaN(startQuery.getTime()) && endQuery && !isNaN(endQuery.getTime())) {
        whereClause.start = { gte: startQuery, lte: endQuery };
      }

      let rawSlots = await prisma.plannedSlot.findMany({
        where: whereClause,
        orderBy: { start: 'asc' },
      });

      if (rawSlots.length === 0) {
        const activePlan = await prisma.weeklyPlan.findFirst({
          where: { isActive: true },
          include: { slots: { orderBy: { start: 'asc' } } },
        });
        if (activePlan && activePlan.slots) {
          rawSlots = activePlan.slots;
        }
      }

      const sanitizedSlots = (rawSlots || [])
        .filter((slot) => {
          const d = new Date(slot.start).getDay();
          return !(d === 3 && slot.title.toLowerCase().includes('gimnasio'));
        })
        .map((slot) => ({
          id: slot.id,
          title: slot.title,
          category: slot.category,
          subject: slot.subject || null,
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
          startTime: new Date(slot.start).toISOString(),
          endTime: new Date(slot.end).toISOString(),
          status: slot.status,
          isAutoSlot: Boolean(slot.isAutoSlot),
        }));

      return res.status(200).json({
        slots: sanitizedSlots,
        weeklySlots: sanitizedSlots,
      });
    } catch (error: any) {
      console.error('Error in getCalendar:', error);
      return res.status(200).json({ slots: [], weeklySlots: [] });
    }
  }
}
