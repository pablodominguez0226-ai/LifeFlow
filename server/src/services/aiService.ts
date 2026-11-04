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

  public static async processFreeformJournal(
    text: string,
    userId?: string,
    referenceDate: Date = new Date()
  ) {
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error('No user found');
      targetUserId = user.id;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('El texto de la bitácora no puede estar vacío');
    }

    // Heuristic / rule-based fallback extractor
    const runFallbackExtractor = () => {
      // 1. Study hours
      let studyHours = 0;
      const studyMatch = cleanText.match(/(?:estudi[éeó]|dediqu[ée]|met[ií]|estudiando|estudio)\s*(?:unas?|aprox\.?|de)?\s*(\d+(?:[.,]\d+)?)\s*(?:h|hs|horas)/i) ||
        cleanText.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hs|horas)\s*(?:de\s+estudio|estudiando|a\s+[A-Za-z])/i);
      if (studyMatch) {
        studyHours = parseFloat(studyMatch[1].replace(',', '.'));
      }

      // 2. Sleep hours
      let sleepHours = 7.5;
      const sleepMatch = cleanText.match(/(?:dorm[ií]|descans[eé]|sueño)\s*(?:unas?|aprox\.?|de)?\s*(\d+(?:[.,]\d+)?)\s*(?:h|hs|horas)/i);
      if (sleepMatch) {
        sleepHours = parseFloat(sleepMatch[1].replace(',', '.'));
      }

      // 3. Energy & Stress
      let energyLevel = 4;
      let stressLevel = 2;
      const lower = cleanText.toLowerCase();
      if (lower.includes('cansad') || lower.includes('agotad') || lower.includes('sin energ') || lower.includes('baja energ')) {
        energyLevel = 2;
      } else if (lower.includes('muy productiv') || lower.includes('foco alto') || lower.includes('excelente') || lower.includes('con todo')) {
        energyLevel = 5;
      }
      if (lower.includes('estres') || lower.includes('sobrecarg') || lower.includes('ansied') || lower.includes('abrumad')) {
        stressLevel = 4;
      }

      // 4. Workout
      let workoutDone = false;
      let workoutType = 'No entrené';
      if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('pesas') || lower.includes('musculaci')) {
        workoutDone = true;
        workoutType = 'Gimnasio';
      } else if (lower.includes('rugby') || lower.includes('fútbol') || lower.includes('futbol')) {
        workoutDone = true;
        workoutType = 'Rugby/Fútbol';
      } else if (lower.includes('camin') || lower.includes('movilidad') || lower.includes('descanso activo')) {
        workoutDone = true;
        workoutType = 'Descanso activo';
      }

      // 5. Trading
      let tradingResult: string | null = null;
      let tradingPipsRR: string | null = null;
      let tradingNotes: string | null = null;
      if (lower.includes('trading') || lower.includes('operé') || lower.includes('opere') || lower.includes('pips') || lower.includes('setup')) {
        if (lower.includes('win') || lower.includes('positiv') || lower.includes('+') || lower.includes('ganancia')) {
          tradingResult = 'Positiva / Win';
        } else if (lower.includes('loss') || lower.includes('negativ') || lower.includes('perdí') || lower.includes('stop loss') || lower.includes('sl')) {
          tradingResult = 'Negativa / Loss';
        } else {
          tradingResult = 'Breakeven / No operé';
        }

        const pipsMatch = cleanText.match(/([+-]?\d+\s*pips?(?:\s*\/\s*1:\d+(?:\.\d+)?)?)/i);
        if (pipsMatch) {
          tradingPipsRR = pipsMatch[1];
        }
        tradingNotes = 'Operativa registrada en la bitácora libre.';
      }

      // 6. Tomorrow tasks heuristic
      const rawTasks: string[] = [];
      const tomorrowSection = cleanText.match(/(?:mañana|para mañana|plan mañana|siguiente día|pendientes?:?)([\s\S]*)/i);
      const textToSearch = tomorrowSection ? tomorrowSection[1] : cleanText;

      const lines = textToSearch.split(/[\n,;•·-]/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length > 5 && line.length < 80) {
          if (
            /(?:estudiar|repasar|hacer|leer|ir|entrenar|comprar|practicar|terminar|avanzar|sesión|tp|unidad)/i.test(line)
          ) {
            rawTasks.push(line.replace(/^(mañana|para mañana|tengo que|necesito|debo)\s+/i, '').trim());
          }
        }
      }

      if (rawTasks.length === 0) {
        rawTasks.push('Repaso de temas pendientes');
        rawTasks.push('Continuar avance de unidades prioritarias');
      }

      return {
        studyHours,
        sleepHours,
        energyLevel,
        stressLevel,
        workoutDone,
        workoutType,
        tradingResult,
        tradingPipsRR,
        tradingNotes,
        summaryText: cleanText.slice(0, 160) + (cleanText.length > 160 ? '...' : ''),
        tomorrowTasks: rawTasks.slice(0, 4),
        aiGenerated: false,
      };
    };

    let extracted: any = null;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
