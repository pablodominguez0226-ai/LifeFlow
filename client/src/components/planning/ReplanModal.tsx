import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RefreshCw, X, ArrowRight, Scissors, Minimize2, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ReplanModalProps {
  taskId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReplanModal: React.FC<ReplanModalProps> = ({ taskId, onClose, onSuccess }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      loadReplanOptions();
    }
  }, [taskId]);

  if (!taskId) return null;

  const loadReplanOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.replanTask(taskId, new Date().toISOString());
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOption = async (option: any) => {
    try {
      setApplying(true);
      if (option.action === 'MOVER' && option.suggestedSlot) {
        await api.createBlock({
          title: `Reubicado: Tarea Académica`,
          startTime: option.suggestedSlot.startTime,
          endTime: option.suggestedSlot.endTime,
          durationMinutes: option.suggestedSlot.durationMinutes,
          category: 'ACADEMIA',
          flexibility: 'FLEXIBLE',
          justification: `Replanificado por el motor para evitar deuda acumulada.`,
          academicTaskId: taskId,
        });
      } else if (option.action === 'DESCARTAR') {
        await api.updateTask(taskId, { status: 'POSTERGADA' });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'MOVER':
        return <Calendar className="w-4 h-4 text-zinc-300" />;
      case 'DIVIDIR':
        return <Scissors className="w-4 h-4 text-zinc-300" />;
      case 'REDUCIR':
        return <Minimize2 className="w-4 h-4 text-zinc-300" />;
      case 'DESCARTAR':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <ArrowRight className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider font-mono">
              Estrategia Anti-Deuda Cognitiva
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">Replanificación de Tarea</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center items-center text-xs text-zinc-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
              Analizando disponibilidad futura y restricciones de sueño...
            </div>
          ) : error ? (
            <div className="p-3 bg-[#260505] border border-[#5C1313] text-red-200 text-xs rounded-xl">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Engine Recommendation Summary */}
              <div className="p-3.5 bg-[#18181B] border border-[#27272A] rounded-xl text-xs text-zinc-200">
                <span className="font-bold block mb-1 text-white">
                  Recomendación del Motor: {data.recommendedAction}
                </span>
                <p className="text-[11px] leading-relaxed text-zinc-300">{data.justification}</p>
              </div>

              {/* Options list */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-200 block">
                  Seleccioná cómo proceder:
                </span>
                {data.options.map((opt: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#18181B] border border-[#27272A] hover:border-zinc-500 rounded-xl flex flex-col justify-between gap-2 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(opt.action)}
                        <span className="text-xs font-bold text-white">{opt.title}</span>
                      </div>

                      <button
                        onClick={() => handleApplyOption(opt)}
                        disabled={applying}
                        className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#E4E4E7] text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Elegir
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-300">{opt.description}</p>
                    <p className="text-[10px] text-zinc-500 font-mono italic">
                      Impacto: {opt.impactAssessment}
                    </p>

                    {opt.suggestedSlot && (
                      <div className="mt-1 p-2 bg-[#09090B] rounded-lg text-[10px] text-zinc-300 font-mono border border-[#27272A]">
                        Hueco sugerido:{' '}
                        {format(new Date(opt.suggestedSlot.startTime), 'EEEE dd/MM HH:mm')} -{' '}
                        {format(new Date(opt.suggestedSlot.endTime), 'HH:mm')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
