import { GoogleGenAI } from '@google/genai';
import { prisma } from '../db';
import { AcademicService } from './academicService';

export class AiService {
  public static async getDailyBriefing(referenceDate: Date = new Date(), userId?: string) {
    // 1. Gather subjects sorted by priorityScore
    const subjects = await AcademicService.getSubjectsWithDetails(referenceDate, userId);
    const sortedSubjects = [...subjects].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    const topSubjects = sortedSubjects.slice(0, 3);
    const primarySubject = topSubjects[0]?.name || 'Estudio Estratégico';

    // 2. Gather upcoming exams: nearest exam and second exam in queue
    const exams = await AcademicService.getExamsSortedByPriority(referenceDate, userId);
    const upcomingExams = exams.filter((e) => e.daysRemaining >= 0 && !e.isCompleted);
    const nearestExam = upcomingExams[0] || null;
    const secondExam = upcomingExams[1] || null;

    // 3. Gather habits not marked in the last 48 hours
    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const refDateObj = new Date(referenceDate);
    const yesterdayDateObj = new Date(referenceDate);
    yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);

    const todayStr = toDateStr(refDateObj);
    const yesterdayStr = toDateStr(yesterdayDateObj);

    const habitWhere: any = { isActive: true };
    if (userId) habitWhere.userId = userId;

