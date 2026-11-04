import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Dumbbell,
  Moon,
  Trophy,
  Activity,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Sparkles,
  Target,
  Brain,
  Clock,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ExtractedStats {
  studyHours: number;
  sleepHours: number;
  energyLevel: number;
  stressLevel: number;
  workoutDone: boolean;
  workoutType: string;
  tradingResult: string | null;
  tradingPipsRR: string | null;
  tradingNotes: string | null;
  summaryText: string;
  aiGenerated?: boolean;
}

export const SportsView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Freeform Journal state
  const [journalText, setJournalText] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<ExtractedStats | null>(null);

  // Tomorrow tasks checklist
  const [tomorrowTasks, setTomorrowTasks] = useState<TaskItem[]>([]);
  const [newTomorrowTaskText, setNewTomorrowTaskText] = useState<string>('');

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getCheckinHistory();
      setHistory(res);

      // Check if today's checkin already exists to prefill
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = (res || []).find(
        (item: any) => format(new Date(item.date), 'yyyy-MM-dd') === todayStr
      );

      if (todayEntry) {
        if (todayEntry.dayClosure) {
          setJournalText(todayEntry.dayClosure);
        } else if (todayEntry.notes) {
          setJournalText(todayEntry.notes);
        }

        if (todayEntry.tomorrowTasks) {
          try {
            const parsed = JSON.parse(todayEntry.tomorrowTasks);
            if (Array.isArray(parsed)) setTomorrowTasks(parsed);
          } catch (e) {
            console.error('Error parsing tomorrow tasks:', e);
          }
        }

        // Populate summary if available
        if (
          todayEntry.studyHoursDone !== undefined ||
          todayEntry.sleepHours !== undefined ||
          todayEntry.tradingResult ||
          todayEntry.dayClosure
        ) {
          setExtractedSummary({
            studyHours: todayEntry.studyHoursDone ?? 0,
            sleepHours: todayEntry.sleepHours ?? 7.5,
            energyLevel: todayEntry.energyLevel ?? 4,
            stressLevel: todayEntry.stressLevel ?? 2,
            workoutDone: Boolean(todayEntry.workoutDone),
            workoutType: todayEntry.workoutType || (todayEntry.workoutDone ? 'Gimnasio' : 'No entrené'),
            tradingResult: todayEntry.tradingResult || null,
            tradingPipsRR: todayEntry.tradingPipsRR || null,
            tradingNotes: todayEntry.tradingNotes || null,
            summaryText: todayEntry.notes || todayEntry.dayClosure || 'Registro del día guardado.',
            aiGenerated: true,
          });
        }
      }
    } catch (err) {
      console.error('Error cargando historial de checkin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleProcessFreeformJournal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = journalText.trim();
    if (!trimmed) return;

    try {
      setIsProcessingAI(true);
      setNoticeMessage(null);

      const res = await api.processFreeformJournal(trimmed, new Date().toISOString());

      if (res?.summary) {
        setExtractedSummary(res.summary);
      }
      if (res?.tomorrowTasks && Array.isArray(res.tomorrowTasks)) {
        setTomorrowTasks(res.tomorrowTasks);
      }

      setNoticeMessage(
        res?.aiGenerated
          ? 'Bitácora analizada y guardada con Gemini. Estadísticas y plan para mañana sincronizados.'
          : 'Bitácora guardada con éxito. Plan para mañana sincronizado con el Dashboard.'
      );

      await loadHistory();
      setTimeout(() => setNoticeMessage(null), 5000);
    } catch (err: any) {
      console.error('Error procesando bitácora libre:', err);
      setNoticeMessage('Error al procesar la bitácora con IA. Inténtalo de nuevo.');
      setTimeout(() => setNoticeMessage(null), 4000);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAddTomorrowTask = () => {
    const trimmed = newTomorrowTaskText.trim();
    if (!trimmed) return;
    const newTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      completed: false,
    };
    setTomorrowTasks((prev) => [...prev, newTask]);
    setNewTomorrowTaskText('');

    // Also persist through priority task API
    api.addPriorityTask(trimmed).catch((err) => console.error(err));
  };

  const handleRemoveTomorrowTask = (taskId: string) => {
    setTomorrowTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleToggleTomorrowTask = async (taskId: string) => {
    const task = tomorrowTasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextCompleted = !task.completed;
    setTomorrowTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t))
    );
    try {
      await api.togglePriorityTask(taskId, nextCompleted);
    } catch (err) {
      console.error('Error toggling tomorrow task:', err);
    }
  };

  // Dynamic system date formatted in Spanish
  const today = new Date();
  const rawDayName = format(today, 'EEEE', { locale: es });
  const capitalizedDay = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);
  const formattedToday = `${capitalizedDay}, ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
  const badgeDate = format(today, "d MMM yyyy", { locale: es });

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 bg-[#09090B] text-white min-h-screen pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Recuperación, Bitácora Diaria & Trading
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Rendimiento físico, balance psicológico y extracción inteligente de hábitos y tareas
        </p>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Gimnasio */}
        <div className="bg-[#121215] border border-[#27272A] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-zinc-300" />
              <h3 className="text-sm font-bold text-white">Gimnasio (Fuerza)</h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-300">4x / semana</span>
          </div>

          <p className="text-xs text-zinc-300">
            Sesiones de 2 a 2.5 horas. Horarios habituales:
          </p>

          <ul className="text-[11px] text-zinc-400 space-y-1 font-mono">
            <li>• Lunes: 16:00 / 17:00 (2 — 2.5 horas)</li>
            <li>• Martes: Temprano (10:30 — 12:45, antes de Consulta Diseño)</li>
            <li>• Jueves: 16:00 — 18:00 (1h de margen antes de Sistemas a las 19:00)</li>
            <li>• Viernes: 17:15 — 19:30 (con margen tras terminar Economía a las 17:00)</li>
          </ul>

          <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-xl text-[10px] text-zinc-300">
            <strong className="text-white">Regla de Alta Carga:</strong> En semanas críticas con 2+ exámenes inmediatos, se reduce automáticamente a 3 sesiones para proteger la recuperación.
          </div>
        </div>

        {/* Pillar 2: Deportes de Equipo */}
        <div className="bg-[#121215] border border-[#27272A] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-zinc-300" />
              <h3 className="text-sm font-bold text-white">Fútbol & Rugby</h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">Deportes</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
              <span className="font-bold text-white block">Fútbol (Sábado Mañana)</span>
              <span className="text-[11px] text-zinc-400">Fijo y social. Sábado tarde queda libre para amigos y mates.</span>
            </div>

            <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Rugby (Martes 21:00)</span>
                <span className="text-[9px] font-bold text-zinc-300 uppercase px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A] font-mono">
                  Flexible
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Salida 19:30. Insume ~3.5h totales. Es el primer elemento a sacrificar ante sobrecarga.
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Sueño Sagrado */}
        <div className="bg-[#121215] border border-[#27272A] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-zinc-300" />
              <h3 className="text-sm font-bold text-white">Restricción Dura de Sueño</h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-300">7 - 8 Horas</span>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Hora máxima dormir:</span>
              <span className="font-bold text-white">00:00</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Hora despertar:</span>
              <span className="font-bold text-white">06:30 - 07:00</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Fin estudio pesado:</span>
              <span className="font-bold text-zinc-200">22:30</span>
            </div>
          </div>

          <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-xl text-[10px] text-zinc-300">
            <strong className="text-white">Inviolable:</strong> El motor NUNCA asignará sesiones de estudio nocturnas que reduzcan el descanso básico por debajo de 7 horas.
          </div>
        </div>
      </div>

      {/* Bitácora de Texto Libre + Historial Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Freeform Journal Section (7 cols) */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Header with Dynamic Date */}
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cierre del Día & Bitácora</h3>
                <p className="text-[11px] text-zinc-400 capitalize">{formattedToday}</p>
              </div>
            </div>
            <span className="text-xs text-zinc-300 font-mono font-bold px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] capitalize">
              {badgeDate}
            </span>
          </div>

          {noticeMessage && (
            <div className="p-3.5 bg-[#0A2613] border border-[#165E30] text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Área de Texto Libre Titulada */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-white block">
                Bitácora del Día (¿Qué hiciste hoy y qué tenés en mente?)
              </label>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Escribe en prosa libre: cuánto dormiste, qué materias y temas estudiaste, tus horas de foco, cómo te sentiste, si fuiste al gym o entrenaste, tu sesión de trading y qué tareas necesitas encarar mañana.
              </p>
            </div>

            <textarea
              rows={8}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Ej: Hoy dormí 7.5h y me levanté con buena energía. Le metí 3.5h a Paradigmas Unidad 2 completando la guía de ejercicios de funciones puras. Fui al gimnasio a las 17:00 a hacer sesión de empuje. En trading operé la sesión de NY con +28 pips (1:2 R:R) respetando el stop. Para mañana necesito: 1) Repasar Unidad 2 de Paradigmas, 2) Avanzar Unidad 1 de Diseño de Sistemas, 3) Hacer compras de la semana y 4) 20 min de lectura nocturna."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all leading-relaxed resize-y min-h-[180px]"
            />

            <button
              type="button"
              onClick={() => handleProcessFreeformJournal()}
              disabled={isProcessingAI || !journalText.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-[#E4E4E7] text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isProcessingAI ? (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950 animate-spin" />
                  <span>Analizando y extrayendo con Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>Guardar y Procesar con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Estadísticas Resumidas Extraídas */}
          {extractedSummary && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141417] border border-[#27272A] space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Extracción Inteligente por IA
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A]">
                  {extractedSummary.aiGenerated ? 'Gemini 2.5 Flash' : 'Motor LifeFlow'}
                </span>
              </div>

              {/* Grid de Métricas Resumidas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Horas de Estudio</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {extractedSummary.studyHours}h
                  </span>
                </div>

                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Descanso Anoche</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {extractedSummary.sleepHours}h
                  </span>
                </div>

                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Foco / Energía</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {extractedSummary.energyLevel} / 5
                  </span>
                </div>

                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Nivel de Estrés</span>
                  <span className="text-sm font-black text-white font-mono mt-0.5 block">
                    {extractedSummary.stressLevel} / 5
                  </span>
                </div>

                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Entrenamiento</span>
                  <span className="text-xs font-bold text-white truncate mt-0.5 block">
                    {extractedSummary.workoutType || (extractedSummary.workoutDone ? 'Completado' : 'Descanso')}
                  </span>
                </div>

                <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 font-mono block">Operativa Trading</span>
                  <span className="text-xs font-bold text-white truncate mt-0.5 block">
                    {extractedSummary.tradingResult || 'Sin sesión'}
                  </span>
                </div>
              </div>

              {extractedSummary.tradingPipsRR && (
                <div className="text-[11px] text-zinc-300 font-mono px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A]">
                  <strong>Resultado Trading:</strong> {extractedSummary.tradingPipsRR}
                </div>
              )}

              {extractedSummary.summaryText && (
                <p className="text-xs text-zinc-300 italic bg-[#18181B] p-3 rounded-xl border border-[#27272A]/70 leading-relaxed">
                  "{extractedSummary.summaryText}"
                </p>
              )}
            </div>
          )}

          {/* Checklist de Tareas Prioritarias para Mañana (máx 4 ítems) */}
          <div className="space-y-3 pt-3 border-t border-[#27272A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white" />
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Checklist de Tareas para Mañana
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] border border-[#27272A] text-zinc-400">
                {tomorrowTasks.length} / 4 prioridad
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Tareas extraídas automáticamente por la IA. Se sincronizan en tu Dashboard para el día siguiente.
            </p>

            <div className="space-y-2">
              {tomorrowTasks.map((t, idx) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                    t.completed
                      ? 'bg-[#18181B]/60 border-[#27272A] opacity-75'
                      : 'bg-[#18181B] border-[#27272A] hover:border-zinc-600'
                  }`}
                >
                  <div
                    onClick={() => handleToggleTomorrowTask(t.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        t.completed
                          ? 'bg-white border-white text-zinc-950'
                          : 'bg-zinc-900 border-zinc-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-medium truncate ${
                        t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                      }`}
                    >
                      {t.text}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTomorrowTask(t.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {tomorrowTasks.length === 0 && (
                <div className="p-4 bg-[#18181B]/50 border border-dashed border-[#27272A] rounded-xl text-center text-xs text-zinc-500">
                  Escribe en tu bitácora qué querés hacer mañana y pulsa &quot;Guardar y Procesar con IA&quot; para extraerlas automáticamente.
                </div>
              )}
            </div>

            {/* Quick Add input */}
            {tomorrowTasks.length < 6 && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTomorrowTaskText}
                  onChange={(e) => setNewTomorrowTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTomorrowTask();
                    }
                  }}
                  placeholder="Agregar tarea manual para mañana..."
                  className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleAddTomorrowTask}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Agregar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#121215] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <h3 className="text-base font-bold text-white">Historial de Bitácoras</h3>
            <span className="text-xs text-zinc-400 font-mono">
              {history.length} {history.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              Cargando historial...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 bg-[#18181B]/50 border border-dashed border-[#27272A] rounded-2xl text-center space-y-3 my-2">
              <div className="w-12 h-12 rounded-2xl bg-[#121215] border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 shadow-sm">
                <Activity className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Sin registros aún</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Completa tu primera bitácora del día con texto libre para inaugurar tu historial de recuperación y foco.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {history.map((check) => {
                let tomorrowTasksList: TaskItem[] = [];
                if (check.tomorrowTasks) {
                  try {
                    const parsed = JSON.parse(check.tomorrowTasks);
                    if (Array.isArray(parsed)) tomorrowTasksList = parsed;
                  } catch (e) {}
                }

                return (
                  <div
                    key={check.id}
                    className="p-3.5 bg-[#18181B] border border-[#27272A] rounded-xl space-y-2 text-xs hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-zinc-300 font-semibold">
                        {new Date(check.date).toLocaleDateString('es-AR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="text-white font-mono font-bold">
                        {check.sleepHours ?? 7.5}h sueño
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Estudio: {check.studyHoursDone ?? 0}h
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Energía: {check.energyLevel ?? 4}/5
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Estrés: {check.stressLevel ?? 2}/5
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {check.workoutType || (check.workoutDone ? '🏋️ Gimnasio' : '💤 Rest')}
                      </span>
                    </div>

                    {/* Trading Badge if present */}
                    {check.tradingResult && (
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            check.tradingResult === 'Positiva / Win'
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                              : check.tradingResult === 'Negativa / Loss'
                              ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          Trading: {check.tradingResult}
                        </span>
                        {check.tradingPipsRR && (
                          <span className="text-[10px] font-mono text-zinc-400">
                            {check.tradingPipsRR}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Day closure notes */}
                    {(check.dayClosure || check.notes) && (
                      <p className="text-[11px] text-zinc-300 italic pt-1 leading-snug line-clamp-3">
                        "{check.dayClosure || check.notes}"
                      </p>
                    )}

                    {/* Tomorrow tasks preview */}
                    {tomorrowTasksList.length > 0 && (
                      <div className="pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400 space-y-0.5">
                        <span className="text-zinc-500 font-mono block">Plan para el día siguiente:</span>
                        <ul className="space-y-0.5">
                          {tomorrowTasksList.slice(0, 3).map((task) => (
                            <li key={task.id} className="truncate text-zinc-300 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-500" />
                              <span className={task.completed ? 'line-through text-zinc-500' : ''}>
                                {task.text}
                              </span>
                            </li>
                          ))}
                          {tomorrowTasksList.length > 3 && (
                            <li className="text-zinc-500 font-mono">
                              +{tomorrowTasksList.length - 3} tareas más...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportsView;
