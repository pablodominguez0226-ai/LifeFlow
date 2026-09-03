"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const weeklyGenerator_1 = require("../src/engine/weeklyGenerator");
(0, vitest_1.describe)('Planning Engine: WeeklyGenerator', () => {
    (0, vitest_1.it)('correctly generates a week preserving default fixed classes, consultation and Saturday football', () => {
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
    (0, vitest_1.it)('injects dynamic custom RecurringRules correctly and reflects them in the proposal', () => {
        const monday = new Date('2026-08-31T00:00:00Z');
        const customRules = [
            {
                dayOfWeek: 1, // Lunes
                startTime: '14:00',
                endTime: '16:00',
                durationMinutes: 120,
                title: 'Cursada: Inteligencia Artificial',
                category: 'ACADEMIA',
                flexibility: 'FIJA',
                isFixed: true,
                energyLevel: 'ALTA',
                justification: 'Nueva materia electiva dinámica.',
                isActive: true,
            },
            {
                dayOfWeek: 3, // Miércoles
                startTime: '07:00',
                endTime: '08:30',
                durationMinutes: 90,
                title: 'Natación Matutina',
                category: 'DEPORTE',
                flexibility: 'FLEXIBLE',
                isFixed: false,
                energyLevel: 'ALTA',
                justification: 'Deporte aeróbico.',
                isActive: true,
            },
            {
                dayOfWeek: 5, // Viernes (Inactiva)
                startTime: '19:00',
                endTime: '20:00',
                durationMinutes: 60,
                title: 'Actividad Inactiva',
                category: 'PERSONAL',
                flexibility: 'OPCIONAL',
                isFixed: false,
                energyLevel: 'BAJA',
                isActive: false, // Desactivada
            },
        ];
        const proposal = weeklyGenerator_1.WeeklyGenerator.generateWeek(monday, [], [], customRules);
        // Verify custom IA rule is present and fixed
        const iaBlock = proposal.blocks.find((b) => b.title === 'Cursada: Inteligencia Artificial');
        (0, vitest_1.expect)(iaBlock).toBeDefined();
        (0, vitest_1.expect)(iaBlock?.isFixed).toBe(true);
        (0, vitest_1.expect)(iaBlock?.durationMinutes).toBe(120);
        // Verify custom swimming rule is present
        const swimBlock = proposal.blocks.find((b) => b.title === 'Natación Matutina');
        (0, vitest_1.expect)(swimBlock).toBeDefined();
        (0, vitest_1.expect)(swimBlock?.category).toBe('DEPORTE');
        // Verify inactive rule is NOT present
        const inactiveBlock = proposal.blocks.find((b) => b.title === 'Actividad Inactiva');
        (0, vitest_1.expect)(inactiveBlock).toBeUndefined();
    });
});
