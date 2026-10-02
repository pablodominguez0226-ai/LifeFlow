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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export const SportsView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Checkin form state
  const [sleepHours, setSleepHours] = useState(7.5);
  const [energyLevel, setEnergyLevel] = useState(4);
  const [stressLevel, setStressLevel] = useState(2);
  const [studyHoursDone, setStudyHoursDone] = useState(3.0);
  const [workoutType, setWorkoutType] = useState<string>('Gimnasio');

  // Trading state (collapsible module)
  const [isTradingOpen, setIsTradingOpen] = useState(false);
  const [tradingResult, setTradingResult] = useState<string>('');
  const [tradingPipsRR, setTradingPipsRR] = useState<string>('');
  const [tradingNotes, setTradingNotes] = useState<string>('');

  // Structured Night Journal & Plan state
  const [dayClosure, setDayClosure] = useState<string>('');
  const [tomorrowTasks, setTomorrowTasks] = useState<TaskItem[]>([]);
  const [newTomorrowTaskText, setNewTomorrowTaskText] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getCheckinHistory();
      setHistory(res);

      // Check if today's checkin already exists to prefill form
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = (res || []).find(
        (item: any) => format(new Date(item.date), 'yyyy-MM-dd') === todayStr
      );

      if (todayEntry) {
        if (todayEntry.sleepHours !== undefined) setSleepHours(todayEntry.sleepHours);
        if (todayEntry.energyLevel !== undefined) setEnergyLevel(todayEntry.energyLevel);
        if (todayEntry.stressLevel !== undefined) setStressLevel(todayEntry.stressLevel);
        if (todayEntry.studyHoursDone !== undefined) setStudyHoursDone(todayEntry.studyHoursDone);
        if (todayEntry.workoutType) {
          setWorkoutType(todayEntry.workoutType);
        } else if (todayEntry.workoutDone === false) {
          setWorkoutType('No entrené');
        } else {
          setWorkoutType('Gimnasio');
        }

        if (todayEntry.tradingResult) {
          setTradingResult(todayEntry.tradingResult);
          setIsTradingOpen(true);
        }
        if (todayEntry.tradingPipsRR) {
          setTradingPipsRR(todayEntry.tradingPipsRR);
          setIsTradingOpen(true);
        }
        if (todayEntry.tradingNotes) {
          setTradingNotes(todayEntry.tradingNotes);
          setIsTradingOpen(true);
        }

        if (todayEntry.dayClosure) {
          setDayClosure(todayEntry.dayClosure);
        } else if (todayEntry.notes) {
          setDayClosure(todayEntry.notes);
        }

        if (todayEntry.tomorrowTasks) {
          try {
            const parsed = JSON.parse(todayEntry.tomorrowTasks);
            if (Array.isArray(parsed)) setTomorrowTasks(parsed);
          } catch (e) {
            console.error('Error parsing tomorrow tasks:', e);
          }
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
  };

  const handleRemoveTomorrowTask = (taskId: string) => {
    setTomorrowTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const isWorkoutDone = workoutType !== 'No entrené';
      await api.createCheckin({
        date: new Date().toISOString(),
        sleepHours: Number(sleepHours),
        energyLevel: Number(energyLevel),
        stressLevel: Number(stressLevel),
        studyHoursDone: Number(studyHoursDone),
        workoutDone: isWorkoutDone,
        workoutType,
        tradingResult: tradingResult || undefined,
        tradingPipsRR: tradingPipsRR || undefined,
        tradingNotes: tradingNotes || undefined,
        dayClosure: dayClosure || undefined,
        tomorrowTasks: tomorrowTasks.length > 0 ? tomorrowTasks : undefined,
        notes: dayClosure || undefined,
      });
      setSubmittedMessage(
        'Check-in y Bitácora registrados con éxito. Tu plan para mañana se sincronizó con el Dashboard.'
      );
      loadHistory();
      setTimeout(() => setSubmittedMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic system date calculation formatted in Spanish
  const today = new Date();
  const rawDayName = format(today, 'EEEE', { locale: es });
  const capitalizedDay = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);
  const formattedToday = `${capitalizedDay}, ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
  const badgeDate = format(today, "d MMM yyyy", { locale: es });

  const workoutOptions = [
    { value: 'Gimnasio', label: 'Gimnasio', icon: Dumbbell, desc: 'Fuerza / Hipertrofia' },
    { value: 'Rugby/Fútbol', label: 'Rugby/Fútbol', icon: Trophy, desc: 'Deporte de equipo' },
    { value: 'Descanso activo', label: 'Descanso activo', icon: Activity, desc: 'Movilidad / Caminata' },
    { value: 'No entrené', label: 'No entrené', icon: Moon, desc: 'Descanso total' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 bg-black text-white">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Recuperación, Bitácora Diaria & Trading
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Rendimiento físico, balance psicológico y planificación nocturna estratégica
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

      {/* Daily Check-in Form + History Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Checkin Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Header with Dynamic Date */}
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Activity className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registro de Recuperación Diaria</h3>
                <p className="text-[11px] text-zinc-400 capitalize">{formattedToday}</p>
              </div>
            </div>
            <span className="text-xs text-zinc-300 font-mono font-bold px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] capitalize">
              {badgeDate}
            </span>
          </div>

          {submittedMessage && (
            <div className="p-3.5 bg-[#0A2613] border border-[#165E30] text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{submittedMessage}</span>
            </div>
          )}

          <form onSubmit={handleCheckinSubmit} className="space-y-5">
            {/* Metric Sliders / Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#18181B] p-3.5 rounded-xl border border-[#27272A] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-300 font-medium">
                    Horas dormidas anoche
                  </label>
                  <span className="text-xs font-mono font-bold text-white">{sleepHours}h</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="10.0"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>5h (Déficit)</span>
                  <span>7.5h (Objetivo)</span>
                  <span>9h (Óptimo)</span>
                </div>
              </div>

              <div className="bg-[#18181B] p-3.5 rounded-xl border border-[#27272A] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-300 font-medium">
                    Horas estudiadas hoy
                  </label>
                  <span className="text-xs font-mono font-bold text-white">{studyHoursDone}h</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="14"
                  value={studyHoursDone}
                  onChange={(e) => setStudyHoursDone(Number(e.target.value))}
                  className="w-full bg-[#121215] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Suma total de sesiones o bloques académicos completados
                </span>
              </div>
            </div>

            {/* Energy & Stress Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                  Nivel de Energía (1-5)
                </label>
                <select
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value={1}>1 — Muy baja (Agotamiento)</option>
                  <option value={2}>2 — Baja</option>
                  <option value={3}>3 — Moderada</option>
                  <option value={4}>4 — Alta (Excelente foco)</option>
                  <option value={5}>5 — Máxima (Peak cognitivo)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                  Nivel de Estrés (1-5)
                </label>
                <select
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value={1}>1 — Muy bajo (Calma total)</option>
                  <option value={2}>2 — Bajo / Controlado</option>
                  <option value={3}>3 — Moderado</option>
                  <option value={4}>4 — Alto</option>
                  <option value={5}>5 — Sobrecarga / Alerta</option>
                </select>
              </div>
            </div>

            {/* 2. Rediseño del Registro de Entrenamiento y Estado: Segmented Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-300 font-semibold block">
                  Entrenamiento y Estado Físico
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {workoutType}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {workoutOptions.map((opt) => {
                  const isSelected = workoutType === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWorkoutType(opt.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center select-none ${
                        isSelected
                          ? 'bg-white text-zinc-950 border-white shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white'
                          : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`} />
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                      <span
                        className={`text-[9px] mt-0.5 truncate max-w-full ${
                          isSelected ? 'text-zinc-700 font-medium' : 'text-zinc-500'
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Módulo de Trading / Operativa Diaria: Collapsible Section */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsTradingOpen(!isTradingOpen)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Operativa de Trading del Día</h4>
                    <p className="text-[11px] text-zinc-400">
                      {tradingResult
                        ? `${tradingResult} ${tradingPipsRR ? `• ${tradingPipsRR}` : ''}`
                        : 'Registro de resultados, pips / R:R y disciplina operativa (opcional)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tradingResult && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        tradingResult === 'Positiva / Win'
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                          : tradingResult === 'Negativa / Loss'
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {tradingResult.split(' / ')[0]}
                    </span>
                  )}
                  {isTradingOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </button>

              {isTradingOpen && (
                <div className="p-4 pt-2 border-t border-[#27272A] space-y-4 bg-[#141417]">
                  {/* Selector de resultado */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                      Resultado de la Sesión
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTradingResult(tradingResult === 'Positiva / Win' ? '' : 'Positiva / Win')
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          tradingResult === 'Positiva / Win'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-emerald-400 hover:border-emerald-800'
                        }`}
                      >
                        Positiva / Win
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTradingResult(tradingResult === 'Negativa / Loss' ? '' : 'Negativa / Loss')
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          tradingResult === 'Negativa / Loss'
                            ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                            : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-rose-400 hover:border-rose-800'
                        }`}
                      >
                        Negativa / Loss
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTradingResult(
                            tradingResult === 'Breakeven / No operé' ? '' : 'Breakeven / No operé'
                          )
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          tradingResult === 'Breakeven / No operé'
                            ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                            : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                        }`}
                      >
                        Breakeven / No operé
                      </button>
                    </div>
                  </div>

                  {/* Pips / R:R */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                      Pips / R:R
                    </label>
                    <input
                      type="text"
                      value={tradingPipsRR}
                      onChange={(e) => setTradingPipsRR(e.target.value)}
                      placeholder="Ej: +35 pips / 1:2.5 R:R, -15 pips o BE"
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Bitácora operativa / Lección aprendida */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                      Bitácora operativa / Lección aprendida
                    </label>
                    <textarea
                      rows={3}
                      value={tradingNotes}
                      onChange={(e) => setTradingNotes(e.target.value)}
                      placeholder="Ej: Gestión de riesgo respetada (1% de capital). Entrada en retroceso tras ruptura de sesión asiática. Disciplina psicológica: esperé confirmación sin FOMO."
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Flujo de Bitácora Nocturna y Planificación del Día Siguiente */}
            <div className="space-y-4 pt-1 border-t border-[#27272A]/80">
              {/* a) Cierre del Día (Bitácora) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-300 font-bold block">
                    a) Cierre del Día (Bitácora)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Reflexión nocturna</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Resumen de qué se logró hoy, qué quedó pendiente y balance general del día.
                </p>
                <textarea
                  rows={3}
                  value={dayClosure}
                  onChange={(e) => setDayClosure(e.target.value)}
                  placeholder="Ej: Se completó la Unidad 1 de Paradigmas y sesión de fuerza en el gimnasio. Quedó pendiente lectura de Economía. Buen nivel de concentración sin distracciones."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                />
              </div>

              {/* b) Plan para Mañana (Top 3-4 Tareas Clave) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-300 font-bold block">
                    b) Plan para Mañana (Top 3-4 Tareas Clave)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {tomorrowTasks.length} / 4 recomendadas
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Lista interactiva de ítems prioritarios. Se reflejarán automáticamente en tu Dashboard como el checklist prioritario del día siguiente.
                </p>

                {/* Task Items List */}
                <div className="space-y-2">
                  {tomorrowTasks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 p-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-zinc-200 truncate font-medium">{t.text}</span>
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
                    <div className="p-3 bg-[#18181B]/50 border border-dashed border-[#27272A] rounded-xl text-center text-xs text-zinc-500">
                      Aún no definiste tareas para mañana. Agrega 3 o 4 tareas clave para amanecer con foco claro.
                    </div>
                  )}
                </div>

                {/* Add Task Input */}
                {tomorrowTasks.length < 6 && (
                  <div className="flex items-center gap-2">
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
                      placeholder="Ej: Estudiar Paradigmas Unidad 2, sesión de trading NY, editar video..."
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

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Sugerencias:</span>
                  {[
                    'Estudio: Paradigmas (U2)',
                    'Estudio: Diseño de Sistemas',
                    'Sesión Trading Apertura NY',
                    'Gimnasio Sesión Fuerza',
                    'Lectura Matutina 20 min',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (tomorrowTasks.some((t) => t.text === suggestion)) return;
                        setTomorrowTasks((prev) => [
                          ...prev,
                          {
                            id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            text: suggestion,
                            completed: false,
                          },
                        ]);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#18181B] text-zinc-400 hover:text-white border border-[#27272A] hover:border-zinc-600 transition-colors cursor-pointer"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white hover:bg-[#E4E4E7] text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {submitting ? 'Guardando Registro & Plan...' : 'Guardar Check-In Diario & Plan Nocturno'}
            </button>
          </form>
        </div>

        {/* History Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#121215] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <h3 className="text-base font-bold text-white">Historial Reciente</h3>
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
                  Completa tu primer check-in de hoy para inaugurar tu historial de recuperación, bitácora nocturna y balance de trading.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
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
                        {check.sleepHours}h sueño
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Estudio: {check.studyHoursDone}h
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Energía: {check.energyLevel}/5
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Estrés: {check.stressLevel}/5
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
                      <p className="text-[11px] text-zinc-300 italic pt-1 leading-snug">
                        "{check.dayClosure || check.notes}"
                      </p>
                    )}

                    {/* Tomorrow tasks planned preview */}
                    {tomorrowTasksList.length > 0 && (
                      <div className="pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400 space-y-0.5">
                        <span className="text-zinc-500 font-mono block">Plan para el día siguiente:</span>
                        <ul className="space-y-0.5">
                          {tomorrowTasksList.slice(0, 3).map((task) => (
                            <li key={task.id} className="truncate text-zinc-300 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-500" />
                              <span>{task.text}</span>
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
