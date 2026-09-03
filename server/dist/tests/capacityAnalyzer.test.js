"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const capacityAnalyzer_1 = require("../src/engine/capacityAnalyzer");
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
});
