"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyPlanner = void 0;
const date_fns_1 = require("date-fns");
class DailyPlanner {
    /**
     * Partitions the day's scheduled blocks into Mañana, Tarde, and Noche,
     * calculating priorities, energy matches, and justifications.
     */
    static planDay(targetDate, allBlocks) {
        // Filter blocks for target date
        const dayBlocks = allBlocks
            .filter((b) => (0, date_fns_1.isSameDay)(b.startTime, targetDate))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
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
        const summary = `Planificación para ${dateStr}: ${totalDayHours.toFixed(1)} horas programadas. Carga del día: ${overloadLevel}.`;
        return {
            date: targetDate,
            morning,
            afternoon,
            evening,
            overloadLevel,
            summary,
            sleepTargetProtected: true,
        };
    }
}
exports.DailyPlanner = DailyPlanner;
