"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const priorityScorer_1 = require("../src/engine/priorityScorer");
(0, vitest_1.describe)('Planning Engine: PriorityScorer', () => {
    const referenceDate = new Date('2026-09-02T12:00:00Z');
    (0, vitest_1.it)('correctly calculates high priority for Paradigmas 1.º Parcial (23 days out)', () => {
        const task = {
            id: 'task-1',
            subjectId: 'sub-paradigmas',
            subjectName: 'Paradigmas de Programación',
            title: 'Práctica de Programación Lógica (Prolog)',
            taskType: 'ESTUDIO_PROFUNDO',
            estimatedMinutes: 90,
            remainingMinutes: 90,
            energyLevel: 'ALTA',
            examDate: new Date('2026-09-25T08:00:00Z'), // 23 days from 02/09
            subjectMastery: 'MEDIO',
            subjectWeight: 1.5,
        };
        const result = priorityScorer_1.PriorityScorer.calculateTaskPriority(task, referenceDate);
        (0, vitest_1.expect)(result.totalScore).toBeGreaterThan(65);
        (0, vitest_1.expect)(result.explanation).toContain('Paradigmas de Programación');
        (0, vitest_1.expect)(result.explanation).toContain('23 días');
    });
    (0, vitest_1.it)('boosts priority significantly when an exam is less than 7 days away', () => {
        const taskNear = {
            id: 'task-near',
            subjectId: 'sub-paradigmas',
            subjectName: 'Paradigmas de Programación',
            title: 'Simulacro Final Parcial',
            taskType: 'SIMULACRO',
            estimatedMinutes: 120,
            remainingMinutes: 120,
            energyLevel: 'ALTA',
            examDate: new Date('2026-09-06T08:00:00Z'), // 4 days away
            subjectMastery: 'BAJO',
            subjectWeight: 1.5,
        };
        const taskFar = {
            ...taskNear,
            examDate: new Date('2026-11-20T08:00:00Z'), // Global exam in Nov
        };
        const scoreNear = priorityScorer_1.PriorityScorer.calculateTaskPriority(taskNear, referenceDate);
        const scoreFar = priorityScorer_1.PriorityScorer.calculateTaskPriority(taskFar, referenceDate);
        (0, vitest_1.expect)(scoreNear.totalScore).toBeGreaterThan(scoreFar.totalScore);
        (0, vitest_1.expect)(scoreNear.proximityScore).toBeGreaterThanOrEqual(9.0);
    });
    (0, vitest_1.it)('penalizes mastery: lower mastery yields higher priority score', () => {
        const baseTask = {
            id: 'task-mastery',
            subjectId: 'sub-1',
            subjectName: 'Test Subject',
            title: 'Repaso',
            taskType: 'REPASO',
            estimatedMinutes: 60,
            remainingMinutes: 60,
            energyLevel: 'MEDIA',
            examDate: new Date('2026-09-25T08:00:00Z'),
            subjectMastery: 'ALTO',
            subjectWeight: 1.0,
        };
        const lowMasteryTask = {
            ...baseTask,
            subjectMastery: 'BAJO',
        };
        const resHigh = priorityScorer_1.PriorityScorer.calculateTaskPriority(baseTask, referenceDate);
        const resLow = priorityScorer_1.PriorityScorer.calculateTaskPriority(lowMasteryTask, referenceDate);
        (0, vitest_1.expect)(resLow.lowMasteryScore).toBeGreaterThan(resHigh.lowMasteryScore);
        (0, vitest_1.expect)(resLow.totalScore).toBeGreaterThan(resHigh.totalScore);
    });
});
