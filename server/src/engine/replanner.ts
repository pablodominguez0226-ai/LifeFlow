import { addHours, addDays, setHours, setMinutes, isBefore } from 'date-fns';
import { TimeSlot, TaskInput, UserConstraints, UserEnergyContext } from './types';
import { CapacityAnalyzer } from './capacityAnalyzer';

export interface ReplanningOption {
  action: 'MOVER' | 'DIVIDIR' | 'REDUCIR' | 'DESCARTAR' | 'MANTENER_PENDIENTE';
  title: string;
  description: string;
  suggestedSlot?: {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  };
  splitSlots?: {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  }[];
  impactAssessment: string;
}

export class Replanner {
  /**
   * Evaluates an uncompleted task and returns actionable options without creating a domino effect.
   * Considers user fatigue feedback if provided.
   */
  public static evaluateMissedTask(
    task: TaskInput,
    currentDate: Date,
    existingBlocks: TimeSlot[],
    constraints: UserConstraints = CapacityAnalyzer.DEFAULT_CONSTRAINTS,
    energyContext?: UserEnergyContext
  ): {
    recommendedAction: 'MOVER' | 'DIVIDIR' | 'REDUCIR' | 'DESCARTAR';
    justification: string;
    options: ReplanningOption[];
  } {
    const isCritical = task.taskType === 'SIMULACRO' || (task.examDate && (task.examDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24) <= 7);
    const fatigue = CapacityAnalyzer.calculateFatigaAdjustment(energyContext, constraints);

    const options: ReplanningOption[] = [];

    // Search for a candidate open slot over the next 3 days
    const candidateSlot = this.findNextAvailableSlot(
      currentDate,
      task.remainingMinutes,
      existingBlocks,
      constraints
    );

    if (candidateSlot) {
      options.push({
        action: 'MOVER',
        title: 'Reubicar en el próximo hueco disponible',
        description: `Mover el bloque completo de ${task.remainingMinutes} min sin alterar otras actividades.`,
        suggestedSlot: candidateSlot,
        impactAssessment: 'Bajo impacto: el hueco seleccionado respeta el sueño y el buffer.',
      });
    }

    // Option 2: Dividir (Split)
    const halfDuration = Math.round(task.remainingMinutes / 2);
    options.push({
      action: 'DIVIDIR',
      title: `Dividir en 2 bloques de ${halfDuration} minutos`,
      description: 'Facilita la absorción cognitiva y permite calzar la tarea en huecos más pequeños.',
      impactAssessment: 'Previene fatiga y evita sobrecargar un único día.',
    });

    // Option 3: Reducir (Scale down)
    const reducedDuration = Math.round(task.remainingMinutes * 0.6);
    options.push({
      action: 'REDUCIR',
      title: `Reducir alcance a ${reducedDuration} minutos (Solo conceptos clave)`,
      description: 'Reenfocar la tarea en lo esencial en lugar de una sesión exhaustiva.',
      impactAssessment: 'Garantiza avance sin acumular deuda horaria.',
    });

    // Option 4: Descartar / Posponer
    if (!isCritical) {
      options.push({
        action: 'DESCARTAR',
        title: 'Omitir de la semana',
        description: 'La tarea no es crítica ni tiene examen inminente. Omitir para evitar sobrecarga.',
        impactAssessment: 'Libera tiempo inmediatamente para prioridades más altas.',
      });
    }

    // Recommendation logic
    let recommendedAction: 'MOVER' | 'DIVIDIR' | 'REDUCIR' | 'DESCARTAR' = 'MOVER';
    let justification = '';

    if (fatigue.isFatigued && task.remainingMinutes > 60) {
      recommendedAction = isCritical ? 'DIVIDIR' : 'REDUCIR';
      justification = `Alerta de fatiga activa (${fatigue.warnings.join(', ')}). ${
        isCritical
          ? 'Al ser crítica, se recomienda dividirla en 2 sesiones cortas para no saturar.'
          : 'Se recomienda reducir la duración al 60% para avanzar sin acumular agotamiento cognitivo.'
      }`;
    } else if (isCritical) {
      recommendedAction = candidateSlot ? 'MOVER' : 'DIVIDIR';
      justification = `Tarea crítica asociada a examen próximo (${task.subjectName}). Es prioritario reubicarla o dividirla sin comprometer el sueño.`;
    } else if (task.remainingMinutes > 90) {
      recommendedAction = 'DIVIDIR';
      justification = `La sesión es extensa (${task.remainingMinutes} min). Conviene dividirla para mantener alta la concentración sin fatiga.`;
    } else {
      recommendedAction = candidateSlot ? 'MOVER' : 'REDUCIR';
      justification = candidateSlot
        ? 'Existe un hueco compatible en los próximos días sin violar el descanso.'
        : 'Calendario ajustado: conviene reducir el alcance a lo esencial para no generar deuda acumulada.';
    }

    return {
      recommendedAction,
      justification,
      options,
    };
  }

  /**
   * Helper to locate an open slot respecting sleep boundaries and existing blocks.
   */
  private static findNextAvailableSlot(
    fromDate: Date,
    durationMinutes: number,
    existingBlocks: TimeSlot[],
    constraints: UserConstraints
  ): { startTime: Date; endTime: Date; durationMinutes: number } | undefined {
    // Check tomorrow and day after tomorrow between 09:00 and 21:00
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const day = addDays(fromDate, dayOffset);
      const dayStart = setMinutes(setHours(day, 9), 0);
      const dayEnd = setMinutes(setHours(day, 21), 0);

      // Simple scan in 30-minute steps
      let cursor = new Date(dayStart);
      while (isBefore(addHours(cursor, durationMinutes / 60), dayEnd)) {
        const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);

        // Check collision with existing blocks
        const hasOverlap = existingBlocks.some((b) => {
          return (
            (cursor >= b.startTime && cursor < b.endTime) ||
            (slotEnd > b.startTime && slotEnd <= b.endTime) ||
            (cursor <= b.startTime && slotEnd >= b.endTime)
          );
        });

        if (!hasOverlap) {
          return {
            startTime: cursor,
            endTime: slotEnd,
            durationMinutes,
          };
        }

        cursor = new Date(cursor.getTime() + 30 * 60000); // step 30 mins
      }
    }

    return undefined;
  }
}
