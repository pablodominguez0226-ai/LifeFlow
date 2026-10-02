import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Target,
  Gauge,
  BookOpen,
  Moon,
  Calendar,
  Key,
  GraduationCap,
  Utensils,
  Dumbbell,
  TrendingUp,
  Clock,
  RotateCw,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  RotateCcw,
  Sun,
  Plus,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Logo } from '../common/Logo';

interface DashboardViewProps {
  onNavigateToCalendar: () => void;
  onNavigateToAcademic: () => void;
  onNavigateToSports?: () => void;
  onOpenReplan: (taskId: string) => void;
  onOpenDailyPlanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToCalendar,
  onNavigateToAcademic,
  onNavigateToSports,
  onOpenReplan,
  onOpenDailyPlanner,
}) => {
  const [data, setData] = useState<any>(null);
  const [guidedStudy, setGuidedStudy] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [submittingSessionId, setSubmittingSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBriefing, setAiBriefing] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [completedBlockMap, setCompletedBlockMap] = useState<Record<string, boolean>>({});

  // Priority Checklist (Planificado en la Bitácora Nocturna)
  const [priorityTasks, setPriorityTasks] = useState<any[]>([]);
  const [newPriorityTaskText, setNewPriorityTaskText] = useState('');

  // Rutina de Inicio de Jornada
  const [isReadingDone, setIsReadingDone] = useState<boolean>(false);
  const [readingHabitId, setReadingHabitId] = useState<string | null>(null);
  const [markingReading, setMarkingReading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, guidedRes, subjectsRes] = await Promise.all([
        api.getDashboard(new Date().toISOString()),
        api.getGuidedStudy().catch(() => null),
        api.getSubjects(new Date().toISOString()).catch(() => []),
      ]);
      setData(dashRes);
      setGuidedStudy(guidedRes);
      setSubjects(subjectsRes || []);

      if (dashRes?.priorityTasks?.tasks) {
        setPriorityTasks(dashRes.priorityTasks.tasks);
      }
      if (dashRes?.morningRoutine?.firstHabit) {
        setIsReadingDone(Boolean(dashRes.morningRoutine.firstHabit.completed));
        setReadingHabitId(dashRes.morningRoutine.firstHabit.id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePriorityTask = async (taskId: string) => {
    const task = priorityTasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextCompleted = !task.completed;
    setPriorityTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted } : t))
    );
    try {
      await api.togglePriorityTask(taskId, nextCompleted);
    } catch (err) {
      console.error('Error toggling priority task:', err);
      // Revert if error
      setPriorityTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: task.completed } : t))
      );
    }
  };

  const handleAddPriorityTask = async () => {
    const trimmed = newPriorityTaskText.trim();
    if (!trimmed) return;
    try {
      const res = await api.addPriorityTask(trimmed);
      if (res?.tasks) {
        setPriorityTasks(res.tasks);
      } else {
        setPriorityTasks((prev) => [
          ...prev,
          { id: `task_${Date.now()}`, text: trimmed, completed: false },
        ]);
      }
      setNewPriorityTaskText('');
    } catch (err) {
      console.error('Error adding priority task:', err);
    }
  };

  const handleToggleMorningReading = async () => {
    try {
      setMarkingReading(true);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      let targetHabitId = readingHabitId;
      if (!targetHabitId || targetHabitId === 'habit_reading') {
        const habits = await api.getHabits();
        const habit = habits.find((h: any) => h.title.toLowerCase().includes('lectura'));
        if (habit) {
          targetHabitId = habit.id;
          setReadingHabitId(habit.id);
        }
      }
      if (targetHabitId) {
        await api.toggleHabitDay(targetHabitId, todayStr);
      }
      setIsReadingDone((prev) => !prev);
    } catch (err) {
      console.error('Error toggling reading habit:', err);
    } finally {
      setMarkingReading(false);
    }
  };

  const handleCompleteGuidedStudy = async (topicId: string, isReview: boolean) => {
    try {
      setSubmittingSessionId(topicId);
      await api.recordStudySession(topicId, { force: isReview });
      await loadData();
    } catch (err) {
      console.error('Error completando sesión guiada:', err);
    } finally {
      setSubmittingSessionId(null);
    }
  };

  const loadAiBriefing = async () => {
    try {
      setAiLoading(true);
      const res = await api.getDailyBriefing(new Date().toISOString());
      setAiBriefing(res);
    } catch (err: any) {
      console.error('Error cargando briefing de IA:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAiBriefing();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-500 font-medium">Cargando LifeFlow Dashboard...</span>
        </div>
      </div>
    );
  }

  // Fallback agenda (Definitive Timetable: Miércoles sin cursada fija, día de alta flexibilidad)
  const agendaItems = [
    {
      id: 'fallback-1',
      startTimeStr: '09:00',
      endTimeStr: '11:00',
      time: '09:00\n11:00',
      title: 'Estudio Profundo: Diseño de Sistemas',
      subtitle: 'Final 08/10 — Caching & ACID',
      tag: 'ALTA',
      tagColor: 'bg-[#18181B] text-zinc-200 border-zinc-700',
      icon: BookOpen,
      category: 'ACADEMIA',
      status: 'PLANIFICADO',
    },
    {
      id: 'fallback-2',
      startTimeStr: '12:30',
      endTimeStr: '13:30',
      time: '12:30\n13:30',
      title: 'Almuerzo + Descanso (Buffer)',
      subtitle: 'Tiempo personal no negociable',
      tag: 'DESCANSO',
      tagColor: 'bg-[#121215] text-zinc-400 border-zinc-800',
      icon: Utensils,
      category: 'DESCANSO',
      status: 'PLANIFICADO',
    },
    {
      id: 'fallback-3',
      startTimeStr: '15:00',
      endTimeStr: '17:00',
      time: '15:00\n17:00',
      title: 'Estudio Profundo: Paradigmas',
      subtitle: 'Prolog & Programación Lógica (1P en 23d)',
      tag: 'ALTA',
      tagColor: 'bg-[#18181B] text-zinc-200 border-zinc-700',
      icon: GraduationCap,
      category: 'ACADEMIA',
      status: 'PLANIFICADO',
    },
    {
      id: 'fallback-4',
      startTimeStr: '20:30',
      endTimeStr: '21:30',
      time: '20:30\n21:30',
      title: 'Operar mercado con amigo',
      subtitle: 'Actividad flexible opcional',
      tag: 'OPCIONAL',
      tagColor: 'bg-[#121215] text-zinc-400 border-zinc-800',
      icon: TrendingUp,
      category: 'MERCADO',
      status: 'PLANIFICADO',
    },
    {
      id: 'fallback-5',
      startTimeStr: '22:30',
      endTimeStr: '23:30',
      time: '22:30\n23:30',
      title: 'Lectura Personal: Filosofía & Psicología',
      subtitle: 'Descanso cognitivo sin pantallas',
      tag: 'DESCANSO',
      tagColor: 'bg-[#121215] text-zinc-400 border-zinc-800',
      icon: BookOpen,
      category: 'LECTURA',
      status: 'PLANIFICADO',
    },
  ];

  const today = new Date();
  const rawDayName = format(today, 'EEEE', { locale: es });
  const capitalizedDayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);
  const rawFormattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const displayFullDate = rawFormattedDate.charAt(0).toUpperCase() + rawFormattedDate.slice(1);
  const currentDayOfWeek = today.getDay(); // 0 = DOM, 1 = LUN, ..., 6 = SÁB

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACADEMIA':
        return BookOpen;
      case 'GIMNASIO':
      case 'DEPORTE':
        return Dumbbell;
      case 'LECTURA':
        return BookOpen;
      case 'MERCADO':
        return TrendingUp;
      case 'DESCANSO':
      case 'PERSONAL':
      default:
        return Utensils;
    }
  };

  const dynamicAgendaItems =
    data?.todayBlocks && data.todayBlocks.length > 0
      ? data.todayBlocks.map((b: any) => ({
          id: b.id,
          realBlockId: b.id,
          startTimeStr: format(new Date(b.startTime), 'HH:mm'),
          endTimeStr: format(new Date(b.endTime), 'HH:mm'),
          startTime: b.startTime,
          endTime: b.endTime,
          time: `${format(new Date(b.startTime), 'HH:mm')}\n${format(new Date(b.endTime), 'HH:mm')}`,
          title: b.title,
          subtitle: b.justification || b.category,
          tag: b.energyLevel || (b.isFixed ? 'FIJA' : 'FLEXIBLE'),
          tagColor:
            b.energyLevel === 'ALTA'
              ? 'bg-[#18181B] text-zinc-200 border-zinc-700'
              : 'bg-[#121215] text-zinc-400 border-zinc-800',
          icon: getCategoryIcon(b.category),
          status: b.status,
        }))
      : agendaItems;

  const isBlockCompleted = (item: any): boolean => {
    if (completedBlockMap[item.id] !== undefined) {
      return completedBlockMap[item.id];
    }
    if (item.status === 'COMPLETADO') return true;
    if (item.endTime) {
      return new Date(item.endTime).getTime() <= Date.now();
    }
    if (item.endTimeStr) {
      const [hours, minutes] = item.endTimeStr.split(':').map(Number);
      const end = new Date(today);
      end.setHours(hours, minutes, 0, 0);
      return end.getTime() <= Date.now();
    }
    return false;
  };

  const totalBlocksCount = dynamicAgendaItems.length;
  const completedBlocksCount = dynamicAgendaItems.filter(isBlockCompleted).length;
  const dayProgressPercentage =
    totalBlocksCount > 0 ? Math.round((completedBlocksCount / totalBlocksCount) * 100) : 0;

  const activeSubject =
    subjects.find(
      (s: any) =>
        s.id ===
        (guidedStudy?.pendingReviewTopic?.unit?.subjectId ||
          guidedStudy?.nextNewTopic?.unit?.subjectId)
    ) ||
    subjects[0] ||
    null;

  const handleToggleBlock = async (item: any) => {
    const currentlyCompleted = isBlockCompleted(item);
    const nextCompleted = !currentlyCompleted;
    setCompletedBlockMap((prev) => ({ ...prev, [item.id]: nextCompleted }));

    if (item.realBlockId) {
      try {
        await api.updateBlock(item.realBlockId, {
          status: nextCompleted ? 'COMPLETADO' : 'PLANIFICADO',
        });
      } catch (err) {
        console.error('Error actualizando estado del bloque:', err);
      }
    }
  };

  const nextBlock = dynamicAgendaItems.find((item: any) => !isBlockCompleted(item)) || dynamicAgendaItems[0];

  const renderAiBriefingCard = () => (
    <div className="relative overflow-hidden rounded-2xl border border-[#27272A] bg-[#121215] p-5 sm:p-6 shadow-sm transition-all hover:border-zinc-700">
      {/* Ambient subtle lighting */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Sparkles className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                  Briefing Estratégico Diario
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {aiBriefing?.aiGenerated ? 'Gemini 2.5 Flash' : 'LifeFlow Copilot'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Enfoque prioritario y prevención de sobrecarga cognitiva
              </p>
            </div>
          </div>

          <button
            onClick={loadAiBriefing}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white bg-[#18181B] border border-[#27272A] hover:border-zinc-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Regenerar análisis estratégico"
          >
            <RotateCw className={`w-3 h-3 ${aiLoading ? 'animate-spin text-zinc-300' : ''}`} />
            <span>{aiLoading ? 'Analizando...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Briefing Content */}
        {aiLoading && !aiBriefing ? (
          <div className="py-4 space-y-2 animate-pulse">
            <div className="h-4 bg-zinc-800/80 rounded w-5/6" />
            <div className="h-4 bg-zinc-800/80 rounded w-4/6" />
            <div className="h-4 bg-zinc-800/80 rounded w-3/6" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed tracking-normal">
              {aiBriefing?.briefing ||
                'Planifica tus bloques de alta energía en la materia crítica del día y evita tareas secundarias para mantener tu sostenibilidad cognitiva.'}
            </p>

            {/* Context chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {aiBriefing?.topSubject && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Foco clave: <strong className="text-white">{aiBriefing.topSubject}</strong>
                </span>
              )}
              {aiBriefing?.nearestExam && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Examen urgente: <strong className="text-white">{aiBriefing.nearestExam}</strong>
                </span>
              )}
              {aiBriefing?.secondExam && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Prevención siguiente: <strong className="text-white">{aiBriefing.secondExam}</strong>
                </span>
              )}
              {aiBriefing?.unmarkedHabits && aiBriefing.unmarkedHabits.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Hábitos sin marcar (48h):{' '}
                  <strong className="text-zinc-200">
                    {aiBriefing.unmarkedHabits.slice(0, 2).join(', ')}
                    {aiBriefing.unmarkedHabits.length > 2 ? ` (+${aiBriefing.unmarkedHabits.length - 2})` : ''}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNextBlockCard = () => {
    if (!nextBlock) return null;
    const isCompleted = isBlockCompleted(nextBlock);
    const Icon = nextBlock.icon || BookOpen;

    return (
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Próximo Bloque
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-white px-2.5 py-0.5 rounded bg-[#18181B] border border-[#27272A]">
            {nextBlock.startTimeStr} — {nextBlock.endTimeStr}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0 text-white mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className={`text-sm sm:text-base font-bold text-white leading-snug truncate ${isCompleted ? 'line-through text-zinc-500' : ''}`}>
                {nextBlock.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {nextBlock.subtitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase font-semibold">
                  {nextBlock.tag}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {isCompleted ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleToggleBlock(nextBlock)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isCompleted
                ? 'bg-white text-zinc-950 border-white'
                : 'bg-[#18181B] border-[#27272A] text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Listo' : 'Marcar'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto bg-[#09090B] text-white">
      {/* Top Header Greeting, Brand & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* LifeFlow Brand & Subtle Badge */}
          <div className="flex items-center gap-2.5 mb-2">
            <Logo size={24} showText textClassName="text-base font-extrabold tracking-tight text-white" />
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#18181B] text-zinc-300 border border-[#27272A]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              System Active
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#18181B] text-zinc-400 border border-[#27272A]">
              v1.0
            </span>
            <span className="sm:hidden px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#18181B] text-zinc-300 border border-[#27272A]">
              Lite
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¡Buen día, Pablo!
          </h1>
          <p className="text-xs text-zinc-400 mt-1">{displayFullDate}</p>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sincronizar</span>
          </button>

          {onOpenDailyPlanner && (
            <button
              onClick={onOpenDailyPlanner}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Planificar mi día</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE-FIRST HERO: 1) AI DIRECTIVE -> 2) PRÓXIMO BLOQUE */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {/* 1. Directiva de IA del día */}
        {renderAiBriefingCard()}

        {/* 2. Tarjeta del próximo bloque */}
        {renderNextBlockCard()}
      </div>

      {/* Barra de Progreso del Día (Day Progress Bar) */}
      <div className="w-full min-w-0 bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-5 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Progreso del Día
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-400 border border-[#27272A]">
                  {capitalizedDayName}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {completedBlocksCount} de {totalBlocksCount} bloques completados ({dayProgressPercentage}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-base sm:text-lg font-extrabold font-mono text-white tracking-tight">
              {dayProgressPercentage}%
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#18181B] text-zinc-300 border border-[#27272A]">
              {totalBlocksCount - completedBlocksCount} pendientes
            </span>
          </div>
        </div>

        {/* Progress Bar Track & Fill */}
        <div className="w-full bg-[#18181B] border border-zinc-800/80 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            style={{ width: `${dayProgressPercentage}%` }}
          />
        </div>
      </div>

      {/* Desktop AI Briefing (hidden on mobile since it is rendered at top) */}
      <div className="hidden md:block">
        {renderAiBriefingCard()}
      </div>

      {/* Top 4 Metrics Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Prioridad de hoy */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-zinc-300 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block">Prioridad de hoy</span>
            <p className="text-base font-bold text-white truncate">
              {data?.dayPriority || 'Paradigmas & Diseño'}
            </p>
            <p className="text-[11px] text-zinc-400">1º parcial en 23 días • Final en 36 días</p>
          </div>
        </div>

        {/* Metric 2: Carga del día */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 text-zinc-300 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block">Carga del día</span>
            <p className="text-base font-bold text-white">
              {data?.dayLoadLevel
                ? `${data.dayLoadLevel.charAt(0)}${data.dayLoadLevel.slice(1).toLowerCase()}`
                : 'Equilibrada'}
            </p>
            <p className="text-[11px] text-zinc-400">Sin cursada fija hoy</p>
          </div>
        </div>

        {/* Metric 3: Estudio hoy */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-zinc-300 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block">Estudio hoy</span>
              <p className="text-base font-bold text-white font-mono">
                {data?.studyStats ? `${data.studyStats.plannedHours}h 00m` : '4h 00m'}
              </p>
              <p className="text-[11px] text-zinc-400">en 2 bloques de 120m</p>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-white h-1 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>

        {/* Metric 4: Sueño */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
              <Moon className="w-6 h-6 text-zinc-300 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block">Sueño</span>
              <p className="text-base font-bold text-white font-mono">
                {data?.studyStats ? `${data.studyStats.actualSleepHours}h` : '7h 30m'}
              </p>
              <p className="text-[11px] text-zinc-400">anoche (máx acostarse 00:00)</p>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-white h-1 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1) RUTINA DE INICIO DE JORNADA + 2) CHECKLIST PRIORITARIO DEL DÍA */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rutina de Inicio de Jornada (Lectura Matutina antes de Estudio) */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Sun className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                    Rutina de Inicio de Jornada
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Activación cognitiva progresiva antes de exigir la mente al máximo
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#18181B] text-amber-300 border border-amber-900/50">
                Protocolo Matutino
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {/* 1.º Hábito: Lectura tranquila matutina */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isReadingDone
                    ? 'bg-[#141E17] border-[#1D4A2B]'
                    : 'bg-[#18181B] border-[#27272A]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isReadingDone
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : 'bg-[#121215] border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                          1.º Hábito (15-20 min)
                        </span>
                        {isReadingDone && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Completado
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        Lectura tranquila matutina (15-20 min)
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Activar la mente sin fatiga de estudio de golpe. Estimulación suave del foco.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMorningReading}
                    disabled={markingReading}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
                      isReadingDone
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-sm'
                        : 'bg-white hover:bg-zinc-200 text-zinc-950 font-semibold'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isReadingDone ? 'Listo ✓' : 'Marcar'}</span>
                  </button>
                </div>
              </div>

              {/* 2.º Bloque: Sesión de estudio / Trabajo profundo */}
              <div className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#121215] border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300">
                      <GraduationCap className="w-4 h-4 text-zinc-200" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                        2.º Bloque
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        Sesión de estudio / Trabajo profundo
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        Foco cognitivo alto una vez activada la mente. Materia sugerida:{' '}
                        <strong className="text-zinc-200">
                          {guidedStudy?.pendingReviewTopic?.unit?.subject?.name ||
                            guidedStudy?.nextNewTopic?.unit?.subject?.name ||
                            'Paradigmas / Diseño'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToAcademic}
                    className="px-3 py-2 rounded-xl text-xs font-semibold shrink-0 bg-[#121215] hover:bg-zinc-800 border border-[#27272A] hover:border-zinc-500 text-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Iniciar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Prioritario del Día (Planificado en la Bitácora Nocturna) */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                    Checklist Prioritario del Día
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Top 3-4 tareas clave definidas en la Bitácora Nocturna
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-300 border border-[#27272A]">
                {priorityTasks.filter((t: any) => t.completed).length} / {priorityTasks.length} listas
              </span>
            </div>

            {/* Tasks List */}
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
              {priorityTasks.map((task: any, idx: number) => {
                const isDone = Boolean(task.completed);
                return (
                  <div
                    key={task.id || idx}
                    onClick={() => handleTogglePriorityTask(task.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none gap-3 ${
                      isDone
                        ? 'bg-[#18181B]/60 border-[#27272A] opacity-75'
                        : 'bg-[#18181B] border-[#27272A] hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-white border-white text-zinc-950'
                            : 'bg-zinc-900 border-zinc-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current stroke-none" />
                      </div>
                      <span
                        className={`text-xs font-medium truncate ${
                          isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                      Top #{idx + 1}
                    </span>
                  </div>
                );
              })}

              {priorityTasks.length === 0 && (
                <div className="p-4 bg-[#18181B]/50 border border-dashed border-[#27272A] rounded-xl text-center space-y-1.5">
                  <p className="text-xs font-semibold text-zinc-300">
                    No hay tareas clave planificadas anoche para hoy.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Puedes agregar tus focos prioritarios aquí abajo o en tu Bitácora Diaria.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Add input */}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newPriorityTaskText}
                onChange={(e) => setNewPriorityTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPriorityTask();
                  }
                }}
                placeholder="Agregar tarea clave para hoy..."
                className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={handleAddPriorityTask}
                className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-950" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {onNavigateToSports && (
            <div className="pt-2 border-t border-[#27272A]/70 flex justify-between items-center text-[11px] text-zinc-400">
              <span>¿Cerrando la jornada o registrando trading?</span>
              <button
                type="button"
                onClick={onNavigateToSports}
                className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Abrir Bitácora & Check-In</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Grid: Today's Agenda (8 cols) + Enfoque actual (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0 items-start">
        {/* Lado izquierdo/central (col-span-8): Today's Agenda */}
        <div className="lg:col-span-8 bg-[#121215] border border-[#27272A] rounded-2xl p-5 min-w-0 w-full overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Today's Agenda</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-zinc-300 border border-[#27272A]">
                  {capitalizedDayName}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                {data?.dayLoadLevel ? `Carga ${data.dayLoadLevel.toLowerCase()}` : 'Día flexible'}
              </span>
            </div>

            <div className="space-y-3.5 relative w-full min-w-0 overflow-hidden">
              {/* Continuous vertical timeline track line */}
              <div className="absolute left-[54px] sm:left-[58px] top-3 bottom-3 w-[2px] bg-zinc-800" />

              {dynamicAgendaItems.map((item: any, idx: number) => {
                const Icon = item.icon;
                const completed = isBlockCompleted(item);
                return (
                  <div key={item.id || idx} className="flex items-center gap-3 relative w-full min-w-0 overflow-hidden">
                    {/* Time */}
                    <span className="text-[11px] font-mono text-zinc-400 w-11 sm:w-12 shrink-0 whitespace-pre-line leading-tight text-right">
                      {item.time}
                    </span>

                    {/* Timeline Dot */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 border-[#121215] z-10 shrink-0 transition-colors ${
                        completed ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'bg-zinc-600'
                      }`}
                    />

                    {/* Content Card (fully contained, no overflow) */}
                    <div
                      className={`min-w-0 flex-1 w-full overflow-hidden flex items-center justify-between p-3 rounded-xl bg-[#18181B] border transition-all gap-3 ${
                        completed
                          ? 'border-[#27272A] opacity-75'
                          : 'border-[#27272A] hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            completed
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className={`text-xs font-bold truncate ${
                              completed ? 'text-zinc-400 line-through' : 'text-white'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded border font-mono ${
                            item.tag === 'ALTA'
                              ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                              : 'bg-[#121215] text-zinc-400 border-zinc-800'
                          }`}
                        >
                          {item.tag}
                        </span>

                        {/* Completion Toggle */}
                        <button
                          onClick={() => handleToggleBlock(item)}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            completed
                              ? 'bg-white border-white text-[#09090B]'
                              : 'bg-zinc-900/80 border-zinc-700 text-transparent hover:border-zinc-500 hover:text-zinc-400'
                          }`}
                          title={completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current stroke-none" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lado derecho (col-span-4): Foco Académico Guiado */}
        <div className="lg:col-span-4 bg-[#121215] border border-[#27272A] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden min-w-0 w-full shadow-sm space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-white" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Foco Académico Guiado
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-300 border border-[#27272A]">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                Repetición Espaciada
              </span>
            </div>

            {/* Guided Study Blocks */}
            <div className="space-y-3">
              {/* 1. Repaso del día anterior */}
              {guidedStudy?.pendingReviewTopic && (
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Repaso del día anterior
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-amber-300 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60">
                      Pendiente
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {guidedStudy.pendingReviewTopic.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      (Unidad {guidedStudy.pendingReviewTopic.unit?.unitNumber || 1} — {guidedStudy.pendingReviewTopic.unit?.subject?.name || 'Materia'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompleteGuidedStudy(guidedStudy.pendingReviewTopic.id, true)}
                    disabled={submittingSessionId === guidedStudy.pendingReviewTopic.id}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 text-zinc-950" />
                    <span>
                      {submittingSessionId === guidedStudy.pendingReviewTopic.id
                        ? 'Guardando Repaso...'
                        : 'Completar Repaso'}
                    </span>
                  </button>
                </div>
              )}

              {/* 2. Tema nuevo para hoy */}
              {guidedStudy?.nextNewTopic && (
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                      Tema nuevo para hoy
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-zinc-400 px-2 py-0.5 rounded bg-[#121215] border border-zinc-800">
                      Nuevo
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {guidedStudy.nextNewTopic.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      (Unidad {guidedStudy.nextNewTopic.unit?.unitNumber || 1} — {guidedStudy.nextNewTopic.unit?.subject?.name || 'Materia'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompleteGuidedStudy(guidedStudy.nextNewTopic.id, false)}
                    disabled={submittingSessionId === guidedStudy.nextNewTopic.id}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                    <span>
                      {submittingSessionId === guidedStudy.nextNewTopic.id
                        ? 'Guardando Sesión...'
                        : 'Completar Sesión'}
                    </span>
                  </button>
                </div>
              )}

              {/* Si todo el temario está al día */}
              {!guidedStudy?.pendingReviewTopic && !guidedStudy?.nextNewTopic && (
                <div className="p-4 rounded-xl bg-[#18181B] border border-dashed border-[#27272A] text-center space-y-2.5">
                  <Sparkles className="w-5 h-5 text-zinc-400 mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">
                    ¡Temario al día! Todo lo planificado está repasado y dominado.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToAcademic}
                    className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Ver Unidades en Académico
                  </button>
                </div>
              )}

              {/* Barra de avance en tiempo real de la materia en foco */}
              {activeSubject && (
                <div className="p-3.5 bg-[#18181B] rounded-xl border border-[#27272A] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-semibold truncate flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: activeSubject.color || '#FFFFFF' }}
                      />
                      Avance en {activeSubject.name}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {activeSubject.progress ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#121215] rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${activeSubject.progress ?? 0}%`,
                        backgroundColor: activeSubject.color || '#FFFFFF',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progreso de la Agenda del Día */}
            <div className="p-3 bg-[#18181B] rounded-xl border border-[#27272A] text-left space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Agenda Diaria</span>
                <span className="font-mono font-bold text-white">
                  {completedBlocksCount} / {totalBlocksCount} bloques
                </span>
              </div>
              <div className="w-full bg-[#121215] rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${dayProgressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Link / Footer */}
          <div className="pt-3 border-t border-[#27272A] w-full flex items-center justify-between text-[11px] text-zinc-400">
            <button
              type="button"
              onClick={onNavigateToAcademic}
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]"
            >
              <span>Ver Temario Completo</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer min-h-[44px] flex items-center gap-1"
            >
              <span>Calendario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lower Grid: Vista Semanal (8 cols) + Right Column (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Vista Semanal Definitiva (8 cols) */}
        <div className="lg:col-span-8 bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-4 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white truncate">Vista semanal (Horarios Definitivos)</h3>
            <span className="text-[11px] text-zinc-400 truncate shrink-0">Gimnasio 4x • Cursadas fijas • Sueño protegido</span>
          </div>

            {/* Days Columns */}
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-cols-7 gap-2 min-w-[620px] lg:min-w-0">
              {/* LUN */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 1
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  LUN{currentDayOfWeek === 1 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Paradigmas</p>
                    <p className="text-[9px] text-zinc-400 font-mono">08:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">16:00 - 18:15</p>
                  </div>
                </div>
              </div>

              {/* MAR */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 2
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  MAR{currentDayOfWeek === 2 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">10:30 - 12:45</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Consulta Diseño</p>
                    <p className="text-[9px] text-zinc-400 font-mono">17:30 - 18:30</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Rugby</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:30 salida</p>
                  </div>
                </div>
              </div>

              {/* MIÉ */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 3
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  MIÉ{currentDayOfWeek === 3 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Diseño</p>
                    <p className="text-[9px] text-zinc-400 font-mono">09:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Parad.</p>
                    <p className="text-[9px] text-zinc-400 font-mono">15:00 - 17:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Mercado</p>
                    <p className="text-[9px] text-zinc-400 font-mono">20:30</p>
                  </div>
                </div>
              </div>

              {/* JUE */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 4
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  JUE{currentDayOfWeek === 4 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Econ.</p>
                    <p className="text-[9px] text-zinc-400 font-mono">10:00 - 12:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">16:00 - 18:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Administración</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:00 - 23:00</p>
                  </div>
                </div>
              </div>

              {/* VIE */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 5
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  VIE{currentDayOfWeek === 5 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Paradigmas</p>
                    <p className="text-[9px] text-zinc-400 font-mono">08:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Economía</p>
                    <p className="text-[9px] text-zinc-400 font-mono">14:30 - 17:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">17:15 - 19:30</p>
                  </div>
                </div>
              </div>

              {/* SÁB */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 6
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  SÁB{currentDayOfWeek === 6 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Fútbol</p>
                    <p className="text-[9px] text-zinc-400 font-mono">09:30 - 12:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Libre / Amigos</p>
                    <p className="text-[9px] text-zinc-400">Mates & relax</p>
                  </div>
                </div>
              </div>

              {/* DOM */}
              <div className="space-y-2 text-center">
                <div
                  className={`text-[10px] font-bold font-mono py-1 ${
                    currentDayOfWeek === 0
                      ? 'text-zinc-950 bg-white rounded-md'
                      : 'text-zinc-400'
                  }`}
                >
                  DOM{currentDayOfWeek === 0 ? ' (Hoy)' : ''}
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Descanso</p>
                    <p className="text-[9px] text-zinc-400">Paseo / Mates</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18181B] border border-zinc-800 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Plan Semanal</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:30 - 20:15</p>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#27272A] text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-200" /> Cursada / Examen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400" /> Gimnasio (4x)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500" /> Deporte (Fútbol / Rugby)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600" /> Consulta Diseño
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-700" /> Descanso & Buffer
              </span>
            </div>
          </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 min-w-0 w-full">
          {/* Card 1: Próximos exámenes */}
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-4 min-w-0 w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Próximos exámenes</h3>
              <button
                onClick={onNavigateToAcademic}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {(data?.upcomingExams || []).map((exam: any) => {
                const isCritical = exam.daysRemaining <= 7;
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{exam.title}</p>
                        <p className="text-[11px] text-zinc-400">
                          {new Date(exam.date).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`text-sm font-extrabold font-mono block leading-tight ${
                          isCritical ? 'text-red-400' : 'text-zinc-200'
                        }`}
                      >
                        {exam.daysRemaining}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider ${
                          isCritical ? 'text-red-400' : 'text-zinc-500'
                        }`}
                      >
                        días
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Recomendaciones */}
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-3 min-w-0 w-full overflow-hidden">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-white">Directivas del Planning Engine</h3>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>Jueves: Gimnasio termina a las 18:00 (1h de margen antes de Sistemas a las 19:00).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>Viernes: Gimnasio arranca 17:15 (15 min de traslado post-Economía).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>Martes: Gimnasio temprano (10:30) para dejar libre la Consulta de Diseño (17:30).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>Miércoles: Día de alta flexibilidad sin cursada fija para avanzar temas pesados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500">•</span>
                <span>Sueño sagrado: Prohibido estudio profundo después de las 22:30.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-[#27272A]">
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                Ver todas las recomendaciones →
              </button>
            </div>
          </div>

          {/* Card 3: Progreso académico */}
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-4 min-w-0 w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Progreso académico</h3>
              <button
                onClick={onNavigateToAcademic}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Ver detalles
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Paradigmas (1P en 23 días)</span>
                  <span className="text-zinc-400 font-mono">65%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Economía (1P en 25 días)</span>
                  <span className="text-zinc-400 font-mono">48%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Diseño (Final en 36 días — 72% completado)</span>
                  <span className="text-zinc-400 font-mono">72%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
