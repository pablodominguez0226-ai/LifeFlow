"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding LifeFlow database with definitive timetable at 02/09/2026...');
    // Clear existing data safely
    await prisma.recommendation.deleteMany();
    await prisma.dailyCheckIn.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.weeklyPlan.deleteMany();
    await prisma.academicTask.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany();
    // 1. Create User
    const user = await prisma.user.create({
        data: {
            name: 'Pablo',
            email: 'pablo@lifeflow.local',
            targetWakeTime: '06:30',
            maxBedTime: '00:00',
            targetSleepHours: 7.5,
            maxFocusBlockMinutes: 120,
            defaultBreakMinutes: 10,
            personalBufferRatio: 0.15,
            travelFacultadMinutes: 10,
            travelGymMinutes: 10,
            rugbyPrepTravelMinutes: 90, // departure at 19:30
        },
    });
    // 2. Create Subjects
    const subjParadigmas = await prisma.subject.create({
        data: {
            userId: user.id,
            name: 'Paradigmas de Programación',
            code: 'PARADIGMAS',
            type: 'CURSADA',
            color: '#E50914',
            masteryLevel: 'MEDIO',
            priorityWeight: 1.5,
        },
    });
    const subjSistemas = await prisma.subject.create({
        data: {
            userId: user.id,
            name: 'Administración de Sistemas',
            code: 'SISTEMAS',
            type: 'CURSADA',
            color: '#E50914',
            masteryLevel: 'MEDIO',
            priorityWeight: 1.2,
        },
    });
    const subjEconomia = await prisma.subject.create({
        data: {
            userId: user.id,
            name: 'Economía',
            code: 'ECONOMIA',
            type: 'CURSADA',
            color: '#E50914',
            masteryLevel: 'MEDIO',
            priorityWeight: 1.3,
        },
    });
    const subjDiseno = await prisma.subject.create({
        data: {
            userId: user.id,
            name: 'Diseño de Sistemas',
            code: 'DISENO',
            type: 'FINAL',
            color: '#FF5A00',
            masteryLevel: 'MEDIO',
            priorityWeight: 2.0,
            progressManualOverride: 72.0,
        },
    });
    // 3. Create Exams with real academic dates
    // Paradigmas
    const examParadigmas1 = await prisma.exam.create({
        data: {
            subjectId: subjParadigmas.id,
            title: '1.º Parcial Paradigmas',
            type: 'PARCIAL_1',
            date: new Date('2026-09-25T08:00:00Z'),
            weight: 4.5,
            targetHoursEstimate: 24,
            completedHours: 6,
        },
    });
    await prisma.exam.create({
        data: {
            subjectId: subjParadigmas.id,
            title: '2.º Parcial Paradigmas',
            type: 'PARCIAL_2',
            date: new Date('2026-10-06T08:00:00Z'),
            weight: 4.5,
            targetHoursEstimate: 20,
        },
    });
    await prisma.exam.create({
        data: {
            subjectId: subjParadigmas.id,
            title: 'Global Paradigmas',
            type: 'GLOBAL',
            date: new Date('2026-11-20T08:00:00Z'),
            weight: 5.0,
            targetHoursEstimate: 25,
        },
    });
    // Economía
    const examEconomia1 = await prisma.exam.create({
        data: {
            subjectId: subjEconomia.id,
            title: '1.º Parcial Economía',
            type: 'PARCIAL_1',
            date: new Date('2026-09-27T14:00:00Z'),
            weight: 4.0,
            targetHoursEstimate: 20,
            completedHours: 4,
        },
    });
    await prisma.exam.create({
        data: {
            subjectId: subjEconomia.id,
            title: '2.º Parcial Práctico Economía',
            type: 'PRACTICO',
            date: new Date('2026-10-23T14:00:00Z'),
            weight: 3.5,
            targetHoursEstimate: 16,
        },
    });
    await prisma.exam.create({
        data: {
            subjectId: subjEconomia.id,
            title: '2.º Parcial Teórico Economía',
            type: 'PARCIAL_2',
            date: new Date('2026-11-12T14:00:00Z'),
            weight: 4.0,
            targetHoursEstimate: 18,
        },
    });
    await prisma.exam.create({
        data: {
            subjectId: subjEconomia.id,
            title: 'Global Economía',
            type: 'GLOBAL',
            date: new Date('2026-11-26T14:00:00Z'),
            weight: 5.0,
            targetHoursEstimate: 25,
        },
    });
    // Diseño
    const examDisenoFinal = await prisma.exam.create({
        data: {
            subjectId: subjDiseno.id,
            title: 'Final Diseño de Sistemas',
            type: 'FINAL',
            date: new Date('2026-10-08T09:00:00Z'), // 36 days from 02/09/2026
            weight: 5.0,
            targetHoursEstimate: 50,
            completedHours: 36, // ~72%
            notes: 'Final estratégico preparado progresivamente. Consulta Martes 17:30.',
        },
    });
    // 4. Create Topics for Diseño
    await prisma.topic.createMany({
        data: [
            { subjectId: subjDiseno.id, title: '1. Diagnóstico y Arquitectura Base', orderIndex: 1, status: 'DOMINADO', masteryScore: 1.0 },
            { subjectId: subjDiseno.id, title: '2. Patrones de Diseño y Modelado de Dominio', orderIndex: 2, status: 'DOMINADO', masteryScore: 0.9 },
            { subjectId: subjDiseno.id, title: '3. Persistencia, Transacciones y Caching', orderIndex: 3, status: 'EN_PROGRESO', masteryScore: 0.6 },
            { subjectId: subjDiseno.id, title: '4. Microservicios, Integración y Eventos', orderIndex: 4, status: 'EN_PROGRESO', masteryScore: 0.5 },
            { subjectId: subjDiseno.id, title: '5. Casos Prácticos y Modelado Integral', orderIndex: 5, status: 'REPASAR', masteryScore: 0.4 },
            { subjectId: subjDiseno.id, title: '6. Simulacro Completo de Examen Final', orderIndex: 6, status: 'NO_INICIADO', masteryScore: 0.0 },
        ],
    });
    // 5. Create Academic Tasks
    await prisma.academicTask.createMany({
        data: [
            {
                subjectId: subjParadigmas.id,
                examId: examParadigmas1.id,
                title: 'Práctica de Programación Lógica y Recursión (Prolog)',
                taskType: 'ESTUDIO_PROFUNDO',
                estimatedMinutes: 90,
                remainingMinutes: 90,
                energyLevel: 'ALTA',
                priorityScore: 85.0,
                status: 'PENDIENTE',
                dueDate: new Date('2026-09-10T18:00:00Z'),
            },
            {
                subjectId: subjDiseno.id,
                examId: examDisenoFinal.id,
                title: 'Diseño: Caching Distribuido y Transacciones ACID',
                taskType: 'ESTUDIO_PROFUNDO',
                estimatedMinutes: 90,
                remainingMinutes: 90,
                energyLevel: 'ALTA',
                priorityScore: 80.0,
                status: 'PENDIENTE',
                dueDate: new Date('2026-09-08T18:00:00Z'),
            },
            {
                subjectId: subjEconomia.id,
                examId: examEconomia1.id,
                title: 'Economía: Elasticidad y Equilibrio de Mercado',
                taskType: 'EJERCICIOS',
                estimatedMinutes: 60,
                remainingMinutes: 60,
                energyLevel: 'MEDIA',
                priorityScore: 74.0,
                status: 'PENDIENTE',
                dueDate: new Date('2026-09-12T18:00:00Z'),
            },
            {
                subjectId: subjDiseno.id,
                title: 'Preparar dudas para Consulta de Diseño del Martes 17:30',
                taskType: 'ESTUDIO_LIVIANO',
                estimatedMinutes: 45,
                remainingMinutes: 45,
                energyLevel: 'BAJA',
                priorityScore: 70.0,
                status: 'PENDIENTE',
            },
        ],
    });
    // 6. Create Base Activity Templates
    await prisma.activity.createMany({
        data: [
            { userId: user.id, name: 'Cursada Paradigmas', category: 'ACADEMIA', flexibility: 'FIJA', defaultDurationMinutes: 180, color: '#E50914' },
            { userId: user.id, name: 'Cursada Admin Sistemas', category: 'ACADEMIA', flexibility: 'FIJA', defaultDurationMinutes: 240, color: '#E50914' },
            { userId: user.id, name: 'Cursada Economía', category: 'ACADEMIA', flexibility: 'FIJA', defaultDurationMinutes: 150, color: '#E50914' },
            { userId: user.id, name: 'Consulta Diseño', category: 'ACADEMIA', flexibility: 'FIJA', defaultDurationMinutes: 60, color: '#FF5A00' },
            { userId: user.id, name: 'Gimnasio', category: 'GIMNASIO', flexibility: 'FLEXIBLE', defaultDurationMinutes: 135, color: '#FF5A00' },
            { userId: user.id, name: 'Fútbol Sábado', category: 'DEPORTE', flexibility: 'FIJA', defaultDurationMinutes: 150, color: '#22C55E' },
            { userId: user.id, name: 'Rugby Martes', category: 'DEPORTE', flexibility: 'OPCIONAL', defaultDurationMinutes: 210, color: '#FF5A00' },
            { userId: user.id, name: 'Lectura Filosofía / Psicología', category: 'LECTURA', flexibility: 'FLEXIBLE', defaultDurationMinutes: 60, color: '#A855F7' },
            { userId: user.id, name: 'Operación de Mercado', category: 'MERCADO', flexibility: 'OPCIONAL', defaultDurationMinutes: 60, color: '#14B8A6' },
            { userId: user.id, name: 'Buffer Personal / Mandados', category: 'PERSONAL', flexibility: 'FLEXIBLE', defaultDurationMinutes: 60, color: '#71717A' },
        ],
    });
    // 7. Create Habits
    await prisma.habit.createMany({
        data: [
            { userId: user.id, title: 'Dormir antes de las 00:00', category: 'SUENO', targetFrequency: 7, frequencyUnit: 'SEMANAL', streak: 4 },
            { userId: user.id, title: 'Despertar 06:30 - 07:00', category: 'SUENO', targetFrequency: 7, frequencyUnit: 'SEMANAL', streak: 5 },
            { userId: user.id, title: 'Gimnasio 4x por semana (Lun, Mar, Jue, Vie)', category: 'GIMNASIO', targetFrequency: 4, frequencyUnit: 'SEMANAL', streak: 3 },
            { userId: user.id, title: 'Lectura nocturna sin pantallas (22:30)', category: 'LECTURA', targetFrequency: 5, frequencyUnit: 'SEMANAL', streak: 2 },
            { userId: user.id, title: 'Bloque de estudio profundo matutino', category: 'ESTUDIO', targetFrequency: 5, frequencyUnit: 'SEMANAL', streak: 6 },
        ],
    });
    // 8. Create Initial Daily CheckIn for 02/09/2026
    await prisma.dailyCheckIn.create({
        data: {
            userId: user.id,
            date: new Date('2026-09-02T08:00:00Z'),
            sleepHours: 7.5,
            energyLevel: 4,
            stressLevel: 2,
            studyHoursDone: 2.0,
            workoutDone: false,
            notes: 'Miércoles sin cursada: foco en Diseño y Paradigmas.',
        },
    });
    // 9. Initial Recommendations
    await prisma.recommendation.createMany({
        data: [
            {
                userId: user.id,
                type: 'PRIORIDAD_ESTUDIO',
                severity: 'INFO',
                title: 'Estrategia Progresiva para Diseño (Final en 36 días)',
                message: 'No concentres el estudio de Diseño en la última semana. Mantén avances continuos y asiste a la consulta del martes 17:30.',
                justification: 'Final de alta exigencia (peso 5.0). El avance continuo reduce la curva de estrés previo al 08/10.',
            },
            {
                userId: user.id,
                type: 'ALERTA_SOBRECARGA',
                severity: 'INFO',
                title: 'Gestión del Jueves: Gimnasio (16:00-18:00) y Administración (19:00-23:00)',
                message: 'El gimnasio termina a las 18:00 para dejar 1 hora de margen (baño, cambio y 10 min de traslado) antes de ingresar a Administración de Sistemas a las 19:00.',
                justification: 'Al finalizar a las 23:00, priorizar regreso, cena ligera y descanso sin estudio profundo posterior.',
            },
            {
                userId: user.id,
                type: 'ALERTA_SOBRECARGA',
                severity: 'INFO',
                title: 'Transición del Viernes: Economía (14:30-17:00) a Gimnasio (17:15)',
                message: 'Economía finaliza a las 17:00. El gimnasio se inicia a las 17:15 contemplando los 10 minutos de traslado desde la facultad.',
                justification: 'Resuelve la transición de horarios sin solapamientos ficticios.',
            },
        ],
    });
    // 10. Populate Week Blocks for 31/08/2026 to 06/09/2026 (Definitive Timetable)
    await prisma.scheduleBlock.createMany({
        data: [
            // LUNES 31/08
            {
                userId: user.id,
                title: 'Cursada: Paradigmas de Programación',
                startTime: new Date('2026-08-31T08:00:00Z'),
                endTime: new Date('2026-08-31T11:00:00Z'),
                durationMinutes: 180,
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Cursada fija universitaria obligatoria.',
            },
            {
                userId: user.id,
                title: 'Gimnasio — Sesión 1 (Fuerza)',
                startTime: new Date('2026-08-31T16:00:00Z'),
                endTime: new Date('2026-08-31T18:15:00Z'),
                durationMinutes: 135,
                category: 'GIMNASIO',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Entrenamiento habitual del lunes tarde. Traslado: 10 min.',
            },
            {
                userId: user.id,
                title: 'Lectura Personal: Filosofía & Psicología',
                startTime: new Date('2026-08-31T22:30:00Z'),
                endTime: new Date('2026-08-31T23:30:00Z'),
                durationMinutes: 60,
                category: 'LECTURA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'COMPLETADO',
                justification: 'Descanso cognitivo nocturno sin pantallas previo al sueño de 00:00.',
            },
            // MARTES 01/09
            {
                userId: user.id,
                title: 'Gimnasio — Sesión 2 (Temprano)',
                startTime: new Date('2026-09-01T10:30:00Z'),
                endTime: new Date('2026-09-01T12:45:00Z'),
                durationMinutes: 135,
                category: 'GIMNASIO',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Gimnasio temprano para dejar la tarde libre antes de la Consulta de Diseño.',
            },
            {
                userId: user.id,
                title: 'Consulta: Diseño de Sistemas (Final 08/10)',
                startTime: new Date('2026-09-01T17:30:00Z'),
                endTime: new Date('2026-09-01T18:30:00Z'),
                durationMinutes: 60,
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Consulta con profesores para preparación del FINAL de Diseño.',
            },
            {
                userId: user.id,
                title: 'Rugby (Salida 19:30 — Partido 21:00)',
                startTime: new Date('2026-09-01T19:30:00Z'),
                endTime: new Date('2026-09-01T22:30:00Z'),
                durationMinutes: 180,
                category: 'DEPORTE',
                flexibility: 'OPCIONAL',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Salida 19:30 para partido a las 21:00. Actividad deportiva flexible.',
            },
            // MIÉRCOLES 02/09 (HOY — SIN CURSADA FIJA, DÍA DE ALTA FLEXIBILIDAD)
            {
                userId: user.id,
                title: 'Estudio Profundo: Diseño de Sistemas (Final 08/10)',
                startTime: new Date('2026-09-02T09:00:00Z'),
                endTime: new Date('2026-09-02T11:00:00Z'),
                durationMinutes: 120,
                category: 'ACADEMIA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'COMPLETADO',
                justification: 'Avance en caching distribuido y transacciones hacia el final.',
            },
            {
                userId: user.id,
                title: 'Almuerzo + Descanso (Buffer Personal)',
                startTime: new Date('2026-09-02T12:30:00Z'),
                endTime: new Date('2026-09-02T13:30:00Z'),
                durationMinutes: 60,
                category: 'PERSONAL',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'COMPLETADO',
                justification: 'Margen no negociable para comida y desconexión.',
            },
            {
                userId: user.id,
                title: 'Estudio Profundo: Paradigmas (Lógica & Prolog)',
                startTime: new Date('2026-09-02T15:00:00Z'),
                endTime: new Date('2026-09-02T17:00:00Z'),
                durationMinutes: 120,
                category: 'ACADEMIA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Preparación de ejercicios para el 1P de Paradigmas (25/09).',
            },
            {
                userId: user.id,
                title: 'Operar mercado con amigo',
                startTime: new Date('2026-09-02T20:30:00Z'),
                endTime: new Date('2026-09-02T21:30:00Z'),
                durationMinutes: 60,
                category: 'MERCADO',
                flexibility: 'OPCIONAL',
                isFixed: false,
                energyLevel: 'MEDIA',
                status: 'PLANIFICADO',
                justification: 'Sesión flexible de mercado sin interferir con estudio prioritario.',
            },
            {
                userId: user.id,
                title: 'Lectura Personal: Filosofía & Psicología',
                startTime: new Date('2026-09-02T22:30:00Z'),
                endTime: new Date('2026-09-02T23:30:00Z'),
                durationMinutes: 60,
                category: 'LECTURA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Descanso cognitivo nocturno sin pantallas previo al sueño de 00:00.',
            },
            // JUEVES 03/09
            {
                userId: user.id,
                title: 'Estudio: Economía (1.º Parcial)',
                startTime: new Date('2026-09-03T10:00:00Z'),
                endTime: new Date('2026-09-03T12:00:00Z'),
                durationMinutes: 120,
                category: 'ACADEMIA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Mañana libre aprovechada para conceptos de elasticidad y mercado.',
            },
            {
                userId: user.id,
                title: 'Gimnasio — Sesión 3',
                startTime: new Date('2026-09-03T16:00:00Z'),
                endTime: new Date('2026-09-03T18:00:00Z'),
                durationMinutes: 120,
                category: 'GIMNASIO',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Termina a las 18:00 para dejar 1h de margen (baño, cambio y traslado) antes de Sistemas.',
            },
            {
                userId: user.id,
                title: 'Cursada: Administración de Sistemas',
                startTime: new Date('2026-09-03T19:00:00Z'),
                endTime: new Date('2026-09-03T23:00:00Z'),
                durationMinutes: 240,
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Cursada fija universitaria oficial de Administración (19:00 a 23:00).',
            },
            // VIERNES 04/09
            {
                userId: user.id,
                title: 'Cursada: Paradigmas de Programación',
                startTime: new Date('2026-09-04T08:00:00Z'),
                endTime: new Date('2026-09-04T11:00:00Z'),
                durationMinutes: 180,
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Cursada fija universitaria obligatoria.',
            },
            {
                userId: user.id,
                title: 'Almuerzo / Buffer / Descanso',
                startTime: new Date('2026-09-04T11:30:00Z'),
                endTime: new Date('2026-09-04T14:00:00Z'),
                durationMinutes: 150,
                category: 'PERSONAL',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Tiempo disponible para regreso, almuerzo y preparación para Economía.',
            },
            {
                userId: user.id,
                title: 'Cursada: Economía',
                startTime: new Date('2026-09-04T14:30:00Z'),
                endTime: new Date('2026-09-04T17:00:00Z'),
                durationMinutes: 150,
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Cursada fija universitaria obligatoria de Economía (14:30 a 17:00).',
            },
            {
                userId: user.id,
                title: 'Gimnasio — Sesión 4',
                startTime: new Date('2026-09-04T17:15:00Z'),
                endTime: new Date('2026-09-04T19:30:00Z'),
                durationMinutes: 135,
                category: 'GIMNASIO',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Inicia 17:15 (con 15 min de margen tras terminar Economía a las 17:00 para resolver la transición sin conflicto).',
            },
            {
                userId: user.id,
                title: 'Lectura Personal: Filosofía & Psicología',
                startTime: new Date('2026-09-04T22:30:00Z'),
                endTime: new Date('2026-09-04T23:30:00Z'),
                durationMinutes: 60,
                category: 'LECTURA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Descanso cognitivo nocturno sin pantallas.',
            },
            // SÁBADO 05/09
            {
                userId: user.id,
                title: 'Partido de Fútbol',
                startTime: new Date('2026-09-05T09:30:00Z'),
                endTime: new Date('2026-09-05T12:00:00Z'),
                durationMinutes: 150,
                category: 'DEPORTE',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                status: 'PLANIFICADO',
                justification: 'Actividad deportiva social fija de fin de semana.',
            },
            {
                userId: user.id,
                title: 'Tiempo Libre / Amigos / Mates',
                startTime: new Date('2026-09-05T14:00:00Z'),
                endTime: new Date('2026-09-05T19:00:00Z'),
                durationMinutes: 300,
                category: 'PERSONAL',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Sábado tarde reservado para vida personal y desconexión.',
            },
            // DOMINGO 06/09
            {
                userId: user.id,
                title: 'Descanso / Mates / Caminata',
                startTime: new Date('2026-09-06T10:00:00Z'),
                endTime: new Date('2026-09-06T18:00:00Z'),
                durationMinutes: 480,
                category: 'DESCANSO',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Domingo principalmente de descanso y vida personal.',
            },
            {
                userId: user.id,
                title: 'Planificación de la Semana Siguiente',
                startTime: new Date('2026-09-06T19:30:00Z'),
                endTime: new Date('2026-09-06T20:15:00Z'),
                durationMinutes: 45,
                category: 'PERSONAL',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'MEDIA',
                status: 'PLANIFICADO',
                justification: 'Sesión breve de organización de prioridades para la semana entrante.',
            },
            {
                userId: user.id,
                title: 'Lectura Personal: Filosofía & Psicología',
                startTime: new Date('2026-09-06T22:30:00Z'),
                endTime: new Date('2026-09-06T23:30:00Z'),
                durationMinutes: 60,
                category: 'LECTURA',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'BAJA',
                status: 'PLANIFICADO',
                justification: 'Descanso cognitivo nocturno sin pantallas previo al sueño.',
            },
        ],
    });
    console.log('Seeding completed successfully with definitive timetable!');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
