"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyGenerator = void 0;
const date_fns_1 = require("date-fns");
const capacityAnalyzer_1 = require("./capacityAnalyzer");
const overloadDetector_1 = require("./overloadDetector");
class WeeklyGenerator {
    /**
     * Generates a weekly proposal for a 7-day period starting at `mondayDate`.
     * Follows strictly the user's definitive timetable rules.
     */
    static generateWeek(mondayDate, tasks, subjects, userConstraints = capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, options = {}) {
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
        // 1. SCHEDULE FIXED UNIVERSITY CLASSES & CONSULTATIONS
        // =========================================================================
        // LUNES: Paradigmas (08:00 - 11:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[0], 8), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[0], 11), 0),
            durationMinutes: 180,
            category: 'ACADEMIA',
            title: 'Cursada: Paradigmas de Programación',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria (Lunes 08:00 - 11:00).',
        });
        // MARTES: Consulta de Diseño (17:30 - 18:30)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 17), 30),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 18), 30),
            durationMinutes: 60,
            category: 'ACADEMIA',
            title: 'Consulta: Diseño de Sistemas (Final 08/10)',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Consulta con profesores para preparación del FINAL de Diseño.',
        });
        // JUEVES: Administración de Sistemas (19:00 - 23:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 19), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 23), 0),
            durationMinutes: 240,
            category: 'ACADEMIA',
            title: 'Cursada: Administración de Sistemas',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria oficial de Administración (Jueves 19:00 - 23:00).',
        });
        // VIERNES: Paradigmas (08:00 - 11:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 8), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 11), 0),
            durationMinutes: 180,
            category: 'ACADEMIA',
            title: 'Cursada: Paradigmas de Programación',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria (Viernes 08:00 - 11:00).',
        });
        // VIERNES: Economía (14:30 - 17:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 14), 30),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 17), 0),
            durationMinutes: 150,
            category: 'ACADEMIA',
            title: 'Cursada: Economía',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Cursada fija universitaria obligatoria de Economía (Viernes 14:30 - 17:00).',
        });
        // SÁBADO: Fútbol mañana (09:30 - 12:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[5], 9), 30),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[5], 12), 0),
            durationMinutes: 150,
            category: 'DEPORTE',
            title: 'Partido de Fútbol',
            isFixed: true,
            flexibility: 'FIJA',
            energyLevel: 'ALTA',
            justification: 'Actividad deportiva social fija de fin de semana (Sábado por la mañana).',
        });
        // =========================================================================
        // 2. OVERLOAD & SACRIFICE EVALUATION
        // =========================================================================
        const targetGym = options.gymSessionsTarget ?? 4;
        // classHours: 3h Paradigmas (Lun) + 4h Sistemas (Jue) + 3h Paradigmas (Vie) + 2.5h Economía (Vie) = 12.5h
        const initialHoursInput = {
            classHours: 12.5,
            requiredStudyHours: 16.0,
            gymHours: targetGym * 2.25,
            sportHours: (options.enableRugby !== false ? 3.5 : 0) + 2.5, // Rugby 3.5h + Fútbol 2.5h
            sleepHours: userConstraints.targetSleepHours * 7,
            personalBufferHours: 18.0,
            otherFlexibleHours: options.enableMarket ? 2.0 : 0.0,
            examsInNext14Days: 2,
        };
        const overloadReport = overloadDetector_1.OverloadDetector.analyzeWeeklyLoad(initialHoursInput, userConstraints);
        // =========================================================================
        // 3. GIMNASIO (4 DÍAS HABITUALES: LUN, MAR, JUE, VIE)
        // =========================================================================
        // Gimnasio 1 — Lunes tarde: 16:00 - 18:15 (2h 15m)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[0], 16), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[0], 18), 15),
            durationMinutes: 135,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 1 (Fuerza)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Entrenamiento habitual del lunes tarde. Traslado: 10 min.',
        });
        // Gimnasio 2 — Martes temprano: 10:30 - 12:45 (2h 15m)
        // Se programa temprano para dejar margen holgado previo a la Consulta de Diseño a las 17:30
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 10), 30),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 12), 45),
            durationMinutes: 135,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 2 (Temprano)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Gimnasio temprano del martes para no interferir con la Consulta de Diseño (17:30).',
        });
        // Gimnasio 3 — Jueves: 16:00 - 18:00 (2h)
        // Termina a las 18:00 dejando 1h para ducha, cambio y traslado (10 min) hacia Sistemas a las 19:00
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 16), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 18), 0),
            durationMinutes: 120,
            category: 'GIMNASIO',
            title: 'Gimnasio — Sesión 3',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Gimnasio del jueves. Finaliza a las 18:00 con 1 hora de margen antes de Sistemas (19:00).',
        });
        // Gimnasio 4 — Viernes: 17:15 - 19:30 (2h 15m)
        // Economía termina a las 17:00. Se inicia a las 17:15 con margen de traslado para evitar colisión
        if (!overloadReport.isOverloaded || targetGym >= 4) {
            blocks.push({
                startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 17), 15),
                endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[4], 19), 30),
                durationMinutes: 135,
                category: 'GIMNASIO',
                title: 'Gimnasio — Sesión 4',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'ALTA',
                justification: 'Inicia 17:15 tras finalizar Economía (17:00) con margen de traslado de 15 min.',
            });
        }
        // =========================================================================
        // 4. RUGBY (MARTES — SALIDA 19:30, INICIO 21:00)
        // =========================================================================
        const shouldDropRugby = overloadReport.isOverloaded && options.enableRugby !== true;
        if (!shouldDropRugby && options.enableRugby !== false) {
            blocks.push({
                startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 19), 30),
                endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 23), 0),
                durationMinutes: 210,
                category: 'DEPORTE',
                title: 'Rugby (Salida 19:30 — Partido 21:00)',
                isFixed: false,
                flexibility: 'OPCIONAL',
                energyLevel: 'ALTA',
                justification: 'Actividad flexible habitual. Salida 19:30 para partido a las 21:00. Primer elemento a omitir si hay sobrecarga.',
            });
        }
        else {
            // Replaced by rest or light preparation
            blocks.push({
                startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 19), 30),
                endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[1], 21), 0),
                durationMinutes: 90,
                category: 'ACADEMIA',
                title: 'Estudio / Dudas: Diseño de Sistemas',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'MEDIA',
                justification: 'Rugby omitido por alta carga académica hacia parciales.',
            });
        }
        // =========================================================================
        // 5. ESTUDIO PROFUNDO (DÍAS DISPONIBLES: MIÉRCOLES, JUEVES MAÑANA, ETC.)
        // =========================================================================
        // MIÉRCOLES (DÍA DE ALTA FLEXIBILIDAD SIN CURSADAS FIJAS)
        // Bloque 1 mañana: Diseño de Sistemas (09:00 - 11:00, 120m)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 9), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 11), 0),
            durationMinutes: 120,
            category: 'ACADEMIA',
            title: 'Estudio Profundo: Diseño de Sistemas (Final 08/10)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Miércoles sin cursada: bloque estratégico de avance progresivo para el final.',
        });
        // Bloque 2 tarde: Paradigmas (15:00 - 17:00, 120m)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 15), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[2], 17), 0),
            durationMinutes: 120,
            category: 'ACADEMIA',
            title: 'Estudio Profundo: Paradigmas (1.º Parcial)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Preparación de ejercicios de programación lógica para el 1P del 25/09.',
        });
        // JUEVES MAÑANA (Sin cursada hasta las 19:00)
        // Estudio Economía (10:00 - 12:00, 120m)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 10), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[3], 12), 0),
            durationMinutes: 120,
            category: 'ACADEMIA',
            title: 'Estudio: Economía (1.º Parcial)',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'ALTA',
            justification: 'Aprovechamiento de la mañana libre del jueves para conceptos de Economía.',
        });
        // =========================================================================
        // 6. TIEMPO LIBRE, BUFFER Y DESCANSO
        // =========================================================================
        // Sábado tarde: Libre / Amigos / Mates (14:00 - 19:00)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[5], 14), 0),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[5], 19), 0),
            durationMinutes: 300,
            category: 'PERSONAL',
            title: 'Tiempo Libre / Amigos / Mates',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'BAJA',
            justification: 'Sábado tarde reservado para vida personal, desconexión y descanso espontáneo.',
        });
        // Domingo noche: Planificación de la Semana Siguiente (19:30 - 20:15)
        blocks.push({
            startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[6], 19), 30),
            endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(days[6], 20), 15),
            durationMinutes: 45,
            category: 'PERSONAL',
            title: 'Planificación de la Semana Siguiente',
            isFixed: false,
            flexibility: 'FLEXIBLE',
            energyLevel: 'MEDIA',
            justification: 'Sesión breve de organización de prioridades y calendario de la próxima semana.',
        });
        // =========================================================================
        // 7. LECTURA NOCTURNA (FILOSOFÍA & PSICOLOGÍA — 22:30 a 23:30)
        // =========================================================================
        for (const day of [days[0], days[2], days[4], days[6]]) {
            blocks.push({
                startTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(day, 22), 30),
                endTime: (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(day, 23), 30),
                durationMinutes: 60,
                category: 'LECTURA',
                title: 'Lectura Personal: Filosofía & Psicología',
                isFixed: false,
                flexibility: 'FLEXIBLE',
                energyLevel: 'BAJA',
                justification: 'Descanso cognitivo nocturno sin pantallas. Preparación para dormir a las 00:00.',
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
