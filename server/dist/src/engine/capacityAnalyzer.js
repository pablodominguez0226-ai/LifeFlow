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
    constraints = this.DEFAULT_CONSTRAINTS) {
        // 1. Sleep window check (00:00 - 06:30)
        if (this.isWithinSleepWindow(startTime, constraints)) {
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
        // 5. Wind down check (after 22:30)
        if (this.isWindDownPeriod(startTime, constraints)) {
            if (taskType === 'ESTUDIO_PROFUNDO' || taskType === 'SIMULACRO' || taskType === 'EJERCICIOS') {
                return {
                    allowed: false,
                    reason: 'Después de las 22:30 no se permite estudio de alta exigencia cognitiva. Se recomienda lectura ligera, relajación o descanso.',
                };
            }
        }
        // 6. Maximum focus duration rule (max 120 minutes)
        if (taskType === 'ESTUDIO_PROFUNDO' && durationMinutes > constraints.maxFocusBlockMinutes) {
            return {
                allowed: false,
                reason: `La capacidad máxima de concentración profunda es de ${constraints.maxFocusBlockMinutes} minutos. El bloque debe dividirse con descansos de 5-10 minutos.`,
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
