import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Moon,
  RotateCw,
  Plus,
  X,
  Filter,
} from 'lucide-react';
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, fetchApi } from '../../api/client';

export interface CalendarSlot {
  id: string;
  title: string;
  category: string;
  subject: string | null;
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
  status: string;
  isAutoSlot?: boolean;
}

interface CalendarioPageProps {
  onOpenReplan?: (taskId: string) => void;
  onOpenNewActivity?: () => void;
  onOpenWeeklyGenerator?: () => void;
}

export const CalendarioPage: React.FC<CalendarioPageProps> = ({
  onOpenReplan,
  onOpenNewActivity,
  onOpenWeeklyGenerator,
}) => {
  const [currentMonday, setCurrentMonday] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const daysOfWeek = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(currentMonday, offset)),
    [currentMonday]
  );

  // Helper seguro para parsear fechas y prevenir "Invalid Date"
  const safeParseDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startIso = currentMonday.toISOString();
      const endIso = addDays(currentMonday, 7).toISOString();

      let fetchedSlots: CalendarSlot[] = [];

      // 1. Intentar GET /api/planner/current-week
      try {
        const weekData = await api.getCurrentWeek();
        const rawWeekSlots =
          weekData?.slots ||
          weekData?.weeklySlots ||
          (Array.isArray(weekData) ? weekData : []);
        if (Array.isArray(rawWeekSlots) && rawWeekSlots.length > 0) {
          fetchedSlots = rawWeekSlots;
        }
      } catch (err) {
        console.warn('api.getCurrentWeek fallback', err);
      }

      // 2. Si no hay slots, intentar GET /api/calendar
      if (fetchedSlots.length === 0) {
        try {
          const calData = await api.getCalendar(startIso, endIso);
          const rawCalSlots =
            calData?.slots ||
            calData?.weeklySlots ||
            (Array.isArray(calData) ? calData : []);
          if (Array.isArray(rawCalSlots) && rawCalSlots.length > 0) {
            fetchedSlots = rawCalSlots;
          }
        } catch (err) {
          console.warn('api.getCalendar fallback', err);
        }
      }

      // 3. Si aún está vacío, intentar GET /api/dashboard
      if (fetchedSlots.length === 0) {
        try {
          const dashData = await api.getDashboard();
          const rawDashSlots =
            dashData?.slots ||
            dashData?.weeklySlots ||
            dashData?.todayAgenda ||
            (Array.isArray(dashData) ? dashData : []);
          if (Array.isArray(rawDashSlots)) {
            fetchedSlots = rawDashSlots;
          }
        } catch (err) {
          console.warn('api.getDashboard fallback', err);
        }
      }

      // Sanitizar la lista de slots asegurando null-safety
      const sanitized = (fetchedSlots || []).map((slot: any) => ({
        id: String(slot.id || `slot-${Math.random()}`),
        title: String(slot.title || 'Actividad Planificada'),
        category: String(slot.category || 'PERSONAL'),
        subject: slot.subject ? String(slot.subject) : null,
        start: slot.start || slot.startTime || new Date().toISOString(),
        end: slot.end || slot.endTime || new Date().toISOString(),
        status: String(slot.status || 'PENDING'),
        isAutoSlot: Boolean(slot.isAutoSlot),
      }));

      setSlots(sanitized);
    } catch (err) {
      console.error('Error cargando slots del calendario:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentMonday]);

  const handlePrevWeek = () => {
    setCurrentMonday((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => addDays(prev, 7));
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleToggleComplete = async (slot: CalendarSlot) => {
    try {
      const isCompleted = slot.status === 'COMPLETED' || slot.status === 'COMPLETADO';
      const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';

      // Mutación optimista local
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
      );
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      await fetchApi(`/calendar/block/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});
    } catch (err) {
      console.error('Error al alternar estado de slot:', err);
    }
  };

  // Filtrado por categoría
  const filteredSlots = useMemo(() => {
    if (categoryFilter === 'ALL') return slots;
    return slots.filter((slot) => {
      const cat = slot.category?.toUpperCase();
      if (categoryFilter === 'ACADEMIA') {
        return cat === 'ACADEMIC_CLASS' || cat === 'STUDY_DEEP' || cat === 'ACADEMIA';
      }
      if (categoryFilter === 'DEPORTE') {
        return cat === 'GYM' || cat === 'DEPORTE';
      }
      return cat === categoryFilter;
    });
  }, [slots, categoryFilter]);

  // Formateador seguro de horarios HH:mm
  const formatSlotTime = (slot: CalendarSlot): string => {
    const sDate = safeParseDate(slot.start || slot.startTime);
    const eDate = safeParseDate(slot.end || slot.endTime);
    const startStr = sDate ? format(sDate, 'HH:mm') : '--:--';
    const endStr = eDate ? format(eDate, 'HH:mm') : '--:--';
    return `${startStr} - ${endStr}`;
  };

  const getCategoryTheme = (category: string) => {
    const cat = (category || '').toUpperCase();
    switch (cat) {
      case 'ACADEMIC_CLASS':
      case 'ACADEMIA':
        return {
          card: 'bg-[#18181D] text-zinc-100 border-[#2A2A33] hover:border-zinc-500 border-l-2 border-l-[#E50914]',
          badge: 'bg-[#E50914]/15 text-[#ff7b72] border-[#E50914]/40',
          label: 'Cursado',
        };
      case 'STUDY_DEEP':
        return {
          card: 'bg-[#18181D] text-zinc-100 border-[#2A2A33] hover:border-zinc-500 border-l-2 border-l-[#f85149]',
          badge: 'bg-red-950/60 text-red-300 border-red-800/50',
          label: 'Estudio Profundo',
        };
      case 'TRADING':
        return {
          card: 'bg-[#18181D] text-zinc-100 border-[#2A2A33] hover:border-zinc-500 border-l-2 border-l-[#10b981]',
          badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
          label: 'Trading',
        };
      case 'GYM':
      case 'DEPORTE':
        return {
          card: 'bg-[#18181D] text-zinc-100 border-[#2A2A33] hover:border-zinc-500 border-l-2 border-l-[#3b82f6]',
          badge: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
          label: 'Entrenamiento',
        };
      case 'READING':
        return {
          card: 'bg-[#18181D] text-zinc-100 border-[#2A2A33] hover:border-zinc-500 border-l-2 border-l-[#eab308]',
          badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
          label: 'Lectura',
        };
      case 'REST':
      case 'PERSONAL':
      default:
        return {
          card: 'bg-[#141416] text-zinc-300 border-[#23232A] hover:border-zinc-600 border-l-2 border-l-zinc-500',
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          label: 'Rutina Personal',
        };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 bg-[#09090B] text-white pb-24">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Agenda & Calendario Semanal
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#161b22] text-zinc-300 border border-[#30363d]">
              {format(currentMonday, "'Semana del' dd 'de' MMMM", { locale: es })}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visualización integrada de clases, bloques de estudio profundo, trading y descanso protegido.
          </p>
        </div>

        {/* Week Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg hover:bg-[#21262d] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Semana Actual
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg hover:bg-[#21262d] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={loadCalendarData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161b22] text-zinc-300 border border-[#30363d] hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Refrescar datos"
          >
            <RotateCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {onOpenNewActivity && (
            <button
              onClick={onOpenNewActivity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#21262d] text-white border border-[#30363d] hover:bg-[#30363d] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Actividad</span>
            </button>
          )}

          {onOpenWeeklyGenerator && (
            <button
              onClick={onOpenWeeklyGenerator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E50914] hover:bg-[#b80710] text-white border border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.35)] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Generar propuesta semanal</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filtro:
        </span>
        {[
          { id: 'ALL', label: 'Todo' },
          { id: 'ACADEMIA', label: 'Facultad & Estudio' },
          { id: 'TRADING', label: 'Trading' },
          { id: 'DEPORTE', label: 'Gimnasio & Run' },
          { id: 'READING', label: 'Lectura' },
          { id: 'REST', label: 'Descanso' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setCategoryFilter(f.id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === f.id
                ? 'bg-white text-zinc-950 shadow-sm font-bold'
                : 'bg-[#161b22] text-zinc-400 border border-[#30363d] hover:text-white hover:border-zinc-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sleep Restriction Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121215] border border-[#27272A] rounded-xl text-xs text-zinc-300">
        <span className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-zinc-400" />
          <span>
            <strong className="text-white">Restricción Dura de Sueño:</strong> Ventana 00:00 - 06:30
            sagrada (7.5h de sueño protegidas). Prohibido estudio cognitivo profundo después de las 22:30.
          </span>
        </span>
        <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider hidden sm:inline">
          Protección Activa
        </span>
      </div>

      {/* SKELETON / LOADER STATE */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[500px]">
          {daysOfWeek.map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col bg-[#121215] border border-[#27272A] rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="p-3 bg-[#18181B] border-b border-[#27272A] space-y-1">
                <div className="h-3 w-16 bg-zinc-700 rounded mx-auto" />
                <div className="h-4 w-10 bg-zinc-600 rounded mx-auto" />
              </div>
              <div className="p-2 space-y-2 flex-1">
                <div className="h-16 bg-zinc-800/60 rounded-xl" />
                <div className="h-20 bg-zinc-800/40 rounded-xl" />
                <div className="h-14 bg-zinc-800/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE: Si no está cargando y no hay slots */}
      {!loading && slots.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#161b22] border border-[#30363d] text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center mx-auto text-[#ff7b72]">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Semana sin Planificación Activa
            </h3>
            <p className="text-xs text-zinc-400">
              No se encontraron bloques planificados para este período semanal. Puedes generar la propuesta automática basada en tus materias y hábitos.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenWeeklyGenerator}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E50914] hover:bg-[#b80710] text-white shadow-[0_0_14px_rgba(229,9,20,0.35)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Generar propuesta semanal</span>
            </button>
          </div>
        </div>
      )}

      {/* 7-DAY WEEK GRID */}
      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[620px]">
          {daysOfWeek.map((day, idx) => {
            const daySlots = filteredSlots.filter((slot) => {
              const d = safeParseDate(slot.start || slot.startTime);
              if (!d) return false;
              return isSameDay(d, day);
            });

            // Ordenar por hora de inicio
            daySlots.sort((a, b) => {
              const da = safeParseDate(a.start || a.startTime)?.getTime() || 0;
              const db = safeParseDate(b.start || b.startTime)?.getTime() || 0;
              return da - db;
            });

            const isTodayColumn = isToday(day);

            return (
              <div
                key={idx}
                className={`flex flex-col bg-[#121215] border rounded-2xl overflow-hidden ${
                  isTodayColumn
                    ? 'border-white/30 shadow-sm ring-1 ring-white/10'
                    : 'border-[#27272A]'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b text-center transition-colors ${
                    isTodayColumn
                      ? 'bg-[#F4F4F5] text-[#09090B] border-[#E4E4E7]'
                      : 'bg-[#18181B]/60 border-[#27272A]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isTodayColumn ? 'text-zinc-600' : 'text-zinc-500'
                      }`}
                    >
                      {format(day, 'EEEE', { locale: es })}
                    </span>
                    {isTodayColumn && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-white font-mono leading-none">
                        Hoy
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-extrabold font-mono block mt-0.5 ${
                      isTodayColumn ? 'text-zinc-950' : 'text-zinc-200'
                    }`}
                  >
                    {format(day, 'dd/MM')}
                  </span>
                </div>

                {/* Day Slots List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[680px]">
                  {daySlots.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-zinc-600 text-xs font-medium">
                      Sin actividades
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const theme = getCategoryTheme(slot.category);
                      const isCompleted =
                        slot.status === 'COMPLETED' || slot.status === 'COMPLETADO';
                      const timeStr = formatSlotTime(slot);

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
                            theme.card
                          } ${isCompleted ? 'opacity-40 line-through' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] text-zinc-400">
                              {timeStr}
                            </span>
                            {slot.isAutoSlot && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                                Auto
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-white leading-tight">
                            {slot.title}
                          </div>

                          {slot.subject && (
                            <div className="text-[10px] text-zinc-400 mt-1 truncate font-medium">
                              📚 {slot.subject}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${theme.badge}`}
                            >
                              {theme.label}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(slot);
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isCompleted
                                  ? 'text-emerald-400 hover:text-emerald-300'
                                  : 'text-zinc-600 hover:text-zinc-300'
                              }`}
                              title={isCompleted ? 'Marcar pendiente' : 'Completar slot'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL FOR SELECTED SLOT */}
      {selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl p-6 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Detalle de Actividad
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedSlot.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#30363d] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Horario:</span>
                <span className="text-white font-bold">{formatSlotTime(selectedSlot)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Categoría:</span>
                <span className="text-zinc-300">{selectedSlot.category}</span>
              </div>
              {selectedSlot.subject && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Materia:</span>
                  <span className="text-[#ff7b72] font-semibold">{selectedSlot.subject}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Estado:</span>
                <span
                  className={
                    selectedSlot.status === 'COMPLETED' || selectedSlot.status === 'COMPLETADO'
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400'
                  }
                >
                  {selectedSlot.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {onOpenReplan && selectedSlot.id && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedSlot.id;
                    setSelectedSlot(null);
                    onOpenReplan(id);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#21262d] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Reprogramar
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleComplete(selectedSlot)}
                className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSlot.status === 'COMPLETED' || selectedSlot.status === 'COMPLETADO'
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-[#10b981] hover:bg-[#059669] text-black font-extrabold shadow-sm'
                }`}
              >
                {selectedSlot.status === 'COMPLETED' || selectedSlot.status === 'COMPLETADO'
                  ? 'Marcar como Pendiente'
                  : '✓ Marcar como Completado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioPage;
