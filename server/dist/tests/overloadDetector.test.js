"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const overloadDetector_1 = require("../src/engine/overloadDetector");
const capacityAnalyzer_1 = require("../src/engine/capacityAnalyzer");
(0, vitest_1.describe)('Planning Engine: OverloadDetector & Sacrifice Rules', () => {
    (0, vitest_1.it)('detects high overload and recommends dropping Rugby first', () => {
        const heavyWeek = {
            classHours: 23.5,
            requiredStudyHours: 28.0, // heavy study demand
            gymHours: 9.0, // 4 sessions
            sportHours: 6.0, // Rugby (3.5) + Futbol (2.5)
            sleepHours: 52.5, // 7.5h x 7
            personalBufferHours: 15.0,
            examsInNext14Days: 3,
        };
        const report = overloadDetector_1.OverloadDetector.analyzeWeeklyLoad(heavyWeek, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS);
        (0, vitest_1.expect)(report.isOverloaded).toBe(true);
        (0, vitest_1.expect)(['ALTA', 'EXCESIVA']).toContain(report.level);
        (0, vitest_1.expect)(report.suggestedSacrifices.some((s) => s.includes('Rugby'))).toBe(true);
        (0, vitest_1.expect)(report.recommendations.some((r) => r.includes('NUNCA recortar horas de sueño'))).toBe(true);
    });
    (0, vitest_1.it)('keeps normal status on a balanced week with preserved buffer', () => {
        const balancedWeek = {
            classHours: 23.5,
            requiredStudyHours: 12.0,
            gymHours: 8.0,
            sportHours: 5.0,
            sleepHours: 52.5,
            personalBufferHours: 18.0,
            examsInNext14Days: 0,
        };
        const report = overloadDetector_1.OverloadDetector.analyzeWeeklyLoad(balancedWeek, capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS);
        (0, vitest_1.expect)(report.isOverloaded).toBe(false);
        (0, vitest_1.expect)(['BAJA', 'MODERADA']).toContain(report.level);
        (0, vitest_1.expect)(report.suggestedSacrifices.length).toBe(0);
    });
});
