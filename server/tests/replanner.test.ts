import { describe, it, expect } from 'vitest';
import { Replanner } from '../src/engine/replanner';
import { TaskInput } from '../src/engine/types';

describe('Planning Engine: Replanner', () => {
  it('provides sensible non-domino fallback options for an uncompleted task', () => {
    const task: TaskInput = {
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

    const evaluation = Replanner.evaluateMissedTask(
      task,
      new Date('2026-09-02T18:00:00Z'),
      []
    );

    expect(evaluation.options.length).toBeGreaterThanOrEqual(3);
    const actions = evaluation.options.map((o) => o.action);
    expect(actions).toContain('MOVER');
    expect(actions).toContain('DIVIDIR');
    expect(actions).toContain('REDUCIR');
  });
});
