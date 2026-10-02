import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../api/client';
import {
  X,
  Play,
  Pause,
  RotateCw,
  CheckCircle2,
  Zap,
  Sparkles,
} from 'lucide-react';

interface QuickFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickFocusModal: React.FC<QuickFocusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Focus target metadata
  const [subjectName, setSubjectName] = useState<string>('Materia Prioritaria');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [suggestedTopic, setSuggestedTopic] = useState<string>('Estudio y Práctica Profunda');
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [examId, setExamId] = useState<string | undefined>(undefined);

  // Timer states (default: 50 minutes)
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [timeLeft, setTimeLeft] = useState<number>(50 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Audio tone helper (Web Audio API)
  const playCompletionChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio not supported or blocked, ignore gracefully
    }
  };

  // Identify target subject and topic
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const identifyFocusTarget = async () => {
      try {
        setLoading(true);
        const [dashboard, subjects] = await Promise.all([
          api.getDashboard(new Date().toISOString()).catch(() => null),
          api.getSubjects(new Date().toISOString()).catch(() => []),
        ]);

        if (!isMounted) return;

        let selectedSubject: any = null;
        let identifiedTopic = 'Estudio y Consolidación Conceptual';
        let identifiedTaskId: string | undefined = undefined;
        let identifiedExamId: string | undefined = undefined;

        const now = new Date();

        // 1. Check for upcoming flexible study block in today's agenda
        const todayBlocks = dashboard?.todayBlocks || [];
        const flexibleStudyBlock = todayBlocks.find((b: any) => {
          const isStudy = b.category === 'ACADEMIA' || b.activity?.category === 'ACADEMIA';
          const isFlexible = b.flexibility === 'FLEXIBLE' || !b.isFixed;
          const isCurrentOrUpcoming = new Date(b.endTime) >= now;
          return isStudy && isFlexible && isCurrentOrUpcoming;
        }) || todayBlocks.find((b: any) => b.category === 'ACADEMIA' && new Date(b.endTime) >= now);

        if (flexibleStudyBlock && subjects.length > 0) {
          // Attempt to match block to a subject
          selectedSubject =
            subjects.find((s: any) => s.id === flexibleStudyBlock.subjectId) ||
            subjects.find((s: any) =>
              flexibleStudyBlock.title?.toLowerCase().includes(s.name?.toLowerCase())
            ) ||
            subjects.find((s: any) =>
              flexibleStudyBlock.justification?.toLowerCase().includes(s.name?.toLowerCase())
            );

          if (flexibleStudyBlock.title) {
            identifiedTopic = flexibleStudyBlock.title.replace(/^Estudio Profundo:\s*/i, '');
          }
          if (flexibleStudyBlock.academicTaskId) {
            identifiedTaskId = flexibleStudyBlock.academicTaskId;
          }
        }

        // 2. Fallback: select subject with highest PriorityScore
        if (!selectedSubject && subjects.length > 0) {
          const sortedSubjects = [...subjects].sort(
            (a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0)
          );
          selectedSubject = sortedSubjects[0];
        }

        if (selectedSubject) {
          setSubjectName(selectedSubject.name);
          setSubjectId(selectedSubject.id);

          // Find priority task if not yet set
          if (!identifiedTaskId && selectedSubject.academicTasks && selectedSubject.academicTasks.length > 0) {
            const pendingTask = selectedSubject.academicTasks.find(
              (t: any) => t.status !== 'COMPLETADA'
            );
            if (pendingTask) {
              identifiedTopic = pendingTask.title;
              identifiedTaskId = pendingTask.id;
              if (pendingTask.examId) identifiedExamId = pendingTask.examId;
            }
          }

          // Or find priority topic
          if (
            identifiedTopic === 'Estudio y Consolidación Conceptual' &&
            selectedSubject.topics &&
            selectedSubject.topics.length > 0
          ) {
            const priorityTopic =
              selectedSubject.topics.find((t: any) => t.status === 'EN_PROGRESO') ||
              selectedSubject.topics.find((t: any) => t.status === 'REPASAR') ||
              selectedSubject.topics.find((t: any) => t.status === 'NO_INICIADO');
            if (priorityTopic) {
              identifiedTopic = priorityTopic.title;
            }
          }

          // Or nearest exam preparation
          if (selectedSubject.exams && selectedSubject.exams.length > 0) {
            const nextExam = selectedSubject.exams[0];
            identifiedExamId = nextExam.id;
            if (identifiedTopic === 'Estudio y Consolidación Conceptual') {
              identifiedTopic = `Preparación intensiva: ${nextExam.title}`;
            }
          }

          setSuggestedTopic(identifiedTopic);
          setTaskId(identifiedTaskId);
          setExamId(identifiedExamId);
        }
      } catch (err) {
        console.error('Error identificando objetivo de foco:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    identifyFocusTarget();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset timer on duration change or modal open
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(durationMinutes * 60);
      setIsRunning(true); // Start immediately on open for rapid immersion
      setSessionCompleted(false);
    }
  }, [isOpen, durationMinutes]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Timer countdown loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setSessionCompleted(true);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = durationMinutes * 60 - timeLeft;
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const progressPercent = Math.min(
    100,
    Math.round(((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100)
  );

  const handleRegisterCompleted = async () => {
    if (!subjectId) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      // Minutes logged: if completed or almost done, log target duration; else log elapsed time
      const minutesToLog = sessionCompleted || elapsedMinutes >= durationMinutes - 2
        ? durationMinutes
        : elapsedMinutes;

      await api.logFocusSession(subjectId, {
        minutes: minutesToLog,
        taskId,
        examId,
        notes: `Modo Foco Inmediato: ${suggestedTopic}`,
      });

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Error registrando sesión de foco:', err);
      // Fallback: still close and refresh
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    setSessionCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col justify-between p-4 sm:p-12 animate-in fade-in duration-200 select-none overflow-hidden h-[100dvh] w-screen pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/[0.03] blur-[140px] pointer-events-none rounded-full" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-zinc-300 text-xs font-semibold tracking-wider uppercase font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <Zap className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Modo Foco Inmediato</span>
          <span className="sm:hidden font-bold">Foco Lite</span>
        </div>

        {/* Preset duration buttons */}
        <div className="flex items-center gap-1 bg-[#121215] border border-[#27272A] rounded-xl p-1">
          {[25, 50, 90].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setDurationMinutes(m);
                setTimeLeft(m * 60);
                setIsRunning(false);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                durationMinutes === m
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181B] border border-[#27272A] transition-colors cursor-pointer shrink-0"
          title="Cerrar modo foco (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Central Content: Minimalist Focus Target & Centered Timer */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto w-full px-2">
        {/* Subject & Suggested Topic */}
        <div className="space-y-2.5 animate-in fade-in duration-300">
          <span className="text-[11px] sm:text-xs uppercase tracking-widest text-zinc-500 font-bold block font-mono">
            Materia Prioritaria
          </span>
          <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
            {loading ? 'Identificando prioridad...' : subjectName}
          </h1>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121215] border border-[#27272A] text-xs sm:text-sm text-zinc-300 font-medium max-w-full">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate max-w-[240px] sm:max-w-[480px]">
              {loading ? 'Cargando tema sugerido...' : suggestedTopic}
            </span>
          </div>
        </div>

        {/* Minimalist Centered Countdown Display */}
        <div className="space-y-5 w-full">
          <div className="font-mono text-6xl sm:text-9xl font-black tracking-wider sm:tracking-widest text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.08)] select-none">
            {formatTimer(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-64 sm:w-80 h-2 bg-[#18181B] rounded-full mx-auto overflow-hidden border border-[#27272A]">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Large Tactile Timer Controls (Play / Pause / Reset) */}
          <div className="flex items-center justify-center gap-5 pt-3">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white text-zinc-950 hover:bg-[#E4E4E7] flex items-center justify-center transition-all shadow-xl active:scale-90 cursor-pointer"
              title={isRunning ? 'Pausar' : 'Iniciar'}
            >
              {isRunning ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 ml-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#121215] border border-[#27272A] hover:border-zinc-500 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action: Register Completed Session */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-2.5 px-2">
        <button
          type="button"
          onClick={handleRegisterCompleted}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-sm sm:text-base font-bold bg-white hover:bg-[#E4E4E7] text-zinc-950 shadow-xl shadow-white/5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5 text-zinc-950" />
          <span>{submitting ? 'Registrando progreso...' : 'Registrar sesión completada'}</span>
        </button>

        <p className="text-[11px] text-zinc-500 font-mono text-center">
          {sessionCompleted
            ? '¡Tiempo completado! Guarda para sumar el tiempo al avance de la materia.'
            : `Suma ${elapsedMinutes > 0 ? elapsedMinutes : durationMinutes} min al progreso de la materia y calendario.`}
        </p>
      </div>
    </div>
  );
};

export default QuickFocusModal;
