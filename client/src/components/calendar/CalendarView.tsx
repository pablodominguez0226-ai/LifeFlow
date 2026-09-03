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
        return 'bg-[#240606] text-red-100 border-[#5C1313] border-l-4 border-l-red-intense';
      case 'GIMNASIO':
        return 'bg-[#291307] text-orange-100 border-[#5E2B0D] border-l-4 border-l-accent-orange';
      case 'DEPORTE':
        return 'bg-[#07210F] text-emerald-100 border-[#16592B] border-l-4 border-l-emerald-500';
      case 'LECTURA':
        return 'bg-[#210B1E] text-purple-100 border-[#4A1544] border-l-4 border-l-purple-500';
      case 'DESCANSO':
      case 'PERSONAL':
        return 'bg-[#161616] text-zinc-300 border-[#2A2A2A] border-l-4 border-l-zinc-600';
      case 'MERCADO':
        return 'bg-[#0E1F1D] text-teal-100 border-[#1E423E] border-l-4 border-l-teal-500';
      default:
        return 'bg-dark-cardSecondary text-zinc-300 border-dark-border';
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    if (categoryFilter === 'ALL') return true;
    return b.category === categoryFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-black text-white">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-card border border-dark-border p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover transition-colors shadow-sm"
          >
            Semana Actual
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500 hover:text-white transition-colors"
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
                className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                  categoryFilter === cat
                    ? 'bg-red-intense text-white shadow-sm'
                    : 'bg-dark-cardSecondary text-zinc-400 border border-dark-border hover:text-white hover:border-zinc-600'
                }`}
              >
                {cat === 'ALL' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-6 bg-dark-border hidden sm:block" />

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-200 border border-dark-border hover:border-red-intense hover:text-white transition-all shadow-sm"
            title="Sincronizar con Google Calendar o descargar .ics"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-red-intense" />
            <span>Sincronizar Google / iCal</span>
          </button>
        </div>
      </div>

      {/* Protected Sleep Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#140606] border border-[#3E1111] rounded-xl text-xs text-red-200">
        <span className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-red-intense" />
          <span>
            <strong className="text-white">Restricción Dura de Sueño:</strong> Ventana 00:00 - 06:30
            sagrada (7.5h de sueño protegidas). Prohibido estudio cognitivo profundo después de las 22:30.
          </span>
        </span>
        <span className="text-[10px] font-mono font-bold text-red-intense uppercase tracking-wider">
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
              className={`flex flex-col bg-dark-card border rounded-2xl overflow-hidden ${
                isTodayColumn
                  ? 'border-red-intense shadow-md shadow-red-intense/10'
                  : 'border-dark-border'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b text-center ${
                  isTodayColumn
                    ? 'bg-red-intense text-white border-red-intense'
                    : 'bg-dark-cardSecondary/60 border-dark-border'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isTodayColumn ? 'text-white/90' : 'text-zinc-500'
                  }`}
                >
                  {format(day, 'EEEE', { locale: es })}
                </span>
                <span
                  className={`text-sm font-extrabold font-mono ${
                    isTodayColumn ? 'text-white' : 'text-zinc-200'
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
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${getCategoryClasses(
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
                              <Lock className="w-3 h-3 text-red-intense" />
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-intense/20 text-red-primary border border-red-intense/30">
                  {selectedBlock.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  {selectedBlock.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-cardHover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-dark-cardSecondary p-3.5 rounded-xl border border-dark-border text-xs space-y-1.5 font-mono text-zinc-300">
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
                <span className={selectedBlock.status === 'COMPLETADO' ? 'text-red-primary font-bold' : 'text-white'}>
                  {selectedBlock.status}
                </span>
              </div>
            </div>

            {selectedBlock.justification && (
              <div className="bg-[#240606] border border-[#5C1313] p-3.5 rounded-xl text-xs text-red-200">
                <span className="font-bold block mb-1 flex items-center gap-1.5 text-red-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Motivo de Asignación del Planning Engine:
                </span>
                <p className="text-[11px] leading-relaxed italic text-zinc-300">
                  "{selectedBlock.justification}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dark-border">
              <button
                onClick={() => handleToggleComplete(selectedBlock)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                  selectedBlock.status === 'COMPLETADO'
                    ? 'bg-dark-cardSecondary text-zinc-300 border border-dark-border'
                    : 'bg-red-intense text-white hover:bg-red-hover shadow-sm'
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-white border border-dark-border hover:border-red-intense transition-colors"
                  >
                    Replanificar
                  </button>
                )}

                <button
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-400 border border-dark-border hover:border-red-primary hover:text-red-primary transition-colors"
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
