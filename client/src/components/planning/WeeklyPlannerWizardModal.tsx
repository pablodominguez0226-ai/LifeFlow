import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Dumbbell,
  Plane,
  TrendingUp,
  BookOpen,
  Zap,
  RotateCcw,
  ShieldAlert,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeeklyPlannerWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ClassItem {
  id: string;
  day: string;
  dayOfWeek: number;
  time: string;
  subject: string;
  active: boolean;
  isExam?: boolean;
}

export const WeeklyPlannerWizardModal: React.FC<WeeklyPlannerWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha del lunes de la semana
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return format(monday, 'yyyy-MM-dd');
  });

  // Datos de la base de datos (Pre-check)
  const [examsThisWeek, setExamsThisWeek] = useState<any[]>([]);
  const [upcomingExams35Days, setUpcomingExams35Days] = useState<any[]>([]);

  // Paso 1: Cursados & Evento Especial
  const [classes, setClasses] = useState<ClassItem[]>([
    {
      id: 'class-lun',
      day: 'Lunes',
      dayOfWeek: 1,
      time: '08:00 - 12:00',
      subject: 'Paradigmas',
      active: true,
    },
    {
      id: 'class-jue',
      day: 'Jueves',
      dayOfWeek: 4,
      time: '19:30 - 22:30',
      subject: 'Cursado Noche',
      active: true,
    },
    {
      id: 'class-vie',
      day: 'Viernes',
      dayOfWeek: 5,
      time: '08:00 - 12:00',
      subject: 'Facultad / Parcial',
      active: true,
      isExam: true,
    },
  ]);

  const [hasSpecialEvent, setHasSpecialEvent] = useState(false);
  const [specialEvent, setSpecialEvent] = useState({
    date: '2026-11-06',
    startTime: '13:00',
    endTime: '23:00',
    reason: 'Viaje a Malargüe',
  });

  // Paso 2: Hábitos y Entrenamiento
  // Gym: Lun (1), Mar (2), Jue (4), Vie (5)
  const [gymDays, setGymDays] = useState<number[]>([1, 2, 4, 5]);
  // Running: Mié (3), Sáb (6), Dom (0)
  const [runningDays, setRunningDays] = useState<number[]>([3, 6, 0]);
  // Bloques fijos
  const [fixedBlocks, setFixedBlocks] = useState({
    trading: true, // 10:00 AM
    reading: true, // 22:30 Lectura 30m
    bots: true,    // 17:30 - 19:00 Sistemas, Bots & IA
  });

  // Cargar datos reales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      loadPreCheckData();
    }
  }, [isOpen]);

  const loadPreCheckData = async () => {
    try {
      setLoading(true);
      const res = await api.getPlannerPreCheck(startDate);

      if (res) {
        if (res.startDate) setStartDate(res.startDate);
        setExamsThisWeek(res.examsThisWeek || []);
        setUpcomingExams35Days(res.upcomingExams35Days || []);

        // Mapear defaultClasses
        if (Array.isArray(res.defaultClasses) && res.defaultClasses.length > 0) {
          const mappedClasses: ClassItem[] = res.defaultClasses.map((c: any) => {
            const dayOfWeek = c.day === 'Lunes' ? 1 : c.day === 'Jueves' ? 4 : 5;
            const hasExam = (res.examsThisWeek || []).some((e: any) => {
              const d = new Date(e.date).getDay();
              return d === dayOfWeek;
            });
            return {
              id: c.id,
              day: c.day,
              dayOfWeek,
              time: c.time,
              subject: c.subject,
              active: c.active ?? true,
              isExam: hasExam || c.day === 'Viernes',
            };
          });
          setClasses(mappedClasses);
        }

        if (Array.isArray(res.gymDays) && res.gymDays.length > 0) {
          setGymDays(res.gymDays);
        }

        if (Array.isArray(res.runningDays) && res.runningDays.length > 0) {
          setRunningDays(res.runningDays);
        }
      }
    } catch (e: any) {
      console.error('Error in loadPreCheckData:', e);
      setError('No se pudo cargar la pre-auditoría. Usando valores predeterminados.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle de un día de cursado
  const toggleClassActive = (dayOfWeek: number) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.dayOfWeek === dayOfWeek) {
          return { ...c, active: !c.active };
        }
        return c;
      })
    );
  };

  // Toggle de día de Gym
  const toggleGymDay = (day: number) => {
    setGymDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Sugerencia 1-clic: pasar gym a miércoles
  const moveGymToWednesday = () => {
    setGymDays((prev) => {
      const next = prev.filter((d) => d !== 5); // Quitar viernes si estaba
      if (!next.includes(3)) next.push(3);       // Añadir miércoles
      return next.sort((a, b) => a - b);
    });
  };

  // Toggle de día de Running
  const toggleRunningDay = (day: number) => {
    setRunningDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Días de la semana para selectores
  const weekDays = [
    { num: 1, label: 'Lun', name: 'Lunes' },
    { num: 2, label: 'Mar', name: 'Martes' },
    { num: 3, label: 'Mié', name: 'Miércoles' },
    { num: 4, label: 'Jue', name: 'Jueves' },
    { num: 5, label: 'Vie', name: 'Viernes' },
    { num: 6, label: 'Sáb', name: 'Sábado' },
    { num: 0, label: 'Dom', name: 'Domingo' },
  ];

  // Cálculo reactivo de bloques de estudio del Motor Inteligente (Paso 3)
  const studyPlan = useMemo(() => {
    const isLunFree = classes.find((c) => c.dayOfWeek === 1)?.active === false;
    const isGymWed = gymDays.includes(3);

    const blocks: Array<{
      day: string;
      subject: string;
      time: string;
      duration: string;
      hours: number;
      badge: string;
      note?: string;
    }> = [];

    // Lunes: Paradigmas (examen inminente en viernes)
    if (isLunFree) {
      blocks.push({
        day: 'Lunes',
        subject: 'Paradigmas',
        time: '08:30 - 10:30',
        duration: '2.0h',
        hours: 2.0,
        badge: 'Mañana libre (Feriado)',
        note: 'Fundamentos y resolución de dudas',
      });
    } else {
      blocks.push({
        day: 'Lunes',
        subject: 'Paradigmas',
        time: '19:30 - 21:00',
        duration: '1.5h',
        hours: 1.5,
        badge: 'Vespertino',
        note: 'Resolución de parciales anteriores',
      });
    }

    // Martes: 2h Paradigmas + 1.5h Economía
    blocks.push({
      day: 'Martes',
      subject: 'Paradigmas',
      time: '08:00 - 10:00',
      duration: '2.0h',
      hours: 2.0,
      badge: 'Bloque Matutino',
      note: 'Modelado lógico & ejercicios tipo examen',
    });
    blocks.push({
      day: 'Martes',
      subject: 'Economía',
      time: '11:30 - 13:00',
      duration: '1.5h',
      hours: 1.5,
      badge: 'Estudio Preventivo',
      note: 'Unidades de examen próximo (en 9 días)',
    });

    // Miércoles: 2h Paradigmas (repaso final) + 1.5h Economía
    blocks.push({
      day: 'Miércoles',
      subject: 'Paradigmas',
      time: '08:00 - 10:00',
      duration: '2.0h',
      hours: 2.0,
      badge: 'Repaso Crítico Pre-Parcial',
      note: 'Blindaje de conceptos clave',
    });
    blocks.push({
      day: 'Miércoles',
      subject: 'Economía',
      time: isGymWed ? '11:30 - 13:00' : '15:00 - 16:30',
      duration: '1.5h',
      hours: 1.5,
      badge: isGymWed ? 'Mediodía (Gym a la tarde)' : 'Tarde',
      note: 'Ejercicios prácticos e instrumental',
    });

    // Jueves: 1.5h Economía antes del cursado noche
    blocks.push({
      day: 'Jueves',
      subject: 'Economía',
      time: '15:00 - 16:30',
      duration: '1.5h',
      hours: 1.5,
      badge: 'Siesta Productiva',
      note: 'Consolidación previa a cursado noche',
    });

    // Viernes: 0h estudio (Parcial a la mañana y Viaje a la tarde)

    const totalHours = blocks.reduce((acc, curr) => acc + curr.hours, 0);
    const paradighmasHours = blocks
      .filter((b) => b.subject === 'Paradigmas')
      .reduce((acc, curr) => acc + curr.hours, 0);
    const economiaHours = blocks
      .filter((b) => b.subject === 'Economía')
      .reduce((acc, curr) => acc + curr.hours, 0);

    return {
      blocks,
      totalHours,
      paradighmasHours,
      economiaHours,
    };
  }, [classes, gymDays, hasSpecialEvent, specialEvent]);

  // Aplicar Plan Semanal a la Agenda
  const handleApplyPlan = async () => {
    try {
      setApplying(true);
      setError(null);

      const payload = {
        startDate,
        classesConfig: classes.map((c) => ({
          id: c.id,
          day: c.day,
          dayOfWeek: c.dayOfWeek,
          time: c.time,
          subject: c.subject,
          active: c.active,
        })),
        gymDays,
        runningDays,
        specialEvent: hasSpecialEvent ? specialEvent : null,
        fixedBlocks,
      };

      await api.generateWeeklyPlanner(payload);
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Error applying weekly plan:', e);
      setError(e.message || 'Error al aplicar el plan semanal.');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12161f] border border-[#30363d] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]">
        {/* Header Modal con Tabs de Pasos */}
        <div className="px-6 py-5 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e50914]/15 border border-[#e50914]/40 flex items-center justify-center text-[#e50914] shadow-lg shadow-[#e50914]/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#e50914]">
                  Asistente Interactivo
                </span>
                <span className="text-[10px] font-bold text-zinc-500">• Base de Datos Real</span>
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-white">
                Planificación Semanal Inteligente
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progreso / Tabs de Pasos */}
        <div className="grid grid-cols-3 border-b border-[#30363d] bg-[#161b22] text-xs font-bold shrink-0">
          <button
            onClick={() => setStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 1
                ? 'border-[#e50914] text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 1 ? 'bg-[#e50914] text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              1
            </span>
            <span className="truncate">Eventos & Cursado</span>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 2
                ? 'border-[#e50914] text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 2 ? 'bg-[#e50914] text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              2
            </span>
            <span className="truncate">Hábitos & Gym</span>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 3
                ? 'border-[#e50914] text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 3 ? 'bg-[#e50914] text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              3
            </span>
            <span className="truncate">Motor de Estudio</span>
          </button>
        </div>

        {/* Mensaje de error si ocurre */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Contenido desplazable del Wizard */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RotateCcw className="w-7 h-7 text-[#e50914] animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">
                Conectando con la base de datos y auditando fechas...
              </p>
            </div>
          ) : (
            <>
              {/* PASO 1: EVENTOS CLAVE Y CURSADO */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* Tarjeta destacada de exámenes detectados */}
                  {examsThisWeek.length > 0 ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#e50914]/20 via-[#161b22] to-[#161b22] border-2 border-[#e50914]/60 relative overflow-hidden shadow-lg shadow-[#e50914]/15">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#e50914] flex items-center justify-center text-white shrink-0 shadow-md">
                            <Flame className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#e50914] bg-[#e50914]/20 px-2 py-0.5 rounded-full border border-[#e50914]/40">
                                Examen Inminente Detectado
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 font-bold">
                                En {examsThisWeek[0].daysRemaining} días
                              </span>
                            </div>
                            <h3 className="text-base font-black text-white mt-1">
                              {examsThisWeek[0].subject} — {examsThisWeek[0].type}
                            </h3>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-[#e50914] text-white shadow-sm shrink-0">
                          Viernes 08:00 • Inamovible
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                        Este examen está programado en la base de datos real. El motor blindará la mañana
                        del viernes y distribuirá automáticamente entre 5 y 6 horas de estudio previo
                        los días Lunes, Martes y Miércoles.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#30363d] flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">Sin exámenes en la semana</span>
                        <p className="text-[11px] text-zinc-400">
                          La distribución se enfocará en estudio preventivo y hábitos regulares.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Alerta de exámenes a 35 días */}
                  {upcomingExams35Days.length > 1 && (
                    <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Próximo examen:&nbsp;
                          <strong className="text-white">
                            {upcomingExams35Days.find((e) => e.daysRemaining > 7)?.subject || 'Economía'}
                          </strong>
                          &nbsp;(en {upcomingExams35Days.find((e) => e.daysRemaining > 7)?.daysRemaining || 9} días)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 font-mono">
                        Carga Preventiva 4.5h
                      </span>
                    </div>
                  )}

                  {/* Lista de cursados con toggles interactivos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        Cursados de la Semana
                      </h4>
                      <span className="text-[11px] text-zinc-500">Alterna si es feriado o cursas</span>
                    </div>

                    <div className="space-y-2.5">
                      {classes.map((cls) => (
                        <div
                          key={cls.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            cls.isExam
                              ? 'bg-[#161b22] border-[#e50914]/40'
                              : cls.active
                              ? 'bg-[#161b22] border-[#30363d]'
                              : 'bg-[#0d1117]/60 border-zinc-800 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                cls.isExam
                                  ? 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/40'
                                  : cls.active
                                  ? 'bg-zinc-800 text-white'
                                  : 'bg-zinc-900 text-zinc-600'
                              }`}
                            >
                              {cls.day.slice(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">{cls.day}</span>
                                <span className="text-[11px] font-mono text-zinc-400 font-bold">
                                  ({cls.time})
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 font-medium">
                                {cls.isExam ? 'Facultad / Parcial Asignado' : cls.subject}
                              </p>
                            </div>
                          </div>

                          {cls.isExam ? (
                            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/40">
                              Parcial Asignado
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleClassActive(cls.dayOfWeek)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                cls.active
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                              }`}
                            >
                              {cls.active ? 'Cursas' : 'Feriado / Libre'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección de Evento Especial / Viaje */}
                  <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">
                          Evento Especial / Viaje en la Semana
                        </span>
                      </div>
                      <button
                        onClick={() => setHasSpecialEvent(!hasSpecialEvent)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          hasSpecialEvent
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {hasSpecialEvent ? 'Activado' : '+ Agregar Viaje'}
                      </button>
                    </div>

                    {hasSpecialEvent && (
                      <div className="pt-2 space-y-3 border-t border-[#30363d] animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              Fecha
                            </label>
                            <input
                              type="date"
                              value={specialEvent.date}
                              onChange={(e) =>
                                setSpecialEvent({ ...specialEvent, date: e.target.value })
                              }
                              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              Hora Inicio
                            </label>
                            <input
                              type="time"
                              value={specialEvent.startTime}
                              onChange={(e) =>
                                setSpecialEvent({ ...specialEvent, startTime: e.target.value })
                              }
                              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              Motivo
                            </label>
                            <input
                              type="text"
                              value={specialEvent.reason}
                              onChange={(e) =>
                                setSpecialEvent({ ...specialEvent, reason: e.target.value })
                              }
                              placeholder="Ej: Viaje a Malargüe"
                              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          <span>
                            Bloquea automáticamente la tarde/noche de ese día (desde las{' '}
                            {specialEvent.startTime}) para no asignar estudio ni cursados pesados.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 2: AJUSTE DE HÁBITOS Y ENTRENAMIENTO */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* Visualizador interactivo de Gym */}
                  <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            Sesiones de Gimnasio (15:00 - 17:00)
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            Frecuencia objetivo: 4 sesiones semanales
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {gymDays.length} días activos
                      </span>
                    </div>

                    {/* Días de Gym en botones interactivos */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {weekDays.map((d) => {
                        const active = gymDays.includes(d.num);
                        return (
                          <button
                            key={d.num}
                            onClick={() => toggleGymDay(d.num)}
                            className={`py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              active
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : 'bg-[#0d1117] text-zinc-400 border border-[#30363d] hover:border-zinc-500 hover:text-white'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-black">{d.label}</span>
                            <span className="text-[9px] font-mono">{active ? 'Gym' : 'Libre'}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sugerencia inteligente 1-clic si desmarca Viernes */}
                    {!gymDays.includes(5) && !gymDays.includes(3) && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2.5 text-xs text-amber-200">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            Desmarcaste el Viernes (por viaje/feriado).&nbsp;
                            <strong>¿Pasar sesión de Gym al Miércoles?</strong>
                          </span>
                        </div>
                        <button
                          onClick={moveGymToWednesday}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all shrink-0 shadow-sm"
                        >
                          Mover a Miércoles en 1 clic
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Salir a Correr */}
                  <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <h4 className="text-xs font-bold text-white">Salir a Correr (Running)</h4>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">
                        {runningDays.length} días programados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { day: 3, label: 'Miércoles', time: '18:00 - 19:00' },
                        { day: 6, label: 'Sábado', time: '09:00 - 10:00' },
                        { day: 0, label: 'Domingo', time: '09:00 - 10:00' },
                      ].map((item) => {
                        const active = runningDays.includes(item.day);
                        return (
                          <div
                            key={item.day}
                            onClick={() => toggleRunningDay(item.day)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              active
                                ? 'bg-[#0d1117] border-orange-500/50 text-white'
                                : 'bg-[#0d1117]/50 border-zinc-800 text-zinc-500'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className="text-[10px] font-mono text-zinc-400">{item.time}</span>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                active
                                  ? 'bg-orange-500 border-orange-500 text-black'
                                  : 'border-zinc-700'
                              }`}
                            >
                              {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloques Fijos Preservados */}
                  <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider text-zinc-400">
                      Confirmación de Bloques Fijos
                    </h4>

                    <div className="space-y-2">
                      {/* Trading */}
                      <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <div>
                            <span className="text-xs font-bold text-white">Trading 10:00 AM</span>
                            <p className="text-[10px] text-zinc-400">
                              Activo aun en cursado (Lunes a Viernes 10:00 - 11:00)
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={fixedBlocks.trading}
                          onChange={(e) =>
                            setFixedBlocks({ ...fixedBlocks, trading: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#e50914] cursor-pointer"
                        />
                      </div>

                      {/* Sistemas & Bots */}
                      <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="text-xs font-bold text-white">
                              Sistemas Propios, Bots & IA
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              17:30 - 19:00 (Lunes a Jueves)
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={fixedBlocks.bots}
                          onChange={(e) =>
                            setFixedBlocks({ ...fixedBlocks, bots: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#e50914] cursor-pointer"
                        />
                      </div>

                      {/* Lectura */}
                      <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="text-xs font-bold text-white">
                              Lectura de Libros (30 min)
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              22:30 - 23:00 (Hábito nocturno diario)
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={fixedBlocks.reading}
                          onChange={(e) =>
                            setFixedBlocks({ ...fixedBlocks, reading: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#e50914] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: MOTOR DE ESTUDIO INTELIGENTE */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* Resumen de Carga y Horas Calculadas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Estudio Total Calculado
                      </span>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white">
                          {studyPlan.totalHours.toFixed(1)}h
                        </span>
                        <span className="text-xs text-zinc-500 font-bold">/ semana</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#e50914]/10 border border-[#e50914]/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#e50914] uppercase tracking-wider">
                          Paradigmas (2 días)
                        </span>
                        <span className="text-[9px] bg-[#e50914] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                          Inminente
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">
                          {studyPlan.paradighmasHours.toFixed(1)}h
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          (Bloques de 1.5h - 2h)
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                          Economía (9 días)
                        </span>
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">
                          Preventivo
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">
                          {studyPlan.economiaHours.toFixed(1)}h
                        </span>
                        <span className="text-[10px] text-zinc-400">(Bloques de 1.5h)</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen cronológico de los bloques calculados */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        Cronograma de Bloques Propuestos
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        {studyPlan.blocks.length} bloques sin sobrecarga
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {studyPlan.blocks.map((block, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-12 text-center text-xs font-black px-2 py-1 rounded-lg bg-zinc-800 text-white font-mono">
                              {block.day.slice(0, 3)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {block.subject}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-amber-400">
                                  {block.time} ({block.duration})
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400">{block.note}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700 shrink-0">
                            {block.badge}
                          </span>
                        </div>
                      ))}

                      {/* Viernes protegido */}
                      <div className="p-3 rounded-xl bg-[#e50914]/10 border border-[#e50914]/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-center text-xs font-black px-2 py-1 rounded-lg bg-[#e50914]/30 text-[#e50914] font-mono">
                            Vie
                          </span>
                          <div>
                            <span className="font-bold text-white">
                              Viernes: 08:00 Parcial Paradigmas • 13:00 Viaje a Malargüe
                            </span>
                            <p className="text-[10px] text-zinc-400">
                              0 horas de estudio pesado asignadas (blindado por viaje y descanso).
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-black text-[#e50914] px-2 py-0.5 rounded bg-[#e50914]/20">
                          Blindado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              Continuar al Paso {step + 1} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleApplyPlan}
              disabled={applying}
              className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#e50914]/30 disabled:opacity-60 cursor-pointer"
            >
              {applying ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Aplicando a la Agenda...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Aplicar Plan a la Agenda Semanal
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlannerWizardModal;