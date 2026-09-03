import { describe, it, expect } from 'vitest';
import { OverloadDetector, WeeklyHoursInput } from '../src/engine/overloadDetector';
import { CapacityAnalyzer } from '../src/engine/capacityAnalyzer';

describe('Planning Engine: OverloadDetector & Sacrifice Rules', () => {
  it('detects high overload and recommends dropping Rugby first', () => {
    const heavyWeek: WeeklyHoursInput = {
      classHours: 23.5,
      requiredStudyHours: 28.0, // heavy study demand
      gymHours: 9.0, // 4 sessions
      sportHours: 6.0, // Rugby (3.5) + Futbol (2.5)
      sleepHours: 52.5, // 7.5h x 7
      personalBufferHours: 15.0,
      examsInNext14Days: 3,
    };

    const report = OverloadDetector.analyzeWeeklyLoad(
      heavyWeek,
      CapacityAnalyzer.DEFAULT_CONSTRAINTS
    );

    expect(report.isOverloaded).toBe(true);
    expect(['ALTA', 'EXCESIVA']).toContain(report.level);
    expect(report.suggestedSacrifices.some((s) => s.includes('Rugby'))).toBe(true);
    expect(report.recommendations.some((r) => r.includes('NUNCA recortar horas de sueño'))).toBe(true);
  });

  it('keeps normal status on a balanced week with preserved buffer', () => {
    const balancedWeek: WeeklyHoursInput = {
      classHours: 23.5,
      requiredStudyHours: 12.0,
      gymHours: 8.0,
      sportHours: 5.0,
      sleepHours: 52.5,
      personalBufferHours: 18.0,
      examsInNext14Days: 0,
    };

    const report = OverloadDetector.analyzeWeeklyLoad(
      balancedWeek,
      CapacityAnalyzer.DEFAULT_CONSTRAINTS
    );

    expect(report.isOverloaded).toBe(false);
    expect(['BAJA', 'MODERADA']).toContain(report.level);
    expect(report.suggestedSacrifices.length).toBe(0);
  });
});
