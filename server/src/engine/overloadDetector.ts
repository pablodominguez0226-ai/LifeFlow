import { OverloadReport, OverloadLevel, UserConstraints } from './types';

export interface WeeklyHoursInput {
  classHours: number; // Paradigmas (6h) + Sistemas (4h) + Economía (2.5h) = 12.5h
  requiredStudyHours: number; // calculated from active tasks / exam proximity
  gymHours: number; // 4 sessions x 2.25h = 9h
  sportHours: number; // Rugby (3.5h) + Futbol (2.5h) = 6h
  sleepHours: number; // 7.5h x 7 = 52.5h
  personalBufferHours: number; // Meals, errands, buffer (~18h)
  otherFlexibleHours?: number; // Market/trading (~2h)
  examsInNext14Days: number; // Count of exams in next 2 weeks
}

export class OverloadDetector {
  /**
   * Total hours in a week = 7 * 24 = 168 hours.
   */
  public static readonly TOTAL_WEEK_HOURS = 168;

  public static analyzeWeeklyLoad(
    input: WeeklyHoursInput,
    constraints: UserConstraints
  ): OverloadReport {
    const sleepHours = input.sleepHours || constraints.targetSleepHours * 7;
    const availableAwakeHours = this.TOTAL_WEEK_HOURS - sleepHours; // e.g. 168 - 52.5 = 115.5h

    const baseCommittedHours =
      input.classHours +
      input.requiredStudyHours +
      input.gymHours +
      input.sportHours +
      (input.otherFlexibleHours || 0);

    const totalCommittedHours = baseCommittedHours + input.personalBufferHours;
    const totalAllHours = totalCommittedHours + sleepHours;

    const remainingFreeHours = this.TOTAL_WEEK_HOURS - totalAllHours;
    const bufferRatioRemaining =
      (availableAwakeHours - baseCommittedHours) / availableAwakeHours;

    let level: OverloadLevel = 'BAJA';
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const suggestedSacrifices: string[] = [];

    // Evaluate load severity
    if (bufferRatioRemaining < 0.05 || totalAllHours > this.TOTAL_WEEK_HOURS) {
      level = 'EXCESIVA';
      warnings.push(
        'La carga semanal excede la capacidad humana sostenible. No hay tiempo físico para imprevistos o descanso básico.'
      );
    } else if (bufferRatioRemaining < 0.12 || input.examsInNext14Days >= 3) {
      level = 'ALTA';
      warnings.push(
        `Semana de alta exigencia: ${input.examsInNext14Days} exámenes próximos y buffer personal comprimido al ${Math.round(bufferRatioRemaining * 100)}%.`
      );
    } else if (bufferRatioRemaining < 0.20) {
      level = 'MODERADA';
    } else {
      level = 'BAJA';
    }

    // Apply deterministic sacrifice rules when level is ALTA or EXCESIVA
    if (level === 'ALTA' || level === 'EXCESIVA') {
      recommendations.push('Mantener el sueño de 7-8 horas como prioridad no negociable.');
      recommendations.push('Proteger la asistencia a cursadas obligatorias y consulta de Diseño.');

      // Sacrifice Rule 1: Rugby (Tuesday)
      // Rugby consumes ~3.5 hours including travel (departure 19:30, match 21:00)
      if (input.sportHours >= 3.5) {
        suggestedSacrifices.push(
          'Omitir Rugby el martes (libera ~3.5 horas de preparación y traslado, reduciendo el desgaste físico y protegiendo el descanso).'
        );
        recommendations.push(
          'Reasignar el martes noche a descanso o repaso liviano sin pantallas.'
        );
      }

      // Sacrifice Rule 2: Reduce Gym from 4 to 3 sessions
      if (input.gymHours > 6.5) {
        suggestedSacrifices.push(
          'Reducir el gimnasio de 4 a 3 sesiones esta semana (ahorra ~2.25 horas manteniendo el estímulo físico sin sobrecargar la recuperación).'
        );
      }

      // Sacrifice Rule 3: Flexible secondary activities (e.g. Market / Trading)
      if ((input.otherFlexibleHours || 0) > 0) {
        suggestedSacrifices.push(
          'Pausar sesiones accesorias de operación de mercado con amigos hasta superar los exámenes prioritarios.'
        );
      }

      recommendations.push(
        'NUNCA recortar horas de sueño ni omitir preparación de materias con examen a menos de 10 días.'
      );
    } else {
      recommendations.push(
        'El volumen semanal es equilibrado. Se recomienda mantener las 4 sesiones de gimnasio y los bloques de lectura.'
      );
      recommendations.push(
        'Preservar el sábado por la tarde para desconexión total, amigos, mates y descanso.'
      );
    }

    return {
      level,
      isOverloaded: level === 'ALTA' || level === 'EXCESIVA',
      totalAvailableHours: Math.round(availableAwakeHours * 10) / 10,
      totalCommittedHours: Math.round(totalCommittedHours * 10) / 10,
      studyHours: Math.round(input.requiredStudyHours * 10) / 10,
      classHours: Math.round(input.classHours * 10) / 10,
      gymHours: Math.round(input.gymHours * 10) / 10,
      sportHours: Math.round(input.sportHours * 10) / 10,
      sleepHours: Math.round(sleepHours * 10) / 10,
      bufferHours: Math.round(input.personalBufferHours * 10) / 10,
      personalHours: Math.round(Math.max(0, remainingFreeHours) * 10) / 10,
      bufferRatioRemaining: Math.round(bufferRatioRemaining * 100) / 100,
      warnings,
      recommendations,
      suggestedSacrifices,
    };
  }
}