Eres el copiloto inteligente de alto rendimiento de LifeFlow para un estudiante universitario de ingeniería con entrenamiento físico y trading.
Analiza la siguiente bitácora de texto libre del usuario al cerrar su día:

"""
${cleanText}
"""

Extrae rigurosamente la carga del día y el plan para mañana en formato JSON puro (sin explicaciones adicionales, sin markdown adicional excepto bloque json):
{
  "studyHours": number, // Horas totales de estudio realizadas hoy estimadas a partir del texto (ej: 3.5, 4, 0 si no se mencionó)
  "sleepHours": number, // Horas dormidas anoche si se mencionó (default 7.5)
  "energyLevel": number, // Nivel de energía/foco de 1 a 5 detectado (1: agotado, 3: moderado, 5: peak cognitivo)
  "stressLevel": number, // Nivel de estrés de 1 a 5 detectado (1: calma, 3: moderado, 5: sobrecarga)
  "workoutDone": boolean, // true si entrenó gimnasio, fútbol, rugby o movilidad
  "workoutType": string, // "Gimnasio", "Rugby/Fútbol", "Descanso activo", o "No entrené"
  "tradingResult": string | null, // "Positiva / Win", "Negativa / Loss", "Breakeven / No operé", o null si no se mencionó trading
  "tradingPipsRR": string | null, // Pips o ratio R:R si se mencionó (ej: "+25 pips / 1:2 R:R") o null
  "tradingNotes": string | null, // Lección aprendida o nota de trading si se mencionó, o null
  "summaryText": string, // Síntesis ejecutiva del día de 1 a 2 oraciones concisas
  "tomorrowTasks": string[] // Lista de MÁXIMO 4 tareas prioritarias, claras y accionables para el día siguiente mencionadas o inferidas del texto
}
`;

        let rawResponse = '';
        try {
          const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          rawResponse = res.text?.trim() || '';
        } catch (e: any) {
          console.warn('Fallback a gemini-1.5-flash para bitácora:', e.message);
          const resFallback = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
          });
          rawResponse = resFallback.text?.trim() || '';
        }

        if (rawResponse) {
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            extracted = {
              studyHours: Number(parsed.studyHours) || 0,
              sleepHours: Number(parsed.sleepHours) || 7.5,
              energyLevel: Math.min(5, Math.max(1, Number(parsed.energyLevel) || 4)),
              stressLevel: Math.min(5, Math.max(1, Number(parsed.stressLevel) || 2)),
              workoutDone: Boolean(parsed.workoutDone),
              workoutType: parsed.workoutType || (parsed.workoutDone ? 'Gimnasio' : 'No entrené'),
              tradingResult: parsed.tradingResult || null,
              tradingPipsRR: parsed.tradingPipsRR || null,
              tradingNotes: parsed.tradingNotes || null,
              summaryText: parsed.summaryText || cleanText.slice(0, 160),
              tomorrowTasks: Array.isArray(parsed.tomorrowTasks)
                ? parsed.tomorrowTasks.slice(0, 4)
                : [],
              aiGenerated: true,
            };
          }
        }
      } catch (err: any) {
        console.error('Error llamando Gemini en processFreeformJournal:', err);
      }
    }

    if (!extracted) {
      extracted = runFallbackExtractor();
    }

    // Format tomorrow tasks into structured objects
    const formattedTomorrowTasks = (extracted.tomorrowTasks || []).slice(0, 4).map((t: string) => ({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: typeof t === 'string' ? t.replace(/^[-*•\d.)\s]+/, '').trim() : String(t),
      completed: false,
    }));

    // Date ranges
    const todayDate = new Date(referenceDate);
    const startOfToday = new Date(todayDate);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(todayDate);
    endOfToday.setHours(23, 59, 59, 999);

    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const startOfTomorrow = new Date(tomorrowDate);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrowDate);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // 1. Save / update today's DailyCheckIn
    const existingCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfToday, lte: endOfToday },
      },
    });

    let savedCheckin;
    const checkinPayload = {
      sleepHours: extracted.sleepHours,
      energyLevel: extracted.energyLevel,
      stressLevel: extracted.stressLevel,
      studyHoursDone: extracted.studyHours,
      workoutDone: extracted.workoutDone,
      workoutType: extracted.workoutType,
      tradingResult: extracted.tradingResult,
      tradingPipsRR: extracted.tradingPipsRR,
      tradingNotes: extracted.tradingNotes,
      dayClosure: cleanText,
      notes: extracted.summaryText || cleanText,
      tomorrowTasks: JSON.stringify(formattedTomorrowTasks),
    };

    if (existingCheckin) {
      savedCheckin = await prisma.dailyCheckIn.update({
        where: { id: existingCheckin.id },
        data: checkinPayload,
      });
    } else {
      savedCheckin = await prisma.dailyCheckIn.create({
        data: {
          userId: targetUserId,
          date: todayDate,
          ...checkinPayload,
        },
      });
    }

    // 2. Keep JournalEntry synced for today
    const existingJournal = await prisma.journalEntry.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfToday, lte: endOfToday },
      },
    });

    if (existingJournal) {
      await prisma.journalEntry.update({
        where: { id: existingJournal.id },
        data: {
          dayClosure: cleanText,
          tomorrowTasks: JSON.stringify(formattedTomorrowTasks),
          tradingResult: extracted.tradingResult,
          tradingPipsRR: extracted.tradingPipsRR,
          tradingNotes: extracted.tradingNotes,
          workoutType: extracted.workoutType,
        },
      });
    } else {
      await prisma.journalEntry.create({
        data: {
          userId: targetUserId,
          date: todayDate,
          dayClosure: cleanText,
          tomorrowTasks: JSON.stringify(formattedTomorrowTasks),
          tradingResult: extracted.tradingResult,
          tradingPipsRR: extracted.tradingPipsRR,
          tradingNotes: extracted.tradingNotes,
          workoutType: extracted.workoutType,
        },
      });
    }

    // 3. Link tasks to tomorrow's check-in so that when tomorrow arrives,
    // they are immediately loaded as tomorrow's active priority tasks
    const existingTomorrowCheckin = await prisma.dailyCheckIn.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfTomorrow, lte: endOfTomorrow },
      },
    });

    if (existingTomorrowCheckin) {
      await prisma.dailyCheckIn.update({
        where: { id: existingTomorrowCheckin.id },
        data: {
          tomorrowTasks: JSON.stringify(formattedTomorrowTasks),
        },
      });
    } else {
      await prisma.dailyCheckIn.create({
        data: {
          userId: targetUserId,
          date: tomorrowDate,
          tomorrowTasks: JSON.stringify(formattedTomorrowTasks),
          notes: 'Planificado en la bitácora nocturna de ayer',
        },
      });
    }

    return {
      success: true,
      summary: extracted,
      tomorrowTasks: formattedTomorrowTasks,
      checkin: savedCheckin,
      aiGenerated: Boolean(extracted.aiGenerated),
    };
  }
}