    const habits = await prisma.habit.findMany({
      where: habitWhere,
      include: {
        logs: {
          where: {
            date: { in: [todayStr, yesterdayStr] },
            completed: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Unmarked if 0 completed logs in the last 48 hours (yesterday or today)
    const unmarkedHabits = habits.filter((h) => h.logs.length === 0);

    // 4. Gather today's schedule blocks
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(referenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const blockWhere: any = {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };
    if (userId) blockWhere.userId = userId;

    const todayBlocks = await prisma.scheduleBlock.findMany({
      where: blockWhere,
      orderBy: { startTime: 'asc' },
    });

    const formatTimeStr = (d: Date) => {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const agendaSummary = todayBlocks.length > 0
      ? todayBlocks
          .map(
            (b) =>
              `- [${formatTimeStr(b.startTime)} - ${formatTimeStr(b.endTime)}] ${b.title} (${b.category}, Flexibilidad: ${b.flexibility}, Energía: ${b.energyLevel})`
          )
          .join('\n')
      : '- Sin bloques de agenda registrados para hoy (jornada flexible).';

    // Fallback generator when Gemini API is not configured or fails
    const generateFallbackBriefing = (): string => {
      const sentence1 = nearestExam
        ? `Hoy concentra tu bloque principal de energía mental en preparar '${nearestExam.title}' (${nearestExam.subjectName}), que se rinde en ${nearestExam.daysRemaining} días, ejecutando con rigor tu agenda matutina.`
        : `Hoy focaliza tu mayor bloque de concentración en el avance de tu materia prioritaria (${primarySubject}) según tu planificación diaria.`;

      const sentence2 = secondExam
        ? `Dedica al menos 35 a 45 minutos de repaso preventivo a '${secondExam.title}' (${secondExam.subjectName}) en ${secondExam.daysRemaining} días para consolidar conceptos y no acumular fricción al final.`
        : `Dedica un bloque preventivo de estudio a tus siguientes entregas para amortiguar la curva de carga futura.`;

      const sentence3 = unmarkedHabits.length > 0
        ? `No descuides tu consistencia básica: reactiva hoy ${unmarkedHabits.slice(0, 2).map((h) => `'${h.title}'`).join(' y ')}, hábitos sin registrar en las últimas 48 horas clave para tu claridad cognitiva.`
        : `Mantén la disciplina en tus hábitos diarios y protege tu ventana de descanso nocturno para sostener el ritmo sin agotamiento.`;

      return `${sentence1} ${sentence2} ${sentence3}`;
    };

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return {
        briefing: generateFallbackBriefing(),
        topSubject: primarySubject,
        nearestExam: nearestExam ? `${nearestExam.title} (${nearestExam.daysRemaining}d)` : null,
        secondExam: secondExam ? `${secondExam.title} (${secondExam.daysRemaining}d)` : null,
        unmarkedHabits: unmarkedHabits.map((h) => h.title),
        aiGenerated: false,
        source: 'local_engine',
        notice: 'GEMINI_API_KEY no configurada. Mostrando briefing multi-contexto calculado por el motor LifeFlow.',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptContext = `
Eres el copiloto estratégico de alto rendimiento de LifeFlow para un estudiante universitario de ingeniería con entrenamiento físico regular.
Analiza la siguiente situación actual del usuario para generar su daily briefing matutino:

1. EXAMEN MÁS CERCANO (URGENTE):
${nearestExam ? `- ${nearestExam.title} (${nearestExam.subjectName}): se rinde en ${nearestExam.daysRemaining} días. Peso académico: ${nearestExam.weight}/5.` : '- No hay exámenes urgentes inmediatos.'}

2. SEGUNDO EXAMEN EN COLA (PREVENCIÓN / REPASO PREVENTIVO):
${secondExam ? `- ${secondExam.title} (${secondExam.subjectName}): se rinde en ${secondExam.daysRemaining} días. Peso académico: ${secondExam.weight}/5. Requiere avance y repaso preventivo continuo para evitar sobrecarga.` : '- No hay segundo examen en cola.'}

3. HÁBITOS NO MARCADOS EN LAS ÚLTIMAS 48 HORAS (DESCUIDADOS):
${unmarkedHabits.length > 0 ? unmarkedHabits.map((h) => `- ${h.title} [Categoría: ${h.category}, Racha previa: ${h.streak}d]`).join('\n') : '- Ninguno: todos los hábitos han tenido check-in en las últimas 48 horas.'}

4. AGENDA DEL DÍA DE HOY:
${agendaSummary}

DIRECTIVA DEL COPILOTO:
Genera una recomendación accionable, concisa (EXACTAMENTE MÁXIMO 3 ORACIONES) y con tono de copiloto estratégico que combine armónicamente:
- Oración 1: El foco directo en el examen urgente más cercano y el bloque clave de la agenda de hoy.
- Oración 2: La prevención y repaso progresivo del segundo examen en cola para no postergarlo hacia el límite.
- Oración 3: Un recordatorio firme y accionable para retomar los hábitos descuidados en las últimas 48 horas (${unmarkedHabits.length > 0 ? unmarkedHabits.map((h) => `'${h.title}'`).join(', ') : 'hábitos diarios'}).

REGLAS DE FORMATO:
- Longitud: EXACTAMENTE MÁXIMO 3 ORACIONES en total.
- Tono: Copiloto táctico, directo, profesional y enfocado en ejecución.
- Sin introducciones ("Hola", "Buen día", "Aquí tienes..."), sin viñetas, sin títulos. Solo el párrafo de máximo 3 oraciones.`;

      let textResult = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptContext,
        });
        textResult = response.text?.trim() || '';
      } catch (gemini25Error: any) {
        console.warn('Fallo con gemini-2.5-flash, intentando gemini-1.5-flash:', gemini25Error.message);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: promptContext,
        });
        textResult = fallbackResponse.text?.trim() || '';
      }

      if (!textResult) {
        throw new Error('Respuesta vacía de Gemini API');
      }

      return {
        briefing: textResult,
        topSubject: primarySubject,
        nearestExam: nearestExam ? `${nearestExam.title} (${nearestExam.daysRemaining}d)` : null,
        secondExam: secondExam ? `${secondExam.title} (${secondExam.daysRemaining}d)` : null,
        unmarkedHabits: unmarkedHabits.map((h) => h.title),
        aiGenerated: true,
        source: 'gemini_api',
      };
    } catch (error: any) {
      console.error('Error invocando Gemini API en daily briefing:', error);
      return {
        briefing: generateFallbackBriefing(),
        topSubject: primarySubject,
        nearestExam: nearestExam ? `${nearestExam.title} (${nearestExam.daysRemaining}d)` : null,
        secondExam: secondExam ? `${secondExam.title} (${secondExam.daysRemaining}d)` : null,
        unmarkedHabits: unmarkedHabits.map((h) => h.title),
        aiGenerated: false,
        source: 'fallback_error',
        error: error.message,
      };
    }
  }
}
