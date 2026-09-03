"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityAnalyzer = void 0;
const date_fns_1 = require("date-fns");
class CapacityAnalyzer {
    static DEFAULT_CONSTRAINTS = {
        targetWakeTime: '06:30',
        maxBedTime: '00:00',
        targetSleepHours: 7.5,
        maxFocusBlockMinutes: 120,
        chunkWorkMinutes: 50,
        chunkBreakMinutes: 10,
        personalBufferRatio: 0.15, // 15% buffer
        travelFacultadMinutes: 10,
        travelGymMinutes: 10,
        rugbyPrepTravelMinutes: 90, // departure at 19:30 for 21:00
        windDownStartTime: '22:30',
    };
    /**
     * Calculates fatigue adjustments based on DailyCheckIn metrics.
     * If energyLevel <= 2, sleepHours < 6.5, or stressLevel >= 4:
     * - Reduces max continuous focus block from 120m to 60m.
     * - Advances nocturnal wind-down from 22:30 to 22:00.
     * - Directs task downgrade from ESTUDIO_PROFUNDO to REPASO/EJERCICIOS or 60% duration.
     */
    static calculateFatigaAdjustment(context, constraints = this.DEFAULT_CONSTRAINTS) {
        if (!context) {
            return {
                isFatigued: false,
                fatigueScore: 0,
                adjustedMaxFocusMinutes: constraints.maxFocusBlockMinutes,
                adjustedWindDownStartTime: constraints.windDownStartTime,
                downgradeDeepStudy: false,
                durationScale: 1.0,
                recommendedAction: 'Estado nominal: Mantener bloques habituales de foco y descanso.',
                warnings: [],
            };
        }
        const warnings = [];
        let isFatigued = false;
        if (context.energyLevel <= 2) {
            warnings.push(`Nivel de energía bajo (${context.energyLevel}/5).`);
            isFatigued = true;
        }
        if (context.sleepHours < 6.5) {
            warnings.push(`Déficit de sueño detectado (${context.sleepHours}h frente a la meta de ${constraints.targetSleepHours}h).`);
            isFatigued = true;
        }
        if (context.stressLevel >= 4) {
            warnings.push(`Nivel elevado de estrés acumulado (${context.stressLevel}/5).`);
            isFatigued = true;
        }
        if (isFatigued) {
            const fatigueScore = Math.min(100, Math.round((5 - context.energyLevel) * 25 +
                Math.max(0, 7.5 - context.sleepHours) * 20 +
                context.stressLevel * 15));
            return {
                isFatigued: true,
                fatigueScore,
                adjustedMaxFocusMinutes: 60, // Limitado a máx 60 min (en vez de 120)
                adjustedWindDownStartTime: '22:00', // Adelanto de descompresión a las 22:00
                downgradeDeepStudy: true,
                recommendedTaskType: 'REPASO',
                durationScale: 0.6, // Reducción de alcance al 60%
                recommendedAction: 'Protocolo de Fatiga Activo: Se reducen los bloques continuos a máx. 60 min, se sustituye el estudio profundo por repaso o ejercicios ligeros, y el descanso nocturno se adelanta a las 22:00.',
                warnings,
            };
        }
        return {
            isFatigued: false,
            fatigueScore: 10,
            adjustedMaxFocusMinutes: constraints.maxFocusBlockMinutes,
            adjustedWindDownStartTime: constraints.windDownStartTime,
            downgradeDeepStudy: false,
            durationScale: 1.0,
            recommendedAction: 'Energía y descanso adecuados: Mantener bloques estándar de hasta 120 min.',
            warnings: [],
        };
    }
    // Alias for English convention
    static calculateFatigueAdjustment(context, constraints = this.DEFAULT_CONSTRAINTS) {
        return this.calculateFatigaAdjustment(context, constraints);
    }
    /**
     * Checks whether a proposed time slot violates sleep or bedtime rules.
     * Max bedtime is 00:00; wake time is 06:30.
     */
    static isWithinSleepWindow(date, constraints = this.DEFAULT_CONSTRAINTS) {
        const hours = (0, date_fns_1.getHours)(date);
        const minutes = (0, date_fns_1.getMinutes)(date);
        const timeInMinutes = hours * 60 + minutes;
        const [wakeH, wakeM] = constraints.targetWakeTime.split(':').map(Number);
        const wakeMinutes = wakeH * 60 + wakeM; // e.g. 6*60 + 30 = 390 (06:30)
        // Between 00:00 (0 min) and 06:30 (390 min) is strictly sleep
        if (timeInMinutes < wakeMinutes) {
            return true;
        }
        return false;
    }
    /**
     * Checks whether the proposed block is in the wind-down period (after 22:30).
     * In this window, high-cognitive or deep study tasks are prohibited.
     */
    static isWindDownPeriod(date, constraints = this.DEFAULT_CONSTRAINTS) {
        const hours = (0, date_fns_1.getHours)(date);
        const minutes = (0, date_fns_1.getMinutes)(date);
        const timeInMinutes = hours * 60 + minutes;
        const [windH, windM] = constraints.windDownStartTime.split(':').map(Number);
        const windDownMinutes = windH * 60 + windM; // 22:30 = 1350 min
        return timeInMinutes >= windDownMinutes;
    }
    /**
     * Validates if a task can be safely scheduled at the proposed time.
     */
    static canScheduleTaskAt(startTime, durationMinutes, taskType, energyLevel, dayOfWeek, // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    constraints = this.DEFAULT_CONSTRAINTS, energyContext) {
        const fatigue = this.calculateFatigaAdjustment(energyContext, constraints);
        const effectiveConstraints = fatigue.isFatigued
            ? {
                ...constraints,
                maxFocusBlockMinutes: fatigue.adjustedMaxFocusMinutes,
                windDownStartTime: fatigue.adjustedWindDownStartTime,
            }
            : constraints;
        // 1. Sleep window check (00:00 - 06:30)
        if (this.isWithinSleepWindow(startTime, effectiveConstraints)) {
            return {
                allowed: false,
                reason: 'Viola la ventana sagrada de sueño (00:00 a 06:30).',
            };
        }
        // 2. Thursday night rule (Administración de Sistemas 19:00 - 23:00)
        // Day 4 = Thursday. Class ends at 23:00. Prohibit deep study after 23:00.
        if (dayOfWeek === 4 && ((0, date_fns_1.getHours)(startTime) >= 23 || ((0, date_fns_1.getHours)(startTime) === 22 && (0, date_fns_1.getMinutes)(startTime) >= 30))) {
            return {
                allowed: false,
                reason: 'El jueves finaliza Administración de Sistemas a las 23:00. No se programa estudio profundo; priorizar regreso, cena, descanso y sueño antes de las 00:00.',
            };
        }
        // 3. Tuesday post-rugby rule (Rugby 21:00 - 22:30 / departure 19:30)
        if (dayOfWeek === 2 && (0, date_fns_1.getHours)(startTime) >= 22) {
            if (taskType === 'ESTUDIO_PROFUNDO' || taskType === 'SIMULACRO' || energyLevel === 'ALTA') {
                return {
                    allowed: false,
                    reason: 'El martes tiene Rugby por la noche. Priorizar recuperación física, higiene y sueño.',
                };
            }
        }
        // 4. Check if block ends past midnight
        const endHours = (0, date_fns_1.getHours)(new Date(startTime.getTime() + durationMinutes * 60000));
        const startHours = (0, date_fns_1.getHours)(startTime);
        if (startHours > 20 && endHours < 6) {
            return {
                allowed: false,
                reason: 'El bloque termina después de medianoche, comprometiendo las 7-8 horas de descanso sagrado.',
            };
        }
        // 5. Wind down check (after 22:30 or 22:00 if fatigued)
        if (this.isWindDownPeriod(startTime, effectiveConstraints)) {
            if (taskType === 'ESTUDIO_PROFUNDO' || taskType === 'SIMULACRO' || taskType === 'EJERCICIOS') {
                const timeLimit = effectiveConstraints.windDownStartTime;
                return {
                    allowed: false,
                    reason: `Después de las ${timeLimit} no se permite estudio de alta exigencia cognitiva. Se recomienda lectura ligera, relajación o descanso.`,
                };
            }
        }
        // 6. Maximum focus duration rule (max 120 minutes or 60 minutes if fatigued)
        if (taskType === 'ESTUDIO_PROFUNDO' && durationMinutes > effectiveConstraints.maxFocusBlockMinutes) {
            return {
                allowed: false,
                reason: `La capacidad máxima de concentración profunda es de ${effectiveConstraints.maxFocusBlockMinutes} minutos${fatigue.isFatigued ? ' (reducida por protocolo de fatiga)' : ''}. El bloque debe dividirse con descansos de 5-10 minutos.`,
            };
        }
        return { allowed: true };
    }
    /**
     * Splits a long study requirement into chunked sessions (50-60 min work + 5-10 min break).
     */
    static chunkStudyDuration(totalMinutes, constraints = this.DEFAULT_CONSTRAINTS) {
        const chunks = [];
        let remaining = totalMinutes;
        while (remaining > 0) {
            const work = Math.min(remaining, constraints.chunkWorkMinutes);
            remaining -= work;
            const pause = remaining > 0 ? constraints.chunkBreakMinutes : 0;
            chunks.push({ workMinutes: work, breakMinutes: pause });
        }
        return chunks;
    }
}
exports.CapacityAnalyzer = CapacityAnalyzer;
