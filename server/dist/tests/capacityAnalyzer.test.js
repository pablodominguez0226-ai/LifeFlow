"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const capacityAnalyzer_1 = require("../src/engine/capacityAnalyzer");
const dailyPlanner_1 = require("../src/engine/dailyPlanner");
(0, vitest_1.describe)('Planning Engine: CapacityAnalyzer', () => {
    (0, vitest_1.it)('blocks scheduling during sleep window (00:00 to 06:30)', () => {
        const sleepTime = new Date('2026-09-02T03:30:00');
        const result = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(sleepTime, 60, 'ESTUDIO_PROFUNDO', 'ALTA', 3 // Wednesday
        );
        (0, vitest_1.expect)(result.allowed).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('sueño');
    });
    (0, vitest_1.it)('blocks deep study during wind-down period (after 22:30)', () => {
        const nightTime = new Date('2026-09-02T22:45:00');
        const result = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(nightTime, 60, 'ESTUDIO_PROFUNDO', 'ALTA', 3 // Wednesday
        );
        (0, vitest_1.expect)(result.allowed).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('22:30');
    });
    (0, vitest_1.it)('allows light reading during wind-down period (after 22:30)', () => {
        const nightTime = new Date('2026-09-02T22:45:00');
        const result = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(nightTime, 45, 'ESTUDIO_LIVIANO', 'BAJA', 3 // Wednesday
        );
        (0, vitest_1.expect)(result.allowed).toBe(true);
    });
    (0, vitest_1.it)('protects against deep study on Thursday night after Administración de Sistemas (23:00)', () => {
        const thursdayNight = new Date('2026-09-03T23:15:00');
        const result = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(thursdayNight, 45, 'ESTUDIO_PROFUNDO', 'ALTA', 4 // Thursday
        );
        (0, vitest_1.expect)(result.allowed).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('jueves');
        (0, vitest_1.expect)(result.reason).toContain('23:00');
    });
    (0, vitest_1.it)('chunks long study blocks into 50 min work + 10 min break', () => {
        const chunks = capacityAnalyzer_1.CapacityAnalyzer.chunkStudyDuration(110);
        (0, vitest_1.expect)(chunks.length).toBe(3); // 50+10, 50+10, 10
        (0, vitest_1.expect)(chunks[0].workMinutes).toBe(50);
        (0, vitest_1.expect)(chunks[0].breakMinutes).toBe(10);
    });
    (0, vitest_1.describe)('Adaptive Fatigue Feedback Loop (Check-in Integration)', () => {
        (0, vitest_1.it)('maintains nominal constraints with high energy (4-5) and 7.5h sleep', () => {
            const normalContext = {
                date: new Date('2026-09-02'),
                sleepHours: 7.5,
                energyLevel: 4,
                stressLevel: 2,
            };
            const adj = capacityAnalyzer_1.CapacityAnalyzer.calculateFatigaAdjustment(normalContext);
            (0, vitest_1.expect)(adj.isFatigued).toBe(false);
            (0, vitest_1.expect)(adj.adjustedMaxFocusMinutes).toBe(120);
            (0, vitest_1.expect)(adj.adjustedWindDownStartTime).toBe('22:30');
            (0, vitest_1.expect)(adj.downgradeDeepStudy).toBe(false);
            (0, vitest_1.expect)(adj.durationScale).toBe(1.0);
            // Allows 90m deep study block at 10:00
            const allowed = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(new Date('2026-09-02T10:00:00'), 90, 'ESTUDIO_PROFUNDO', 'ALTA', 3, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, normalContext);
            (0, vitest_1.expect)(allowed.allowed).toBe(true);
        });
        (0, vitest_1.it)('triggers fatigue protocol when energy is low (energyLevel <= 2)', () => {
            const fatiguedContext = {
                date: new Date('2026-09-02'),
                sleepHours: 7.0,
                energyLevel: 2,
                stressLevel: 3,
            };
            const adj = capacityAnalyzer_1.CapacityAnalyzer.calculateFatigaAdjustment(fatiguedContext);
            (0, vitest_1.expect)(adj.isFatigued).toBe(true);
            (0, vitest_1.expect)(adj.adjustedMaxFocusMinutes).toBe(60);
            (0, vitest_1.expect)(adj.adjustedWindDownStartTime).toBe('22:00');
            (0, vitest_1.expect)(adj.downgradeDeepStudy).toBe(true);
            (0, vitest_1.expect)(adj.durationScale).toBe(0.6);
            (0, vitest_1.expect)(adj.warnings.some((w) => w.includes('energía bajo'))).toBe(true);
        });
        (0, vitest_1.it)('triggers fatigue protocol when sleep is deficient (sleepHours < 6.5)', () => {
            const sleepDeficitContext = {
                date: new Date('2026-09-02'),
                sleepHours: 5.5,
                energyLevel: 3,
                stressLevel: 2,
            };
            const adj = capacityAnalyzer_1.CapacityAnalyzer.calculateFatigaAdjustment(sleepDeficitContext);
            (0, vitest_1.expect)(adj.isFatigued).toBe(true);
            (0, vitest_1.expect)(adj.adjustedMaxFocusMinutes).toBe(60);
            (0, vitest_1.expect)(adj.adjustedWindDownStartTime).toBe('22:00');
            (0, vitest_1.expect)(adj.downgradeDeepStudy).toBe(true);
            (0, vitest_1.expect)(adj.warnings.some((w) => w.includes('Déficit de sueño'))).toBe(true);
            // Rejects 90 min deep study (> 60 min limit under fatigue)
            const checkOver60 = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(new Date('2026-09-02T10:00:00'), 90, 'ESTUDIO_PROFUNDO', 'ALTA', 3, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, sleepDeficitContext);
            (0, vitest_1.expect)(checkOver60.allowed).toBe(false);
            (0, vitest_1.expect)(checkOver60.reason).toContain('60 minutos');
            // Rejects study after 22:00 under fatigue
            const checkAfter22 = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(new Date('2026-09-02T22:15:00'), 45, 'ESTUDIO_PROFUNDO', 'ALTA', 3, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, sleepDeficitContext);
            (0, vitest_1.expect)(checkAfter22.allowed).toBe(false);
            (0, vitest_1.expect)(checkAfter22.reason).toContain('22:00');
            // Allows 45 min study at 10:00
            const checkUnder60 = capacityAnalyzer_1.CapacityAnalyzer.canScheduleTaskAt(new Date('2026-09-02T10:00:00'), 45, 'ESTUDIO_PROFUNDO', 'ALTA', 3, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS, sleepDeficitContext);
            (0, vitest_1.expect)(checkUnder60.allowed).toBe(true);
        });
        (0, vitest_1.it)('adapts daily plan: trims blocks to 60m and downgrades deep study title and intensity', () => {
            const targetDate = new Date('2026-09-02T12:00:00');
            const fatiguedContext = {
                date: targetDate,
                sleepHours: 5.0,
                energyLevel: 2,
                stressLevel: 4,
            };
            const blocks = [
                {
                    startTime: new Date('2026-09-02T09:00:00'),
                    endTime: new Date('2026-09-02T11:00:00'),
                    durationMinutes: 120,
                    category: 'ACADEMIA',
                    title: 'Estudio Profundo: Diseño de Sistemas',
                    isFixed: false,
                    flexibility: 'FLEXIBLE',
                    energyLevel: 'ALTA',
                },
            ];
            const plan = dailyPlanner_1.DailyPlanner.planDay(targetDate, blocks, fatiguedContext);
            (0, vitest_1.expect)(plan.fatigueAdjustment?.isFatigued).toBe(true);
            (0, vitest_1.expect)(plan.morning[0].durationMinutes).toBe(60);
            (0, vitest_1.expect)(plan.morning[0].title).toContain('Repaso / Ejercicios Adaptativos');
            (0, vitest_1.expect)(plan.morning[0].energyLevel).toBe('MEDIA');
            (0, vitest_1.expect)(plan.morning[0].justification).toContain('Adaptado por fatiga');
        });
    });
});
