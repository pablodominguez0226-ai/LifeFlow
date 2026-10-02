import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  Moon,
  RotateCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { SyncCalendarModal } from './SyncCalendarModal';

interface CalendarViewProps {
  onOpenReplan: (taskId: string) => void;
  onOpenNewActivity: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenReplan,
  onOpenNewActivity,
}) => {
  const [currentMonday, setCurrentMonday] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(currentMonday, offset));

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const start = currentMonday.toISOString();
      const end = addDays(currentMonday, 7).toISOString();
      const res = await api.getCalendar(start, end);
      setBlocks(res);
    } catch (err) {
      console.error('Error loading calendar blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [currentMonday]);

  const handlePrevWeek = () => {
    setCurrentMonday(addDays(currentMonday, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonday(addDays(currentMonday, 7));
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleToggleComplete = async (block: any) => {
    try {
      const newStatus = block.status === 'COMPLETADO' ? 'PLANIFICADO' : 'COMPLETADO';
      await api.updateBlock(block.id, { status: newStatus });
      setSelectedBlock(null);
      loadBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await api.deleteBlock(id);
      setSelectedBlock(null);
      loadBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryClasses = (category: string, isFixed: boolean) => {
    switch (category) {
      case 'ACADEMIA':
        return 'bg-[#18181B] text-zinc-100 border border-zinc-700/70 hover:border-zinc-500 border-l-2 border-l-zinc-300';
      case 'GIMNASIO':
      case 'DEPORTE':
        return 'bg-[#18181B] text-zinc-100 border border-zinc-700/70 hover:border-zinc-500 border-l-2 border-l-zinc-400';
      case 'LECTURA':
        return 'bg-[#18181B] text-zinc-100 border border-zinc-700/70 hover:border-zinc-500 border-l-2 border-l-zinc-500';
      case 'DESCANSO':
      case 'PERSONAL':
        return 'bg-[#141416] text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 border-l-2 border-l-zinc-600';
      case 'MERCADO':
        return 'bg-[#18181B] text-zinc-100 border border-zinc-700/70 hover:border-zinc-500 border-l-2 border-l-zinc-400';
      default:
        return 'bg-[#18181B] text-zinc-300 border border-zinc-800 hover:border-zinc-700';
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    if (categoryFilter === 'ALL') return true;
    return b.category === categoryFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-[#09090B] text-white">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] border border-[#27272A] p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] transition-colors shadow-sm"
          >
            Semana Actual
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-white ml-2">
            {format(currentMonday, "d 'de' MMMM", { locale: es })} —{' '}
            {format(addDays(currentMonday, 6), "d 'de' MMMM yyyy", { locale: es })}
          </span>
        </div>

        {/* Actions & Category Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'ACADEMIA', 'GIMNASIO', 'DEPORTE', 'LECTURA', 'PERSONAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:text-white hover:border-zinc-500'
                }`}
              >
                {cat === 'ALL' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-6 bg-[#27272A] hidden sm:block" />

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all shadow-sm"
            title="Sincronizar con Google Calendar o descargar .ics"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sincronizar Google / iCal</span>
          </button>
        </div>
      </div>

      {/* Protected Sleep Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121215] border border-[#27272A] rounded-xl text-xs text-zinc-300">
        <span className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-zinc-400" />
          <span>
            <strong className="text-white">Restricción Dura de Sueño:</strong> Ventana 00:00 - 06:30
            sagrada (7.5h de sueño protegidas). Prohibido estudio cognitivo profundo después de las 22:30.
          </span>
        </span>
        <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Engine Guard
        </span>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[620px]">
        {daysOfWeek.map((day, idx) => {
          const dayBlocks = filteredBlocks.filter((b) =>
            isSameDay(new Date(b.startTime), day)
          );
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

              {/* Day Blocks List */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[680px]">
                {dayBlocks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-zinc-600 text-xs italic font-medium">
                    Margen / Buffer
                  </div>
                ) : (
                  dayBlocks.map((block) => {
                    const startTimeStr = format(new Date(block.startTime), 'HH:mm');
                    const endTimeStr = format(new Date(block.endTime), 'HH:mm');
                    const isCompleted = block.status === 'COMPLETADO';

                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlock(block)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${getCategoryClasses(
                          block.category,
                          block.isFixed
                        )} ${isCompleted ? 'opacity-40 line-through' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] text-zinc-400">
                            {startTimeStr} - {endTimeStr}
                          </span>
                          {block.isFixed ? (
                            <span title="Actividad fija">
                              <Lock className="w-3 h-3 text-zinc-400" />
                            </span>
                          ) : (
                            <span className="text-[8px] uppercase font-mono px-1 rounded bg-black/40 text-zinc-400">
                              {block.flexibility}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-[11px] text-white line-clamp-2">
                          {block.title}
                        </p>

                        {block.justification && (
                          <p className="text-[10px] text-zinc-400/90 mt-1 line-clamp-1 italic">
                            {block.justification}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {selectedBlock.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">
                  {selectedBlock.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
              <div className="bg-[#18181B] p-3.5 rounded-xl border border-[#27272A] text-xs space-y-1.5 font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Horario:</span>
                  <span className="text-white">
                    {format(new Date(selectedBlock.startTime), 'HH:mm')} -{' '}
                    {format(new Date(selectedBlock.endTime), 'HH:mm')} ({selectedBlock.durationMinutes} min)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Flexibilidad:</span>
                  <span className="text-white">{selectedBlock.flexibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Energía Requerida:</span>
                  <span className="text-white">{selectedBlock.energyLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estado:</span>
                  <span className={selectedBlock.status === 'COMPLETADO' ? 'text-zinc-400 font-semibold' : 'text-white'}>
                    {selectedBlock.status}
                  </span>
                </div>
              </div>

              {selectedBlock.justification && (
                <div className="bg-[#18181B] border border-[#27272A] p-3.5 rounded-xl text-xs text-zinc-300">
                  <span className="font-bold block mb-1 flex items-center gap-1.5 text-zinc-200">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    Motivo de Asignación del Planning Engine:
                  </span>
                  <p className="text-[11px] leading-relaxed italic text-zinc-400">
                    "{selectedBlock.justification}"
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleToggleComplete(selectedBlock)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  selectedBlock.status === 'COMPLETADO'
                    ? 'bg-[#18181B] text-zinc-300 border border-[#27272A]'
                    : 'bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedBlock.status === 'COMPLETADO'
                  ? 'Desmarcar'
                  : 'Marcar como Completado'}
              </button>

              <div className="flex items-center gap-2">
                {!selectedBlock.isFixed && (
                  <button
                    onClick={() => {
                      const id = selectedBlock.academicTaskId || selectedBlock.id;
                      setSelectedBlock(null);
                      onOpenReplan(id);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Replanificar
                  </button>
                )}

                <button
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-400 border border-[#27272A] hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Google Calendar / iCal Modal */}
      <SyncCalendarModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
