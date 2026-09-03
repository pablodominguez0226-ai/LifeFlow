import { describe, it, expect } from 'vitest';
import { IcalService } from '../src/services/icalService';

describe('IcalService: RFC 5545 iCalendar Exporter', () => {
  it('generates a valid RFC 5545 VCALENDAR feed with VEVENTs', async () => {
    const feed = await IcalService.generateIcsFeed();

    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('VERSION:2.0');
    expect(feed).toContain('PRODID:-//LifeFlow//LifeFlow Agenda Personal//ES');
    expect(feed).toContain('X-WR-CALNAME:LifeFlow Agenda Personal');
    expect(feed).toContain('BEGIN:VEVENT');
    expect(feed).toContain('END:VEVENT');
    expect(feed).toContain('END:VCALENDAR');

    // Check mapping format
    expect(feed).toMatch(/SUMMARY:\[(ACADEMIA|GIMNASIO|DEPORTE|LECTURA|PERSONAL|MERCADO|DESCANSO)\]/);
    expect(feed).toContain('Flexibilidad:');
    expect(feed).toContain('CATEGORIES:');
  });

  it('respects futureDays and pastDays query options', async () => {
    const feedShort = await IcalService.generateIcsFeed(undefined, {
      pastDays: 0,
      futureDays: 1,
    });

    expect(feedShort).toContain('BEGIN:VCALENDAR');
    expect(feedShort).toContain('END:VCALENDAR');
  });
});
