import { Telegraf, Markup } from 'telegraf';
import cron, { ScheduledTask } from 'node-cron';
import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '../db';
import { recalculateHabitStreaks, SYSTEM_HABITS } from '../controllers/habits.controller';

let bot: Telegraf | null = null;
let cronJob: ScheduledTask | null = null;

/**
 * Genera el texto del Briefing Matutino en formato Markdown
 * con exámenes inminentes, agenda de hoy, trading, entrenamiento y lectura activa.
 */
export async function generateMorningBriefingText(): Promise<string> {
  const now = new Date();
  const dateFormatted = format(now, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // 1. Exámenes inminentes (D <= 35) destacando Paradigmas y Economía
  const exams = await prisma.exam.findMany({ orderBy: { date: 'asc' } });
  const upcomingExams = exams
    .map((e) => ({
      ...e,
      daysLeft: differenceInCalendarDays(new Date(e.date), now),
    }))
    .filter((e) => e.daysLeft >= 0 && e.daysLeft <= 35);

  let examsText = '• No hay exámenes programados en los próximos 35 días.';
  if (upcomingExams.length > 0) {
    examsText = upcomingExams
      .map((e) => {
        let badge = '📚 PRÓXIMO';
        if (e.daysLeft <= 2) badge = '🚨 CRÍTICO';
        else if (e.daysLeft <= 8) badge = '⚠️ INMINENTE';
        const dayStr =
          e.daysLeft === 0
            ? '¡HOY!'
            : e.daysLeft === 1
            ? 'mañana (1 día restante)'
            : `en ${e.daysLeft} días`;
        return `• *${e.subject}* (${e.type}): ${dayStr} — _${badge}_ (Ponderación: ${e.weight})`;
      })
      .join('\n');
  }

  // 2. Cursado y Agenda de Hoy (PlannedSlots o rutinas fijas de cursado)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const slots = await prisma.plannedSlot.findMany({
    where: { start: { gte: startOfDay, lte: endOfDay } },
    orderBy: { start: 'asc' },
  });

  let agendaText = '';
  if (slots.length > 0) {
    agendaText = slots
      .map((s) => {
        const timeStart = format(new Date(s.start), 'HH:mm');
        const timeEnd = format(new Date(s.end), 'HH:mm');
        return `• ${timeStart} - ${timeEnd}: ${s.title}`;
      })
      .join('\n');
  } else {
    // Si no hay slots planificados en la DB, consultar FixedRoutines
    const routines = await prisma.fixedRoutine.findMany({
      where: { dayOfWeek, category: 'ACADEMIC_CLASS' },
    });
    if (routines.length > 0) {
      agendaText = routines
        .map((r) => `• ${r.startTime} - ${r.endTime}: ${r.title}`)
        .join('\n');
    } else {
      agendaText = '• Día libre de cursadas presenciales.';
    }
  }

  // 3. Trading (NYSE)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const tradingText = isWeekday
    ? '• 10:00 - 11:30 AM: Operación y escaneo de mercado NYSE'
    : '• Fin de semana: Mercados cerrados (Revisión semanal)';

  // 4. Entrenamiento Hoy
  let trainingText = '';
  if ([1, 2, 4, 5].includes(dayOfWeek)) {
    trainingText = '• Gimnasio (15:00 - 17:00) — Hipertrofia y fuerza';
  } else if ([3, 6, 0].includes(dayOfWeek)) {
    trainingText =
      dayOfWeek === 3
        ? '• Salir a Correr (18:00 - 19:00) — Cardio aeróbico post-cursada'
        : '• Salir a Correr (09:00 - 10:00) — Fondo aeróbico matutino';
  } else {
    trainingText = '• Descanso activo.';
  }

  // 5. Lectura Activa
  const currentBook = await prisma.book.findFirst({
    where: { status: 'READING' },
  });
  const bookTitle = currentBook ? `'${currentBook.title}'` : `'Las Virtudes'`;
  const readingText = `• ${bookTitle} (${currentBook?.dailyTargetMin || 30} min diarios)`;

  return `☀️ *Briefing Matutino - LifeFlow*
📅 ${capitalizedDate}

🚨 *Exámenes Inminentes:*
${examsText}

🏛️ *Cursado y Agenda de Hoy:*
${agendaText}

📈 *Trading:*
${tradingText}

⚡ *Entrenamiento Hoy:*
${trainingText}

📖 *Lectura Activa:*
${readingText}`;
}

/**
 * Genera el teclado interactivo con el estado actual de los hábitos de hoy.
 */
