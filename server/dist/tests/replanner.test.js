"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const replanner_1 = require("../src/engine/replanner");
(0, vitest_1.describe)('Planning Engine: Replanner', () => {
    (0, vitest_1.it)('provides sensible non-domino fallback options for an uncompleted task', () => {
        const task = {
            id: 'task-missed',
            subjectId: 'sub-diseno',
            subjectName: 'Diseño de Sistemas',
            title: 'Práctica de Microservicios',
            taskType: 'ESTUDIO_PROFUNDO',
            estimatedMinutes: 90,
            remainingMinutes: 90,
            energyLevel: 'ALTA',
            examDate: new Date('2026-10-08T09:00:00Z'),
            subjectMastery: 'MEDIO',
            subjectWeight: 2.0,
        };
        const evaluation = replanner_1.Replanner.evaluateMissedTask(task, new Date('2026-09-02T18:00:00Z'), []);
        (0, vitest_1.expect)(evaluation.options.length).toBeGreaterThanOrEqual(3);
        const actions = evaluation.options.map((o) => o.action);
        (0, vitest_1.expect)(actions).toContain('MOVER');
        (0, vitest_1.expect)(actions).toContain('DIVIDIR');
        (0, vitest_1.expect)(actions).toContain('REDUCIR');
    });
});
