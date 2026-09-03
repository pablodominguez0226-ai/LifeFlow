"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const weeklyGenerator_1 = require("../src/engine/weeklyGenerator");
(0, vitest_1.describe)('Planning Engine: WeeklyGenerator', () => {
    (0, vitest_1.it)('correctly generates a week preserving fixed classes, consultation and Saturday football', () => {
        const monday = new Date('2026-08-31T00:00:00Z');
        const proposal = weeklyGenerator_1.WeeklyGenerator.generateWeek(monday, [], []);
        (0, vitest_1.expect)(proposal.blocks.length).toBeGreaterThan(10);
        // Verify fixed Paradigmas
        const parad = proposal.blocks.find((b) => b.title.includes('Paradigmas de Programación'));
        (0, vitest_1.expect)(parad).toBeDefined();
        (0, vitest_1.expect)(parad?.isFixed).toBe(true);
        // Verify fixed Consulta de Diseño
        const consulta = proposal.blocks.find((b) => b.title.includes('Consulta: Diseño'));
        (0, vitest_1.expect)(consulta).toBeDefined();
        (0, vitest_1.expect)(consulta?.isFixed).toBe(true);
        // Verify fixed Saturday Football
        const futbol = proposal.blocks.find((b) => b.title.includes('Fútbol'));
        (0, vitest_1.expect)(futbol).toBeDefined();
        (0, vitest_1.expect)(futbol?.isFixed).toBe(true);
        // Verify Philosophy & Psychology reading blocks exist
        const reading = proposal.blocks.filter((b) => b.category === 'LECTURA');
        (0, vitest_1.expect)(reading.length).toBeGreaterThanOrEqual(2);
        // Verify Sustainability Score
        (0, vitest_1.expect)(proposal.sustainabilityScore).toBeGreaterThanOrEqual(50);
    });
});