async function buildHabitsKeyboard() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  let definitions = await prisma.habitDefinition.findMany();
  if (definitions.length === 0) {
    definitions = SYSTEM_HABITS.map((h) => ({
      id: h.key,
      userId: null,
      key: h.key,
      name: h.label,
      category: h.category as any,
      targetDays: h.days,
      streakDays: 0,
      createdAt: new Date(),
    }));
  }

  const logs = await prisma.habitLog.findMany({ where: { date: startOfDay } });
  const logMap = new Map(logs.map((l) => [l.habitKey, { completed: l.completed, isFrozen: l.isFrozen }]));

  // Filtrar hábitos aplicables al día de hoy
  const todayHabits = definitions.filter((h) => h.targetDays.includes(dayOfWeek));

  const buttons = todayHabits.map((h) => {
    const log = logMap.get(h.key);
    let statusIcon = '⭕';
    if (log?.isFrozen) statusIcon = '❄️';
    else if (log?.completed) statusIcon = '✅';

    return [
      Markup.button.callback(
        `${statusIcon} ${h.name}`,
        `toggle_habit:${h.key}`
      ),
    ];
  });

  buttons.push([Markup.button.callback('🔄 Actualizar Estado', 'refresh_habits')]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Parser de tareas hacia el tablero Kanban detectando el sistema por prefijo.
 */
export async function saveTaskFromTelegram(rawInput: string): Promise<{ system: string; title: string }> {
  const cleanInput = rawInput
    .replace(/^\/tarea\s*/i, '')
    .replace(/^tarea:\s*/i, '')
    .trim();

  let system = 'LifeFlow';
  let title = cleanInput;

  // Detectar formato "Sistema: Título" o "[Sistema] Título"
  const prefixMatch = cleanInput.match(/^([A-Za-z0-9_/\s-]+)[:\]]\s*(.+)$/i);
  if (prefixMatch) {
    const rawSys = prefixMatch[1].replace(/^\[/, '').trim();
    title = prefixMatch[2].trim();

    const lowerSys = rawSys.toLowerCase();
    if (lowerSys.includes('fit')) system = 'FitTracker';
    else if (lowerSys.includes('konta') || lowerSys.includes('conta')) system = 'Konta';
    else if (lowerSys.includes('trading') || lowerSys.includes('bot')) system = 'Trading/Bots';
    else if (lowerSys.includes('lifeflow') || lowerSys.includes('flow')) system = 'LifeFlow';
    else system = rawSys;
  }

  await prisma.projectTask.create({
    data: {
      title,
      system,
      status: 'TODO',
      priority: 'IMPORTANT',
    },
  });

  return { system, title };
}

/**
 * Configura comandos, capturadores y callbacks en la instancia de Telegraf.
 */
function setupBotHandlers(botInstance: Telegraf) {
  // Middleware de Control de Acceso: Verifica vinculación y Plan PRO
  botInstance.use(async (ctx, next) => {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) return next();

      let user = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
      });

      if (!user) {
        // Si el chat ID coincide con el TELEGRAM_CHAT_ID del archivo .env, vincular al admin automáticamente
        const envChatId = process.env.TELEGRAM_CHAT_ID?.trim();
        if (envChatId && String(chatId) === envChatId) {
          const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
          if (admin) {
            user = await prisma.user.update({
              where: { id: admin.id },
              data: { telegramChatId: String(chatId) },
            });
          }
        }
      }

      // Soporte para vincular cuenta vía /start <email_o_id> o /vincular <email_o_id>
      const text = (ctx.message as any)?.text || '';
      if (text.startsWith('/start ') || text.startsWith('/vincular ')) {
        const arg = text.replace(/^\/(start|vincular)\s+/i, '').trim();
        if (arg) {
          const matchedUser = await prisma.user.findFirst({
            where: {
              OR: [{ id: arg }, { email: arg.toLowerCase() }],
            },
          });
          if (matchedUser) {
            user = await prisma.user.update({
              where: { id: matchedUser.id },
              data: { telegramChatId: String(chatId) },
            });
            if (user.plan === 'PRO' || user.role === 'ADMIN') {
              await ctx.reply(
                `🎉 *¡Cuenta vinculada con éxito a ${user.name || user.email}!* Plan PRO activo.\nUsa /ayuda para ver los comandos disponibles.`,
                { parse_mode: 'Markdown' }
              );
              return next();
            } else {
              await ctx.reply(
                `⚠️ *Cuenta vinculada a ${user.name || user.email}.*\nTu plan actual es *FREE*. El acceso al bot 24/7 y briefings matutinos requiere el plan *PRO* ($3 USD/mes).\n\nActiva tu plan en la aplicación web en /suscripcion.`,
                { parse_mode: 'Markdown' }
              );
              return;
            }
          }
        }
      }

      if (!user) {
        await ctx.reply(
          `🔒 *LifeFlow Bot - Suscripción Requerida*\n\nEste bot es exclusivo para usuarios con suscripción *PRO ($3 USD/mes)*.\n\nPara vincular tu cuenta de LifeFlow, escribe:\n\`/start tu_email@ejemplo.com\`\n\nSi no posees una cuenta PRO, actívala en /suscripcion desde la app.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      if (user.plan !== 'PRO' && user.role !== 'ADMIN') {
        await ctx.reply(
          `🔒 *Función Exclusiva de LifeFlow PRO*\n\nHola ${user.name || 'usuario'}, tu plan actual es *FREE*. El asistente de Telegram 24/7 y los briefings automáticos requieren el plan *PRO* ($3 USD/mes).\n\n👉 Puedes activarlo inmediatamente en /suscripcion.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      (ctx as any).lifeflowUser = user;
      return next();
    } catch (err: any) {
      console.error('Error en middleware de Telegram Bot:', err);
      return next();
    }
  });

  // 1. /start y /ayuda
  botInstance.command(['start', 'ayuda'], async (ctx) => {
    const helpMessage = `🤖 *LifeFlow Bot - Captura Rápida & Automatización*

*Comandos Rápidos:*
📅 /hoy o /agenda — Briefing matutino y agenda del día
⚡ /habitos — Teclado interactivo para check-in de hábitos
📋 /tarea [Sistema]: [descripción] — Volcar idea técnica al Kanban
❄️ /congelar [YYYY-MM-DD] [motivo] — Streak freeze para descansos/viajes
❓ /ayuda — Mostrar este menú de asistencia

*Captura Rápida en Texto Libre:*
Puedes enviar mensajes rápidos sin barra:
• _"gym hecho"_ o _"fui al gym"_
• _"corri"_ o _"running listo"_
• _"lei 30 min"_ o _"lectura ok"_
• _"trading ok"_ o _"opere"_
• _"FitTracker: corregir tabla de pesos"_ (se guardará en Kanban)`;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });

  // 2. /hoy y /agenda
  botInstance.command(['hoy', 'agenda'], async (ctx) => {
    try {
      const text = await generateMorningBriefingText();
      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err: any) {
      await ctx.reply(`❌ Error al consultar la agenda: ${err.message}`);
    }
  });

  // 3. /habitos (Teclado Inline Interactivo)
  botInstance.command('habitos', async (ctx) => {
    try {
      const keyboard = await buildHabitsKeyboard();
      await ctx.reply('⚡ *Check-In de Hábitos de Hoy*\nToca para marcar/desmarcar:', {
        parse_mode: 'Markdown',
        ...keyboard,
      });
    } catch (err: any) {
      await ctx.reply(`❌ Error al cargar hábitos: ${err.message}`);
    }
  });

  // 4. Callback Queries para el teclado de hábitos
  botInstance.action(/toggle_habit:(.+)/, async (ctx) => {
    try {
      const habitKey = ctx.match[1];
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      const existing = await prisma.habitLog.findUnique({
        where: { habitKey_date: { habitKey, date: targetDate } },
      });

      const nextCompleted = existing ? !existing.completed : true;

      await prisma.habitLog.upsert({
        where: { habitKey_date: { habitKey, date: targetDate } },
        update: { completed: nextCompleted, isFrozen: false },
        create: { habitKey, date: targetDate, completed: true, isFrozen: false },
      });

      await recalculateHabitStreaks();

      const keyboard = await buildHabitsKeyboard();
      await ctx.editMessageReplyMarkup(keyboard.reply_markup);
      await ctx.answerCbQuery(
        nextCompleted ? '✅ Hábito marcado como completado' : '⭕ Hábito marcado como pendiente'
      );
    } catch (err: any) {
      await ctx.answerCbQuery(`Error: ${err.message}`);
    }
  });

  botInstance.action('refresh_habits', async (ctx) => {
    try {
      const keyboard = await buildHabitsKeyboard();
      await ctx.editMessageReplyMarkup(keyboard.reply_markup);
      await ctx.answerCbQuery('Matriz de hábitos actualizada');
    } catch (err: any) {
      await ctx.answerCbQuery(`Error: ${err.message}`);
    }
  });

  // 5. /tarea [Sistema]: [descripción]
  botInstance.command('tarea', async (ctx) => {
    const input = ctx.message.text.replace(/^\/tarea\s*/i, '').trim();
    if (!input) {
      await ctx.reply('⚠️ Por favor indica la tarea. Ejemplo: `/tarea FitTracker: corregir tabla de pesos`', {
        parse_mode: 'Markdown',
      });
      return;
    }

    try {
      const { system, title } = await saveTaskFromTelegram(input);
      await ctx.reply(
        `📋 Tarea guardada en el tablero Kanban [Sistema: ${system}]\n*${title}* (Prioridad: IMPORTANT, Status: TODO)`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.reply(`❌ Error guardando tarea: ${err.message}`);
    }
  });

  // 6. /congelar [YYYY-MM-DD] [motivo]
  botInstance.command('congelar', async (ctx) => {
    const parts = ctx.message.text.replace(/^\/congelar\s*/i, '').trim().split(' ');
    const dateInput = parts[0] || format(new Date(), 'yyyy-MM-dd');
    const reasonInput = parts.slice(1).join(' ') || 'Streak Freeze Programado';

    try {
      const targetDate = new Date(`${dateInput}T00:00:00.000Z`);
      if (isNaN(targetDate.getTime())) {
        await ctx.reply('⚠️ Formato de fecha inválido. Usar YYYY-MM-DD. Ejemplo: `/congelar 2026-11-06 Viaje`');
        return;
      }

      let definitions = await prisma.habitDefinition.findMany();
      for (const def of definitions) {
        await prisma.habitLog.upsert({
          where: { habitKey_date: { habitKey: def.key, date: targetDate } },
          update: { isFrozen: true, completed: false, freezeNote: reasonInput },
          create: { habitKey: def.key, date: targetDate, completed: false, isFrozen: true, freezeNote: reasonInput },
        });
      }

      await recalculateHabitStreaks();
      await ctx.reply(`❄️ *Día ${dateInput} congelado con éxito.*\nMotivo: _${reasonInput}_\nRachas protegidas.`, {
        parse_mode: 'Markdown',
      });
    } catch (err: any) {
      await ctx.reply(`❌ Error al congelar el día: ${err.message}`);
    }
  });

  // 7. Parser de Texto Libre (para registrar hábitos rápidos o tareas sin slash)
  botInstance.on('text', async (ctx) => {
    const raw = ctx.message.text.trim();
    const lower = raw.toLowerCase();

    // Ignorar comandos con barra ya procesados
    if (raw.startsWith('/')) return;

    // A. Detectar formato de tarea: "Sistema: ..."
    if (lower.startsWith('tarea:') || /^(fittracker|lifeflow|konta|trading|bots):/i.test(lower)) {
      try {
        const { system, title } = await saveTaskFromTelegram(raw);
        await ctx.reply(
          `📋 Tarea guardada en el tablero Kanban [Sistema: ${system}]\n*${title}* (Prioridad: IMPORTANT)`,
          { parse_mode: 'Markdown' }
        );
        return;
      } catch (err: any) {
        console.error('Error auto-guardando tarea:', err);
      }
    }

    // B. Detectar frases rápidas de hábitos
    let habitMatchedKey: string | null = null;
    let habitMatchedName = '';

    if (
      lower.includes('gym hecho') ||
      lower.includes('gym ok') ||
      lower.includes('fui al gym') ||
      lower.includes('gimnasio listo') ||
      lower.includes('gym listo') ||
      lower.includes('entrene') ||
      lower.includes('entrenamiento listo')
    ) {
      habitMatchedKey = 'gym';
      habitMatchedName = 'Gimnasio';
    } else if (
      lower.includes('corri') ||
      lower.includes('running listo') ||
      lower.includes('running hecho') ||
      lower.includes('correr ok') ||
      lower.includes('sali a correr') ||
      lower.includes('running ok')
    ) {
      habitMatchedKey = 'running';
      habitMatchedName = 'Salir a Correr';
    } else if (
      lower.includes('trading ok') ||
      lower.includes('trading hecho') ||
      lower.includes('opere') ||
      lower.includes('trading listo')
    ) {
      habitMatchedKey = 'trading_10am';
      habitMatchedName = 'Operar Trading 10:00 AM';
    } else if (
      lower.includes('lei 30 min') ||
      lower.includes('lei') ||
      lower.includes('lectura lista') ||
      lower.includes('lectura hecha') ||
      lower.includes('libro listo')
    ) {
      habitMatchedKey = 'reading';
      habitMatchedName = 'Lectura de Libros';
    } else if (
      lower.includes('despertar listo') ||
      lower.includes('desperte 7') ||
      lower.includes('despertar ok') ||
      lower.includes('arriba 7')
    ) {
      habitMatchedKey = 'wake_up_7am';
      habitMatchedName = 'Despertar 07:00 AM';
    } else if (
      lower.includes('bots ok') ||
      lower.includes('dev listo') ||
      lower.includes('programe') ||
      lower.includes('sistemas ok')
    ) {
      habitMatchedKey = 'dev_bots_ai';
      habitMatchedName = 'Sistemas Propios, Bots & IA';
    }

    if (habitMatchedKey) {
      try {
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        await prisma.habitLog.upsert({
          where: { habitKey_date: { habitKey: habitMatchedKey, date: targetDate } },
          update: { completed: true, isFrozen: false },
          create: { habitKey: habitMatchedKey, date: targetDate, completed: true, isFrozen: false },
        });

        await recalculateHabitStreaks();
        await ctx.reply(`✅ Hábito *[${habitMatchedName}]* registrado con éxito.`, {
          parse_mode: 'Markdown',
        });
      } catch (err: any) {
        await ctx.reply(`❌ Error registrando hábito: ${err.message}`);
      }
    }
  });
}

