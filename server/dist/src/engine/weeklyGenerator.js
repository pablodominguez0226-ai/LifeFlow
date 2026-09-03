"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyGenerator = void 0;
const date_fns_1 = require("date-fns");
const capacityAnalyzer_1 = require("./capacityAnalyzer");
const overloadDetector_1 = require("./overloadDetector");
class WeeklyGenerator {
    /**
     * Default recurring rules representing the user's definitive timetable.
     * Used as baseline when no custom database rules are provided.
     */
    static DEFAULT_RECURRING_RULES = [
        // LUNES: Paradigmas (08:00 - 11:00)
        {
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '11:00',
            durationMinutes: 180,
            category: 'ACADEMIA',
            title: 'Cursada: Paradigmas de Programación',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria (Lunes 08:00 - 11:00).',
            isActive: true,
        },
        // LUNES: Gimnasio (16:00 - 18:15)
        {
            dayOfWeek: 1,
            startTime: '16:00',
            endTime: '18:15',
            durationMinutes: 135,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 1 (Fuerza)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Entrenamiento habitual del lunes tarde. Traslado: 10 min.',
            isActive: true,
        },
        // MARTES: Gimnasio Temprano (10:30 - 12:45)
        {
            dayOfWeek: 2,
            startTime: '10:30',
            endTime: '12:45',
            durationMinutes: 135,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 2 (Temprano)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Gimnasio temprano del martes para no interferir con la Consulta de Diseño (17:30).',
            isActive: true,
        },
        // MARTES: Consulta de Diseño (17:30 - 18:30)
        {
            dayOfWeek: 2,
            startTime: '17:30',
            endTime: '18:30',
            durationMinutes: 60,
            category: 'ACADEMIA',
            title: 'Consulta: Diseño de Sistemas (Final 08/10)',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Consulta con profesores para preparación del FINAL de Diseño.',
            isActive: true,
        },
        // MARTES: Rugby (19:30 - 23:00)
        {
            dayOfWeek: 2,
            startTime: '19:30',
            endTime: '23:00',
            durationMinutes: 210,
            category: 'DEPORTE',
            title: 'Rugby (Salida 19:30 — Partido 21:00)',
            isFixed: false,
            flexibility: 'OPCIONAL',
            energyLevel: 'ALTA',
            justification: 'Actividad flexible habitual. Salida 19:30 para partido a las 21:00. Primer elemento a omitir si hay sobrecarga.',
            isActive: true,
        },
        // JUEVES: Gimnasio (16:00 - 18:00)
        {
            dayOfWeek: 4,
            startTime: '16:00',
            endTime: '18:00',
            durationMinutes: 120,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 3',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Gimnasio del jueves. Finaliza a las 18:00 con 1 hora de margen antes de Sistemas (19:00).',
            isActive: true,
        },
        // JUEVES: Administración de Sistemas (19:00 - 23:00)
        {
            dayOfWeek: 4,
            startTime: '19:00',
            endTime: '23:00',
            durationMinutes: 240,
            category: 'ACADEMIA',
            title: 'Cursada: Administración de Sistemas',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria oficial de Administración (Jueves 19:00 - 23:00).',
            isActive: true,
        },
        // VIERNES: Paradigmas (08:00 - 11:00)
        {
            dayOfWeek: 5,
            startTime: '08:00',
            endTime: '11:00',
            durationMinutes: 180,
            category: 'ACADEMIA',
            title: 'Cursada: Paradigmas de Programación',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria (Viernes 08:00 - 11:00).',
            isActive: true,
        },
        // VIERNES: Economía (14:30 - 17:00)
        {
            dayOfWeek: 5,
            startTime: '14:30',
            endTime: '17:00',
            durationMinutes: 150,
            category: 'ACADEMIA',
            title: 'Cursada: Economía',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria de Economía (Viernes 14:30 - 17:00).',
            isActive: true,
        },
        // VIERNES: Gimnasio (17:15 - 19:30)
        {
            dayOfWeek: 5,
            startTime: '17:15',
            endTime: '19:30',
            durationMinutes: 135,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 4',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Inicia 17:15 tras finalizar Economía (17:00) con margen de traslado de 15 min.',
            isActive: true,
        },
        // SÁBADO: Fútbol (09:30 - 12:00)
        {
            dayOfWeek: 6,
            startTime: '09:30',
            endTime: '12:00',
            durationMinutes: 150,
            category: 'DEPORTE',
            title: 'Partido de Fútbol',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Actividad deportiva social fija de fin de semana (Sábado por la mañana).',
            isActive: true,
        },
        // SÁBADO: Tiempo Libre (14:00 - 19:00)
        {
            dayOfWeek: 6,
            startTime: '14:00',
            endTime: '19:00',
            durationMinutes: 300,
            category: 'PERSONAL',
            title: 'Tiempo Libre / Amigos / Mates',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Sábado tarde reservado para vida personal, desconexión y descanso espontáneo.',
            isActive: true,
        },
        // DOMINGO: Planificación Semanal (19:30 - 20:15)
        {
            dayOfWeek: 0,
            startTime: '19:30',
            endTime: '20:15',
            durationMinutes: 45,
            category: 'PERSONAL',
            title: 'Planificación de la Semana Siguiente',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'MEDIA',
            justification: 'Sesión breve de organización de prioridades y calendario de la próxima semana.',
            isActive: true,
        },
        // LECTURAS NOCTURNAS (LUN, MIÉ, VIE, DOM 22:30 - 23:30)
        {
            dayOfWeek: 1,
            startTime: '22:30',
            endTime: '23:30',
            durationMinutes: 60,
            category: 'LECTURA',
            title: 'Lectura Personal: Filosofía & Psicología',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Descanso cognitivo nocturno sin pantallas. Preparación para dormir a las 00:00.',
            isActive: true,
        },
        {
            dayOfWeek: 3,
            startTime: '22:30',
            endTime: '23:30',
            durationMinutes: 60,
            category: 'LECTURA',
            title: 'Lectura Personal: Filosofía & Psicología',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Descanso cognitivo nocturno sin pantallas. Preparación para dormir a las 00:00.',
            isActive: true,
        },
        {
            dayOfWeek: 5,
            startTime: '22:30',
            endTime: '23:30',
            durationMinutes: 60,
            category: 'LECTURA',
            title: 'Lectura Personal: Filosofía & Psicología',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Descanso cognitivo nocturno sin pantallas. Preparación para dormir a las 00:00.',
            isActive: true,
        },
        {
            dayOfWeek: 0,
            startTime: '22:30',
            endTime: '23:30',
            durationMinutes: 60,
            category: 'LECTURA',
            title: 'Lectura Personal: Filosofía & Psicología',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Descanso cognitivo nocturno sin pantallas. Preparación para dormir a las 00:00.',
            isActive: true,
        },
    ];
    /**
     * Generates a weekly proposal for a 7-day period starting at `mondayDate`.
     * Injects dynamic recurring rules from the database (or defaults).
     */
    static generateWeek(mondayDate, tasks, subjects, userConstraintsOrRules = capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, optionsOrConstraints = {}, maybeOptions = {}) {
        // Parameter normalization to support both overloaded signatures
        let userConstraints = capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS;
        let recurringRules = [];
        let options = {};
        if (Array.isArray(userConstraintsOrRules)) {
            recurringRules = userConstraintsOrRules;
            if (optionsOrConstraints && 'targetWakeTime' in optionsOrConstraints) {
                userConstraints = optionsOrConstraints;
                options = maybeOptions;
            }
            else {
                options = optionsOrConstraints || {};
            }
        }
        else {
            userConstraints = userConstraintsOrRules;
            options = optionsOrConstraints || {};
            if (options.recurringRules) {
                recurringRules = options.recurringRules;
            }
        }
        const blocks = [];
        const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => (0, date_fns_1.addDays)(mondayDate, offset));
        // Determine macro phase based on dates
        let macroPhase = 'FASE_1';
        const firstDayStr = (0, date_fns_1.format)(days[0], 'yyyy-MM-dd');
        if (firstDayStr >= '2026-10-07') {
            macroPhase = 'FASE_3';
        }
        else if (firstDayStr >= '2026-09-26') {
            macroPhase = 'FASE_2';
        }
        // =========================================================================
        // 1. INJECT DYNAMIC RECURRING RULES (CURSADAS, GYM, SPORTS, BUFFER)
        // =========================================================================
        const rulesToApply = recurringRules && recurringRules.length > 0
            ? recurringRules.filter((r) => r.isActive !== false)
            : WeeklyGenerator.DEFAULT_RECURRING_RULES;
        for (const rule of rulesToApply) {
            // rule.dayOfWeek: 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
            // Monday is dayOffset 0, Tuesday is 1, ..., Sunday is 6
            const dayOffset = (rule.dayOfWeek + 6) % 7;
            const targetDay = days[dayOffset];
            const [startH, startM] = rule.startTime.split(':').map(Number);
            const [endH, endM] = rule.endTime.split(':').map(Number);
            const startTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(targetDay, startH), startM);
            const endTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(targetDay, endH), endM);
            // Handle optional rugby sacrifice option
            if (rule.category === 'DEPORTE' &&
                rule.flexibility === 'OPCIONAL' &&
                options.enableRugby === false) {
                // Rugby omitted; add light preparation/rest block instead
                blocks.push({
                    startTime,
                    endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(targetDay, Math.min(startH + 2, 22)), 0),
                    durationMinutes: 90,
                    category: 'ACADEMIA',
                    title: 'Estudio / Dudas: Diseño de Sistemas',
                    isFixed: false,
                    flexibility: 'FLEXIBLE',
                    energyLevel: 'MEDIA',
                    justification: 'Rugby omitido por alta carga académica hacia parciales.',
                });
                continue;
            }
            blocks.push({
                startTime,
                endTime,
                durationMinutes: rule.durationMinutes,
                category: rule.category,
                title: rule.title,
                isFixed: rule.isFixed,
                flexibility: rule.flexibility,
                energyLevel: rule.energyLevel,
                justification: rule.justification || `Regla semanal recurrente (${rule.category}).`,
            });
        }
        // =========================================================================
        // 2. OVERLOAD & SACRIFICE EVALUATION
        // =========================================================================
        const classHours = rulesToApply
            .filter((r) => r.category === 'ACADEMIA' && r.isFixed)
            .reduce((acc, r) => acc + r.durationMinutes / 60, 0);
        const gymHours = rulesToApply
            .filter((r) => r.category === 'GIMNASIO')
            .reduce((acc, r) => acc + r.durationMinutes / 60, 0);
        const sportHours = rulesToApply
            .filter((r) => r.category === 'DEPORTE')
            .reduce((acc, r) => acc + r.durationMinutes / 60, 0);
        const initialHoursInput = {
            classHours: classHours > 0 ? classHours : 12.5,
            requiredStudyHours: 16.0,
            gymHours: gymHours > 0 ? gymHours : (options.gymSessionsTarget ?? 4) * 2.25,
            sportHours: sportHours > 0 ? sportHours : 6.0,
            sleepHours: userConstraints.targetSleepHours * 7,
            personalBufferHours: 18.0,
            otherFlexibleHours: options.enableMarket ? 2.0 : 0.0,
            examsInNext14Days: 2,
        };
        const overloadReport = overloadDetector_1.OverloadDetector.analyzeWeeklyLoad(initialHoursInput, userConstraints);
        // =========================================================================
        // 3. ESTUDIO PROFUNDO EN DÍAS FLEXIBLES (MIÉRCOLES & JUEVES MAÑANA)
        // =========================================================================
        const hasCollision = (start, end) => {
            return blocks.some((b) => start.getTime() < b.endTime.getTime() && end.getTime() > b.startTime.getTime());
        };
        // Miércoles mañana: Diseño de Sistemas (09:00 - 11:00)
        const wedMornStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 9), 0);
        const wedMornEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 11), 0);
        if (!hasCollision(wedMornStart, wedMornEnd)) {
            blocks.push({
                startTime: wedMornStart,
                endTime: wedMornEnd,
                durationMinutes: 120,
                category: 'ACADEMIA',
                title: 'Estudio Profundo: Diseño de Sistemas (Final 08/10)',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'ALTA',
                justification: 'Miércoles sin cursada: bloque estratégico de avance progresivo para el final.',
            });
        }
        // Miércoles tarde: Paradigmas (15:00 - 17:00)
        const wedAftStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 15), 0);
        const wedAftEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 17), 0);
        if (!hasCollision(wedAftStart, wedAftEnd)) {
            blocks.push({
                startTime: wedAftStart,
                endTime: wedAftEnd,
                durationMinutes: 120,
                category: 'ACADEMIA',
                title: 'Estudio Profundo: Paradigmas (1.º Parcial)',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'ALTA',
                justification: 'Preparación de ejercicios de programación lógica para el 1P del 25/09.',
            });
        }
        // Jueves mañana: Economía (10:00 - 12:00)
        const thuMornStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 10), 0);
        const thuMornEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 12), 0);
        if (!hasCollision(thuMornStart, thuMornEnd)) {
            blocks.push({
                startTime: thuMornStart,
                endTime: thuMornEnd,
                durationMinutes: 120,
                category: 'ACADEMIA',
                title: 'Estudio: Economía (1.º Parcial)',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'ALTA',
                justification: 'Aprovechamiento de la mañana libre del jueves para conceptos de Economía.',
            });
        }
        // Sort all blocks chronologically
        blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        // Calculate sustainability score (0 - 100)
        const sustainabilityScore = Math.max(40, Math.min(100, Math.round(100 -
            (overloadReport.level === 'EXCESIVA' ? 40 : overloadReport.level === 'ALTA' ? 20 : 0) +
            (overloadReport.bufferRatioRemaining >= 0.15 ? 10 : -10))));
        const summary = `Semana ${(0, date_fns_1.format)(days[0], 'dd/MM')} a ${(0, date_fns_1.format)(days[6], 'dd/MM')}: Carga ${overloadReport.level.toLowerCase()}, sostenibilidad ${sustainabilityScore}/100. Sueño protegido y buffer personal respetado.`;
        return {
            startDate: days[0],
            endDate: days[6],
            macroPhase,
            overloadReport,
            blocks,
            sustainabilityScore,
            summary,
        };
    }
}
exports.WeeklyGenerator = WeeklyGenerator;
