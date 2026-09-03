import { describe, it, expect } from 'vitest';
import { WeeklyGenerator } from '../src/engine/weeklyGenerator';
import { RecurringRuleInput } from '../src/engine/types';

describe('Planning Engine: WeeklyGenerator', () => {
  it('correctly generates a week preserving default fixed classes, consultation and Saturday football', () => {
    const monday = new Date('2026-08-31T00:00:00Z');
    const proposal = WeeklyGenerator.generateWeek(monday, [], []);

    expect(proposal.blocks.length).toBeGreaterThan(10);

    // Verify fixed Paradigmas
    const parad = proposal.blocks.find((b) => b.title.includes('Paradigmas de Programación'));
    expect(parad).toBeDefined();
    expect(parad?.isFixed).toBe(true);

    // Verify fixed Consulta de Diseño
    const consulta = proposal.blocks.find((b) => b.title.includes('Consulta: Diseño'));
    expect(consulta).toBeDefined();
    expect(consulta?.isFixed).toBe(true);

    // Verify fixed Saturday Football
    const futbol = proposal.blocks.find((b) => b.title.includes('Fútbol'));
    expect(futbol).toBeDefined();
    expect(futbol?.isFixed).toBe(true);

    // Verify Philosophy & Psychology reading blocks exist
    const reading = proposal.blocks.filter((b) => b.category === 'LECTURA');
    expect(reading.length).toBeGreaterThanOrEqual(2);

    // Verify Sustainability Score
    expect(proposal.sustainabilityScore).toBeGreaterThanOrEqual(50);
  });

  it('injects dynamic custom RecurringRules correctly and reflects them in the proposal', () => {
    const monday = new Date('2026-08-31T00:00:00Z');
    const customRules: RecurringRuleInput[] = [
      {
        dayOfWeek: 1, // Lunes
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        title: 'Cursada: Inteligencia Artificial',
        category: 'ACADEMIA',
        flexibility: 'FIJA',
        isFixed: true,
        energyLevel: 'ALTA',
        justification: 'Nueva materia electiva dinámica.',
        isActive: true,
      },
      {
        dayOfWeek: 3, // Miércoles
        startTime: '07:00',
        endTime: '08:30',
        durationMinutes: 90,
        title: 'Natación Matutina',
        category: 'DEPORTE',
        flexibility: 'FLEXIBLE',
        isFixed: false,
        energyLevel: 'ALTA',
        justification: 'Deporte aeróbico.',
        isActive: true,
      },
      {
        dayOfWeek: 5, // Viernes (Inactiva)
        startTime: '19:00',
        endTime: '20:00',
        durationMinutes: 60,
        title: 'Actividad Inactiva',
        category: 'PERSONAL',
        flexibility: 'OPCIONAL',
        isFixed: false,
        energyLevel: 'BAJA',
        isActive: false, // Desactivada
      },
    ];

    const proposal = WeeklyGenerator.generateWeek(monday, [], [], customRules);

    // Verify custom IA rule is present and fixed
    const iaBlock = proposal.blocks.find((b) => b.title === 'Cursada: Inteligencia Artificial');
    expect(iaBlock).toBeDefined();
    expect(iaBlock?.isFixed).toBe(true);
    expect(iaBlock?.durationMinutes).toBe(120);

    // Verify custom swimming rule is present
    const swimBlock = proposal.blocks.find((b) => b.title === 'Natación Matutina');
    expect(swimBlock).toBeDefined();
    expect(swimBlock?.category).toBe('DEPORTE');

    // Verify inactive rule is NOT present
    const inactiveBlock = proposal.blocks.find((b) => b.title === 'Actividad Inactiva');
    expect(inactiveBlock).toBeUndefined();
  });
});