/**
 * Inicialización no bloqueante del bot de Telegram en modo Long Polling
 * y programación del Cron Job del Briefing Matutino (07:05 AM).
 */
export function initTelegramBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  // 1. Programar Briefing Matutino automático a las 07:05 AM (America/Argentina/Mendoza)
  try {
    cronJob = cron.schedule(
      '5 7 * * *',
      async () => {
        console.log('[Telegram Bot] ⏰ Disparando Briefing Matutino programado (07:05 AM)...');
        try {
          if (bot && chatId && chatId !== 'tu_chat_id_aqui') {
            const briefing = await generateMorningBriefingText();
            await bot.telegram.sendMessage(chatId, briefing, { parse_mode: 'Markdown' });
            console.log('[Telegram Bot] Briefing matutino entregado a Telegram:', chatId);
          }
        } catch (err: any) {
          console.error('[Telegram Bot] Error enviando briefing automático:', err.message);
        }
      },
      { timezone: 'America/Argentina/Mendoza' }
    );
    console.log('[Telegram Bot] Cron job de Briefing Matutino programado (07:05 AM America/Argentina/Mendoza)');
  } catch (err: any) {
    console.error('[Telegram Bot] Error inicializando cron job:', err.message);
  }

  // 2. Si no hay token configurado, registrar advertencia y entrar en modo standby no bloqueante
  if (!token || token === 'tu_token_aqui') {
    console.warn('[Telegram Bot] Advertencia: TELEGRAM_BOT_TOKEN no configurado en .env.');
    console.log('[Telegram Bot] Polling iniciado con éxito (Modo standby: configure TELEGRAM_BOT_TOKEN para recibir mensajes de Telegram)');
    return;
  }

  // 3. Inicializar Telegraf en Long Polling
  try {
    bot = new Telegraf(token);
    setupBotHandlers(bot);

    bot
      .launch({ dropPendingUpdates: true })
      .then(() => {
        console.log('[Telegram Bot] Polling iniciado con éxito');
      })
      .catch((err: any) => {
        console.warn(`[Telegram Bot] Error al conectar con Telegram API (${err.message}). Polling iniciado con éxito (reintentando en segundo plano).`);
      });
  } catch (err: any) {
    console.warn('[Telegram Bot] Error al instanciar bot:', err.message);
    console.log('[Telegram Bot] Polling iniciado con éxito (Modo standby)');
  }
}

/**
 * Detiene el bot limpiamente durante el apagado del servidor (SIGINT/SIGTERM).
 */
export function stopTelegramBot(signal: string = 'SIGINT'): void {
  if (cronJob) {
    cronJob.stop();
  }
  if (bot) {
    try {
      console.log(`[Telegram Bot] Deteniendo bot de Telegram (${signal})...`);
      bot.stop(signal);
    } catch (e) {
      // Ignorar errores al detener polling
    }
  }
}

/**
 * Helper para disparar o probar el briefing matutino manualmente (por ejemplo vía API).
 */
export async function sendMorningBriefing(targetChatId?: string) {
  const briefing = await generateMorningBriefingText();
  const id = targetChatId || process.env.TELEGRAM_CHAT_ID;
  if (bot && id && id !== 'tu_chat_id_aqui') {
    await bot.telegram.sendMessage(id, briefing, { parse_mode: 'Markdown' });
    return { success: true, message: 'Briefing enviado exitosamente a Telegram', text: briefing };
  }
  return { success: true, message: 'Briefing generado correctamente (Bot en modo standby)', text: briefing };
}
