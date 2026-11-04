import { PrismaClient, Category, SlotStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Limpiando registros anteriores ---');
  await prisma.plannedSlot.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.fixedRoutine.deleteMany();
  await prisma.academicProgress.deleteMany();
  await prisma.habitLog.deleteMany();

  console.log('--- 1. Insertando Exámenes Reales ---');
  const exams = await prisma.exam.createMany({
    data: [
      {
        subject: 'Paradigmas',
        type: '2º Parcial',
        date: new Date('2026-11-06T08:00:00.000Z'),
        weight: 2.0
      },
      {
        subject: 'Economía',
        type: '3º Parcial',
        date: new Date('2026-11-13T08:00:00.000Z'),
        weight: 1.5
      },
      {
        subject: 'Paradigmas',
        type: 'Examen Global',
        date: new Date('2026-11-21T08:00:00.000Z'),
        weight: 2.0
      },
      {
        type: 'Final',
        date: new Date('2026-12-10T09:00:00.000Z'),
        weight: 1.5
      }
    ]
  });

  console.log('--- 2. Insertando Rutinas Fijas y Hábitos Operativos ---');
  // dayOfWeek: 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
  const routinesData = [
    // Despertar matutino (Lun a Vie 07:00 - 08:00)
    ...[1, 2, 3, 4, 5].map((d) => ({
      title: 'Despertar + Rutina Matutina',
      category: Category.PERSONAL,
      dayOfWeek: d,
      startTime: '07:00',
      endTime: '08:00',
      isFlexible: false
    })),

    // Cursado de Facultad: Lunes y Viernes a la mañana
    {
      title: 'Cursado Facultad (Paradigmas)',
      category: Category.ACADEMIC_CLASS,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '12:00',
      isFlexible: false
    },
    {
      title: 'Cursado Facultad',
      category: Category.ACADEMIC_CLASS,
      dayOfWeek: 5,
      startTime: '08:00',
      endTime: '12:00',
      isFlexible: false
    },

    // Cursado de Facultad: Jueves a la noche
    {
      title: 'Cursado Facultad (Noche)',
      category: Category.ACADEMIC_CLASS,
      dayOfWeek: 4,
      startTime: '19:30',
      endTime: '22:30',
      isFlexible: false
    },

    // Operar Trading (Lun a Vie 10:00 - 11:00)
    ...[1, 2, 3, 4, 5].map((d) => ({
      title: 'Operar Trading (Mercado)',
      category: Category.TRADING,
      dayOfWeek: d,
      startTime: '10:00',
      endTime: '11:00',
      isFlexible: true
    })),

    // Gimnasio (Lun, Mar, Jue, Vie 15:00 - 17:00)
    ...[1, 2, 4, 5].map((d) => ({
      title: 'Gimnasio',
      category: Category.GYM,
      dayOfWeek: d,
      startTime: '15:00',
      endTime: '17:00',
      isFlexible: true
    })),

    // Salir a Correr (Miércoles, Sábado y Domingo)
    {
      title: 'Salir a Correr',
      category: Category.GYM,
      dayOfWeek: 3,
      startTime: '18:00',
      endTime: '19:00',
      isFlexible: true
    },
    {
      title: 'Salir a Correr',
      category: Category.GYM,
      dayOfWeek: 6,
      startTime: '09:00',
      endTime: '10:00',
      isFlexible: true
    },
    {
      title: 'Salir a Correr',
      category: Category.GYM,
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '10:00',
      isFlexible: true
    },

    // Desarrollo / Bots / Arquitectura IA (Lunes a Jueves 17:30 - 19:00)
    ...[1, 2, 3, 4].map((d) => ({
      title: 'Sistemas Propios, Bots & IA',
      category: Category.PERSONAL,
      dayOfWeek: d,
      startTime: '17:30',
      endTime: '19:00',
      isFlexible: true
    })),

    // Lectura de Libros diaria (30 min)
    ...[0, 1, 2, 3, 4, 5, 6].map((d) => ({
      title: 'Lectura de Libros',
      category: Category.READING,
      dayOfWeek: d,
      startTime: '22:30',
      endTime: '23:00',
      isFlexible: true
    }))
  ];

  await prisma.fixedRoutine.createMany({ data: routinesData });

  console.log('--- 3. Insertando Progreso Académico Inicial ---');
  await prisma.academicProgress.createMany({
    data: [
      { subject: 'Paradigmas', progressPerc: 70 },
      { subject: 'Economía', progressPerc: 55 },
    ]
  });

  console.log('--- 4. Creando Plan Activo con Evento Especial Malargüe y Parcial ---');
  const weekStart = new Date('2026-11-02T00:00:00.000Z');
  const weekEnd = new Date('2026-11-08T23:59:59.999Z');

  const plan = await prisma.weeklyPlan.create({
    data: {
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    }
  });

  // Slots concretos para esta semana
  const currentWeekSlots = [
    // Miércoles 4 (Hoy)
    {
      weeklyPlanId: plan.id,
      title: 'Estudio Profundo: Paradigmas (Ejercicios Bloque 1)',
      category: Category.STUDY_DEEP,
      subject: 'Paradigmas',
      start: new Date('2026-11-04T10:00:00.000Z'),
      end: new Date('2026-11-04T12:00:00.000Z'),
      status: SlotStatus.COMPLETED,
      isAutoSlot: true
    },
    {
      weeklyPlanId: plan.id,
      title: 'Estudio Profundo: Paradigmas (Repaso 2º Parcial)',
      category: Category.STUDY_DEEP,
      subject: 'Paradigmas',
      start: new Date('2026-11-04T15:30:00.000Z'),
      end: new Date('2026-11-04T17:30:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: true
    },
    {
      weeklyPlanId: plan.id,
      title: 'Salir a Correr',
      category: Category.GYM,
      start: new Date('2026-11-04T18:00:00.000Z'),
      end: new Date('2026-11-04T19:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Sistemas Propios, Bots & IA',
      category: Category.PERSONAL,
      start: new Date('2026-11-04T19:30:00.000Z'),
      end: new Date('2026-11-04T21:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },

    // Jueves 5
    {
      weeklyPlanId: plan.id,
      title: 'Despertar + Rutina Matutina',
      category: Category.PERSONAL,
      start: new Date('2026-11-05T07:00:00.000Z'),
      end: new Date('2026-11-05T08:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Estudio Profundo: Paradigmas (Simulacro Parcial)',
      category: Category.STUDY_DEEP,
      subject: 'Paradigmas',
      start: new Date('2026-11-05T08:00:00.000Z'),
      end: new Date('2026-11-05T10:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: true
    },
    {
      weeklyPlanId: plan.id,
      title: 'Operar Trading',
      category: Category.TRADING,
      start: new Date('2026-11-05T10:00:00.000Z'),
      end: new Date('2026-11-05T11:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Estudio Profundo: Economía (Preparación 3º Parcial)',
      category: Category.STUDY_DEEP,
      subject: 'Economía',
      start: new Date('2026-11-05T11:30:00.000Z'),
      end: new Date('2026-11-05T13:30:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: true
    },
    {
      weeklyPlanId: plan.id,
      title: 'Gimnasio',
      category: Category.GYM,
      start: new Date('2026-11-05T15:00:00.000Z'),
      end: new Date('2026-11-05T17:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Cursado Facultad (Noche)',
      category: Category.ACADEMIC_CLASS,
      start: new Date('2026-11-05T19:30:00.000Z'),
      end: new Date('2026-11-05T22:30:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },

    // Viernes 6 (Parcial + Viaje Malargüe)
    {
      weeklyPlanId: plan.id,
      title: 'PARCIAL: Paradigmas (2º Parcial)',
      category: Category.ACADEMIC_CLASS,
      subject: 'Paradigmas',
      start: new Date('2026-11-06T08:00:00.000Z'),
      end: new Date('2026-11-06T11:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Operar Trading',
      category: Category.TRADING,
      start: new Date('2026-11-06T10:00:00.000Z'),
      end: new Date('2026-11-06T11:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Día Especial: Viaje a Malargüe (Cumpleaños Papá)',
      category: Category.PERSONAL,
      start: new Date('2026-11-06T13:00:00.000Z'),
      end: new Date('2026-11-06T23:59:59.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },

    // Sábado 7 y Domingo 8 en Malargüe
    {
      weeklyPlanId: plan.id,
      title: 'Salir a Correr (Malargüe)',
      category: Category.GYM,
      start: new Date('2026-11-07T09:00:00.000Z'),
      end: new Date('2026-11-07T10:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    },
    {
      weeklyPlanId: plan.id,
      title: 'Estudio Profundo: Economía (Repaso Liviano)',
      category: Category.STUDY_DEEP,
      subject: 'Economía',
      start: new Date('2026-11-07T11:00:00.000Z'),
      end: new Date('2026-11-07T13:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: true
    },
    {
      weeklyPlanId: plan.id,
      title: 'Salir a Correr',
      category: Category.GYM,
      start: new Date('2026-11-08T09:00:00.000Z'),
      end: new Date('2026-11-08T10:00:00.000Z'),
      status: SlotStatus.PENDING,
      isAutoSlot: false
    }
  ];

  await prisma.plannedSlot.createMany({ data: currentWeekSlots });

  console.log('--- SEED COMPLETADO SATISFACTORIAMENTE ---');
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
