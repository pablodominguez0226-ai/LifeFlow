import { describe, it, expect } from 'vitest';
import { PriorityScorer } from '../src/engine/priorityScorer';
import { TaskInput, SubjectInput } from '../src/engine/types';

describe('Planning Engine: PriorityScorer', () => {
  const referenceDate = new Date('2026-09-02T12:00:00Z');

  it('correctly calculates high priority for Paradigmas 1.º Parcial (23 days out)', () => {
    const task: TaskInput = {
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

    const result = PriorityScorer.calculateTaskPriority(task, referenceDate);

    expect(result.totalScore).toBeGreaterThan(65);
    expect(result.explanation).toContain('Paradigmas de Programación');
    expect(result.explanation).toContain('23 días');
  });

  it('boosts priority significantly when an exam is less than 7 days away', () => {
    const taskNear: TaskInput = {
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

    const taskFar: TaskInput = {
      ...taskNear,
      examDate: new Date('2026-11-20T08:00:00Z'), // Global exam in Nov
    };

    const scoreNear = PriorityScorer.calculateTaskPriority(taskNear, referenceDate);
    const scoreFar = PriorityScorer.calculateTaskPriority(taskFar, referenceDate);

    expect(scoreNear.totalScore).toBeGreaterThan(scoreFar.totalScore);
    expect(scoreNear.proximityScore).toBeGreaterThanOrEqual(9.0);
  });

  it('penalizes mastery: lower mastery yields higher priority score', () => {
    const baseTask: TaskInput = {
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

    const lowMasteryTask: TaskInput = {
      ...baseTask,
      subjectMastery: 'BAJO',
    };

    const resHigh = PriorityScorer.calculateTaskPriority(baseTask, referenceDate);
    const resLow = PriorityScorer.calculateTaskPriority(lowMasteryTask, referenceDate);

    expect(resLow.lowMasteryScore).toBeGreaterThan(resHigh.lowMasteryScore);
    expect(resLow.totalScore).toBeGreaterThan(resHigh.totalScore);
  });
});
