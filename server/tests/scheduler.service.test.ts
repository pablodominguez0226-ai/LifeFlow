import { describe, it, expect } from 'vitest';
import {
  calculateExamPriorities,
  findFreeWindows,
  allocateStudyToWindows,
} from '../src/services/scheduler.service';
import { Category, SlotStatus } from '@prisma/client';

describe('Scheduler Engine: SchedulerService', () => {
  const refDate = new Date('2026-11-04T07:00:00Z');

  describe('calculateExamPriorities', () => {
    it('applies critical acceleration for exams <= 7 days (factor 5 * (8 - d))', () => {
      const exams = [
        {
          subject: 'Matemática',
          date: new Date('2026-11-07T07:00:00Z'), // 3 days remaining -> factor 5 * (8 - 3) = 25
          weight: 1.0,
        },
        {
          subject: 'Física',
          date: new Date('2026-11-11T07:00:00Z'), // 7 days remaining -> factor 5 * (8 - 7) = 5
          weight: 1.0,
        },
      ];

      const weights = calculateExamPriorities(exams, refDate);
      // Raw: Mat = 25, Fis = 5. Total = 30.
      // Mat = 25 / 30 = 0.8333, Fis = 5 / 30 = 0.1667.
      expect(weights['Matemática']).toBeCloseTo(0.8333, 2);
      expect(weights['Física']).toBeCloseTo(0.1667, 2);
      expect(weights['Matemática'] + weights['Física']).toBeCloseTo(1.0, 2);
    });

    it('applies hyperbolic weight for exams <= 35 days (35 / d) and ignores > 45 days', () => {
      const exams = [
        {
          subject: 'Paradigmas',
          date: new Date('2026-11-18T07:00:00Z'), // 14 days -> 35 / 14 = 2.5
          weight: 1.0,
        },
        {
          subject: 'Sistemas',
          date: new Date('2026-12-09T07:00:00Z'), // 35 days -> 35 / 35 = 1.0
          weight: 1.0,
        },
        {
          subject: 'Filosofía',
          date: new Date('2027-01-10T07:00:00Z'), // > 45 days -> ignored
          weight: 1.0,
        },
      ];

      const weights = calculateExamPriorities(exams, refDate);
      expect(weights['Filosofía']).toBeUndefined();
      // Raw: Paradigmas = 2.5, Sistemas = 1.0. Total = 3.5.
      // Paradigmas = 2.5 / 3.5 = 0.7143, Sistemas = 1.0 / 3.5 = 0.2857.
      expect(weights['Paradigmas']).toBeCloseTo(0.7143, 2);
      expect(weights['Sistemas']).toBeCloseTo(0.2857, 2);
      expect(weights['Paradigmas'] + weights['Sistemas']).toBeCloseTo(1.0, 2);
    });
  });

  describe('findFreeWindows', () => {
    it('sorts routines and extracts free windows >= 45 minutes between 07:00 and 23:00', () => {
      const dayDate = new Date('2026-11-04T00:00:00Z'); // Wednesday -> dayOfWeek = 3
      const routines = [
        {
          title: 'Despertar y desayuno',
          dayOfWeek: 3,
          startTime: '07:00',
          endTime: '08:00',
          category: Category.REST,
        },
        {
          title: 'Trading y Apertura NYSE',
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '11:30',
          category: Category.TRADING,
        },
        {
          title: 'Cursado Facultad',
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '17:30',
          category: Category.ACADEMIC_CLASS,
        },
        {
          title: 'Gimnasio',
          dayOfWeek: 3,
          startTime: '19:00',
          endTime: '20:30',
          category: Category.GYM,
        },
      ];

      const windows = findFreeWindows(dayDate, routines, 7, 23);
      // Expected free gaps:
      // 1) 08:00 - 10:00 (120 min) -> >= 45
      // 2) 11:30 - 14:00 (150 min) -> >= 45
      // 3) 17:30 - 19:00 (90 min) -> >= 45
      // 4) 20:30 - 23:00 (150 min) -> >= 45
      expect(windows.length).toBe(4);
      expect(windows[0].durationMinutes).toBe(120);
      expect(windows[1].durationMinutes).toBe(150);
      expect(windows[2].durationMinutes).toBe(90);
      expect(windows[3].durationMinutes).toBe(150);
    });

    it('filters out gaps shorter than 45 minutes', () => {
      const dayDate = new Date('2026-11-04T00:00:00Z');
      const routines = [
        {
          title: 'R1',
          dayOfWeek: 3,
          startTime: '07:00',
          endTime: '08:00',
        },
        {
          title: 'R2',
          dayOfWeek: 3,
          startTime: '08:30', // only 30 min gap (08:00 to 08:30)
          endTime: '23:00',
        },
      ];

      const windows = findFreeWindows(dayDate, routines, 7, 23);
      expect(windows.length).toBe(0);
    });
  });

  describe('allocateStudyToWindows', () => {
    it('allocates deep study blocks between 45 and 90 min interleaving subjects by weight', () => {
      const dayDate = new Date('2026-11-04T00:00:00Z');
      const windows = [
        {
          start: new Date('2026-11-04T08:00:00Z'),
          end: new Date('2026-11-04T10:00:00Z'),
          durationMinutes: 120, // 2 blocks of 60 min
        },
        {
          start: new Date('2026-11-04T11:30:00Z'),
          end: new Date('2026-11-04T13:00:00Z'),
          durationMinutes: 90, // 1 block of 90 min
        },
      ];

      const weights = {
        'Matemática': 0.65,
        'Física': 0.35,
      };

      const slots = allocateStudyToWindows(windows, weights);

      expect(slots.length).toBe(3); // 2 from window 1, 1 from window 2
      for (const slot of slots) {
        expect(slot.category).toBe(Category.STUDY_DEEP);
        expect(slot.status).toBe(SlotStatus.PENDING);
        expect(slot.isAutoSlot).toBe(true);
        expect(slot.durationMinutes).toBeGreaterThanOrEqual(45);
        expect(slot.durationMinutes).toBeLessThanOrEqual(90);
      }

      // Check interleaving: Matemática (higher weight) and Física
      expect(slots[0].subject).toBe('Matemática');
      expect(slots[1].subject).toBe('Física');
      expect(slots[2].subject).toBe('Matemática');
    });
  });
});
