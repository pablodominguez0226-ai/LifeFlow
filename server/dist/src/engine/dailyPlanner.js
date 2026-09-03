"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyPlanner = void 0;
const date_fns_1 = require("date-fns");
const capacityAnalyzer_1 = require("./capacityAnalyzer");
class DailyPlanner {
    /**
     * Partitions the day's scheduled blocks into Mañana, Tarde, and Noche,
     * calculating priorities, energy matches, and justifications.
     * Consumes UserEnergyContext to adapt the schedule dynamically if fatigued.
     */
    static planDay(targetDate, allBlocks, energyContext, constraints = capacityAnalyzer_1.CapacityAnalyzer.DEFAULT_CONSTRAINTS) {
        const fatigueAdj = capacityAnalyzer_1.CapacityAnalyzer.calculateFatigaAdjustment(energyContext, constraints);
        // Filter blocks for target date
        let dayBlocks = allBlocks
            .filter((b) => (0, date_fns_1.isSameDay)(b.startTime, targetDate))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        // If fatigued, adapt the blocks (trim duration and downgrade cognitive intensity)
        if (fatigueAdj.isFatigued) {
            dayBlocks = dayBlocks.map((block) => {
                // Only adapt flexible or academic blocks (never fixed university classes)
                if (!block.isFixed && block.category === 'ACADEMIA') {
                    let adjustedDuration = block.durationMinutes;
                    let adjustedTitle = block.title;
                    let adjustedEnergy = block.energyLevel;
                    let adjustedJustification = block.justification || '';
                    // 1. Cap focus duration
                    if (adjustedDuration > fatigueAdj.adjustedMaxFocusMinutes) {
                        adjustedDuration = fatigueAdj.adjustedMaxFocusMinutes;
                        adjustedJustification += ` [Adaptado por fatiga: duración acotada a ${fatigueAdj.adjustedMaxFocusMinutes}m]`;
                    }
                    // 2. Downgrade deep study to review/exercises
                    if (fatigueAdj.downgradeDeepStudy) {
                        if (adjustedTitle.includes('Estudio Profundo')) {
                            adjustedTitle = adjustedTitle.replace('Estudio Profundo', 'Repaso / Ejercicios Adaptativos');
                        }
                        adjustedEnergy = 'MEDIA';
                        adjustedJustification += ' [Carga cognitiva reducida a repaso por fatiga]';
                    }
                    const adjustedEndTime = new Date(block.startTime.getTime() + adjustedDuration * 60000);
                    return {
                        ...block,
                        title: adjustedTitle,
                        durationMinutes: adjustedDuration,
                        endTime: adjustedEndTime,
                        energyLevel: adjustedEnergy,
                        justification: adjustedJustification.trim(),
                    };
                }
                return block;
            });
        }
        const morning = []; // 07:00 to 13:00
        const afternoon = []; // 13:00 to 19:00
        const evening = []; // 19:00 to 23:30
        let totalDayMinutes = 0;
        for (const block of dayBlocks) {
            const startHour = (0, date_fns_1.getHours)(block.startTime);
            totalDayMinutes += block.durationMinutes;
            if (startHour < 13) {
                morning.push(block);
            }
            else if (startHour < 19) {
                afternoon.push(block);
            }
            else {
                evening.push(block);
            }
        }
        // Determine day's overload level
        const totalDayHours = totalDayMinutes / 60;
        let overloadLevel = 'BAJA';
        if (totalDayHours > 12) {
            overloadLevel = 'EXCESIVA';
        }
        else if (totalDayHours > 9.5) {
            overloadLevel = 'ALTA';
        }
        else if (totalDayHours > 7) {
            overloadLevel = 'MODERADA';
        }
        const dateStr = (0, date_fns_1.format)(targetDate, 'dd/MM/yyyy');
        let summary = `Planificación para ${dateStr}: ${totalDayHours.toFixed(1)} horas programadas. Carga del día: ${overloadLevel}.`;
        if (fatigueAdj.isFatigued) {
            summary += ` ⚠️ ${fatigueAdj.recommendedAction}`;
        }
        return {
            date: targetDate,
            morning,
            afternoon,
            evening,
            overloadLevel: fatigueAdj.isFatigued && overloadLevel === 'BAJA' ? 'MODERADA' : overloadLevel,
            summary,
            sleepTargetProtected: true,
            fatigueAdjustment: fatigueAdj,
        };
    }
}
exports.DailyPlanner = DailyPlanner;
