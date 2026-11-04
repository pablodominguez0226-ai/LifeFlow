import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Sun,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { SundayPlannerWizardModal } from '../planning/SundayPlannerWizardModal';

export interface DashboardViewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToAcademic?: () => void;
  onNavigateToSports?: () => void;
  onOpenReplan?: (taskId: string) => void;
  onOpenDailyPlanner?: () => void;
  onOpenNewActivity?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToCalendar,
  onNavigateToAcademic,
}) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Datos de la API
  const [exams, setExams] = useState<any[]>([]);
  const [todayAgenda, setTodayAgenda] = useState<any[]>([]);
  const [habitsToday, setHabitsToday] = useState<any[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<any[]>([]);
  const [academicProgress, setAcademicProgress] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Smart Slot Manager
  const [currentSlot, setCurrentSlot] = useState<any | null>(null);
  const [freedSlot, setFreedSlot] = useState<any | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Cargar datos
  const loadData = async () => {
    try {
      setSyncing(true);
      const [dash, sum] = await Promise.all([
        api.getDashboardData().catch(() => null),
        api.getPlannerSummary().catch(() => null),
      ]);

      if (dash) {
        setExams(dash.exams || []);
        setTodayAgenda(dash.todayAgenda || []);
        setHabitsToday(dash.habitsToday || []);
        setWeeklySlots(dash.weeklySlots || []);
        setAcademicProgress(dash.academicProgress || []);

        // Detectar bloque actual
        const now = new Date();
        const active = (dash.todayAgenda || []).find((slot: any) => {
          const s = new Date(slot.start);
          const e = new Date(slot.end);
          return now >= s && now <= e;
        });

        const upcoming = (dash.todayAgenda || []).find((slot: any) => new Date(slot.start) > now);
        const slot = active || upcoming || dash.todayAgenda?.[0] || null;
        setCurrentSlot(slot);

        if (slot) {
          const secs = Math.max(0, differenceInSeconds(new Date(slot.end), now));
          setSecondsRemaining(secs);
        }

        // Detectar slot liberado dinámicamente hoy
        const freed = (dash.todayAgenda || []).find((slot: any) => slot.status === 'FREED');
        setFreedSlot(freed || null);
      }

      if (sum) {
        setSummary(sum);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Revalidación en foco de ventana (para sincronización con móvil)
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    // Auto-abrir wizard dominical si hoy es domingo y no hay plan semanal activo
    const today = new Date();
    if (today.getDay() === 0 && weeklySlots.length === 0) {
      setIsWizardOpen(true);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Timer regresivo del Smart Slot Manager
  useEffect(() => {
    if (secondsRemaining <= 0 || isTimerPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isTimerPaused]);

  // Manejo de toggle de hábitos
  const handleHabitToggle = async (habitKey: string) => {
    try {
      await api.toggleHabitAtomic(habitKey);
      await loadData();
    } catch (e) {
      console.error('Error toggling habit:', e);
    }
  };

  // Cálculo de métricas superiores
  const nearestExam = exams?.[0];
  const totalPlannedMinutes = todayAgenda.reduce((acc, slot) => {
    return acc + Math.max(0, differenceInMinutes(new Date(slot.end), new Date(slot.start)));
  }, 0);
  const dayOccupancyPerc = Math.min(100, Math.round((totalPlannedMinutes / (16 * 60)) * 100)); // sobre 16 horas operativas (7h - 23h)

  const plannedStudyHoursToday = Number(
    (
      todayAgenda
        .filter((s) => s.category === 'STUDY_DEEP')
        .reduce((acc, s) => acc + differenceInMinutes(new Date(s.end), new Date(s.start)), 0) / 60
    ).toFixed(1)
  );

  const completedStudyHoursToday = Number(
    (
      todayAgenda
        .filter((s) => s.category === 'STUDY_DEEP' && s.status === 'COMPLETED')
        .reduce((acc, s) => acc + differenceInMinutes(new Date(s.end), new Date(s.start)), 0) / 60
    ).toFixed(1)
  );

  // Formato MM:SS
  const timerMinutes = Math.floor(secondsRemaining / 60);
  const timerSeconds = secondsRemaining % 60;
  const timerDisplay = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`;

  const todayFormatted = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const isSunday = new Date().getDay() === 0;

  // Categorías con badge colors
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ACADEMIC_CLASS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'STUDY_DEEP':
        return 'bg-[#e50914]/15 text-[#e50914] border-[#e50914]/30 font-bold';
      case 'TRADING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'GYM':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REST':
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 space-y-6 max-w-[1600px] mx-auto selection:bg-[#e50914]/30">
      {/* 1. Header Desktop Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">¡Buen día, Pablo!</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#161b22] text-[#e50914] border border-[#e50914]/30">
              LifeFlow Core v2
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 capitalize font-medium">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-[#161b22] hover:bg-[#21262d] text-zinc-300 hover:text-white border border-[#30363d] text-xs font-semibold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#e50914]' : ''}`} />
            Sincronizar
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg ${
              isSunday
                ? 'bg-[#e50914] hover:bg-[#b80710] text-white shadow-[#e50914]/40 animate-pulse'
                : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-inherit" />
            Planificar Semana
            {isSunday && <span className="ml-1 text-[9px] uppercase px-1.5 py-0.5 bg-black/40 rounded">Domingo</span>}
          </button>
        </div>
      </header>

      {/* 2. Fila de Métricas Superiores */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prioridad de Hoy */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Prioridad de Hoy</span>
            <AlertTriangle className="w-4 h-4 text-[#e50914]" />
          </div>
          <div className="mt-3">
            <h3 className="text-base font-black text-white truncate">
              {nearestExam ? nearestExam.subject : 'Sin exámenes inmediatos'}
            </h3>
            <p className="text-xs text-[#e50914] font-bold mt-0.5">
              {nearestExam ? `Examen en ${nearestExam.daysRemaining} días` : 'Todo al día'}
            </p>
          </div>
        </div>

        {/* Carga del Día */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Carga del Día</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">{dayOccupancyPerc}%</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">{(totalPlannedMinutes / 60).toFixed(1)}h ocupadas de 16h</p>
            </div>
            <div className="w-12 h-2 rounded-full bg-[#0d1117] overflow-hidden border border-[#30363d]">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${dayOccupancyPerc}%` }}
              />
            </div>
          </div>
        </div>

        {/* Estudio Hoy */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Estudio Hoy</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">{completedStudyHoursToday}h</span>
              <span className="text-xs text-zinc-500 ml-1">/ {plannedStudyHoursToday}h planificadas</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Bloques de estudio profundo</p>
            </div>
          </div>
        </div>

        {/* Sueño / Descanso */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Sueño & Recuperación</span>
            <Sun className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white">7.5h</span>
              <span className="text-xs text-purple-400 ml-1.5 font-bold">Óptimo</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Despertar fijo 07:00 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contenedor de Dos Columnas (Principal & Lateral) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda / Centro (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Smart Slot Manager */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e50914] animate-ping" />
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">Smart Slot Manager</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0d1117] text-zinc-400 border border-[#30363d]">
                Reemplazo Dinámico Pomodoro
              </span>
            </div>

            {currentSlot ? (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadge(currentSlot.category)}`}>
                    {currentSlot.category}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">{currentSlot.title}</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {format(new Date(currentSlot.start), 'HH:mm')} — {format(new Date(currentSlot.end), 'HH:mm')}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl font-black font-mono tracking-tight text-white bg-[#161b22] px-5 py-2.5 rounded-2xl border border-[#30363d]">
                    {timerDisplay}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTimerPaused(!isTimerPaused)}
                      className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-zinc-300 transition-colors"
                    >
                      {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (currentSlot) {
                          setSecondsRemaining(Math.max(0, differenceInSeconds(new Date(currentSlot.end), new Date())));
                        }
                      }}
                      className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-zinc-300 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs">Sin bloque activo en este momento</div>
            )}

            {/* Tarjeta Dinámica para Slots Liberados (Ej. Gimnasio liberado) */}
            {freedSlot && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#161b22] to-[#1f1619] border border-[#e50914]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#e50914]">Slot Dinámico Activado</span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      Tiempo de Gym liberado transformado en Estudio Profundo
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#e50914]/10 text-[#e50914] border border-[#e50914]/30">
                  FREED & REASSIGNED
                </span>
              </div>
            )}
          </div>

          {/* Agenda de Hoy */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" /> Agenda de Hoy
              </h2>
              <span className="text-xs font-bold text-zinc-500">{todayAgenda.length} bloques</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {todayAgenda.map((slot) => {
                const isNow =
                  new Date() >= new Date(slot.start) && new Date() <= new Date(slot.end);

                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isNow
                        ? 'bg-[#1c2128] border-[#e50914] shadow-md shadow-[#e50914]/10'
                        : slot.status === 'FREED'
                        ? 'bg-[#0d1117]/60 border-[#30363d]/60 opacity-60 line-through'
                        : 'bg-[#0d1117] border-[#30363d] hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-xs font-mono font-bold text-zinc-400 shrink-0">
                        {format(new Date(slot.start), 'HH:mm')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">{slot.title}</span>
                        {slot.subject && (
                          <span className="text-[10px] text-[#e50914] font-semibold">{slot.subject}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadge(slot.category)}`}>
                        {slot.category}
                      </span>
                      {slot.isAutoSlot && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Auto
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Próximos Exámenes con Badges de Urgencia */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e50914]" /> Próximos Exámenes
              </h2>
              <span className="text-xs font-bold text-zinc-500">{exams.length} registrados</span>
            </div>

            <div className="space-y-2.5">
              {exams.map((exam) => {
                // Urgencia: Rojo crítico D <= 7, Ámbar D <= 35, Gris D > 35
                let urgencyBadge = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                if (exam.daysRemaining <= 7) {
                  urgencyBadge = 'bg-[#e50914]/20 text-[#e50914] border-[#e50914]/40 font-bold';
                } else if (exam.daysRemaining <= 35) {
                  urgencyBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold';
                }

                return (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{exam.subject}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{exam.type}</p>
                    </div>

                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${urgencyBadge}`}>
                      {exam.daysRemaining <= 0 ? '¡Hoy!' : `En ${exam.daysRemaining}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recomendaciones del Motor */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Recomendaciones del Motor
            </h2>
            <div className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <p className="font-bold text-white flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#e50914]" /> Máxima Aceleración Temporal
              </p>
              <p className="text-zinc-400 text-[11px]">
                {nearestExam
                  ? `Se recomienda blindar bloques de estudio profundo de 90 min para ${nearestExam.subject}. El factor crítico actual está en 5 * (8 - d).`
                  : 'Calendario despejado. Puedes mantener el balance habitual de lecturas y trading.'}
              </p>
            </div>
          </div>

          {/* Progreso Académico */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" /> Progreso Académico
              </h2>
              <span className="text-xs font-bold text-zinc-500">{academicProgress.length} materias</span>
            </div>

            <div className="space-y-3">
              {academicProgress.map((prog) => (
                <div key={prog.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300 truncate">{prog.subject}</span>
                    <span className="font-mono font-bold text-white">{prog.progressPerc}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0d1117] border border-[#30363d] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${prog.progressPerc}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sección Inferior: Vista Semanal */}
      <section className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Vista Semanal (PlannedSlots)
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Distribución horizontal interactiva de lunes a domingo</p>
          </div>
          <span className="text-xs font-bold text-zinc-400">{weeklySlots.length} slots programados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto pb-2">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName, idx) => {
            // Mapear slots correspondientes a este día
            const daySlots = weeklySlots.filter((slot) => {
              const d = new Date(slot.start).getDay();
              // Lunes = 1, Domingo = 0
              const normalizedDay = d === 0 ? 6 : d - 1;
              return normalizedDay === idx;
            });

            return (
              <div
                key={dayName}
                className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-3 flex flex-col space-y-2 min-w-[160px]"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#30363d]">
                  <span className="text-xs font-black text-white">{dayName}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{daySlots.length}</span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-2 rounded-xl text-[10px] border flex flex-col gap-0.5 transition-all ${getCategoryBadge(
                        slot.category
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{format(new Date(slot.start), 'HH:mm')}</span>
                        {slot.isAutoSlot && <span className="text-[8px] uppercase font-black text-amber-400">Auto</span>}
                      </div>
                      <span className="font-bold truncate text-white">{slot.title}</span>
                    </div>
                  ))}

                  {daySlots.length === 0 && (
                    <span className="text-[10px] text-zinc-600 italic block py-4 text-center">Sin slots</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Dominical de Planificación Semanal */}
      <SundayPlannerWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default DashboardView;
