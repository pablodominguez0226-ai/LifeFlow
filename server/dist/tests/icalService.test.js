"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const icalService_1 = require("../src/services/icalService");
(0, vitest_1.describe)('IcalService: RFC 5545 iCalendar Exporter', () => {
    (0, vitest_1.it)('generates a valid RFC 5545 VCALENDAR feed with VEVENTs', async () => {
        const feed = await icalService_1.IcalService.generateIcsFeed();
        (0, vitest_1.expect)(feed).toContain('BEGIN:VCALENDAR');
        (0, vitest_1.expect)(feed).toContain('VERSION:2.0');
        (0, vitest_1.expect)(feed).toContain('PRODID:-//LifeFlow//LifeFlow Agenda Personal//ES');
        (0, vitest_1.expect)(feed).toContain('X-WR-CALNAME:LifeFlow Agenda Personal');
        (0, vitest_1.expect)(feed).toContain('BEGIN:VEVENT');
        (0, vitest_1.expect)(feed).toContain('END:VEVENT');
        (0, vitest_1.expect)(feed).toContain('END:VCALENDAR');
        // Check mapping format
        (0, vitest_1.expect)(feed).toMatch(/SUMMARY:\[(ACADEMIA|GIMNASIO|DEPORTE|LECTURA|PERSONAL|MERCADO|DESCANSO)\]/);
        (0, vitest_1.expect)(feed).toContain('Flexibilidad:');
        (0, vitest_1.expect)(feed).toContain('CATEGORIES:');
    });
    (0, vitest_1.it)('respects futureDays and pastDays query options', async () => {
        const feedShort = await icalService_1.IcalService.generateIcsFeed(undefined, {
            pastDays: 0,
            futureDays: 1,
        });
        (0, vitest_1.expect)(feedShort).toContain('BEGIN:VCALENDAR');
        (0, vitest_1.expect)(feedShort).toContain('END:VCALENDAR');
    });
});
