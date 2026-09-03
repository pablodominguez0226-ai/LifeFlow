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
      const res = await api.replanTask(taskId, '2026-09-02T12:00:00Z');
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
        return <Calendar className="w-4 h-4 text-red-intense" />;
      case 'DIVIDIR':
        return <Scissors className="w-4 h-4 text-accent-orange" />;
      case 'REDUCIR':
        return <Minimize2 className="w-4 h-4 text-zinc-300" />;
      case 'DESCARTAR':
        return <Trash2 className="w-4 h-4 text-red-primary" />;
      default:
        return <ArrowRight className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-red-intense block tracking-wider font-mono">
              Estrategia Anti-Deuda Cognitiva
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">Replanificación de Tarea</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-cardHover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-xs text-zinc-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-red-intense" />
            Analizando disponibilidad futura y restricciones de sueño...
          </div>
        ) : error ? (
          <div className="p-3 bg-[#260505] border border-[#5C1313] text-red-200 text-xs rounded-xl">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Engine Recommendation Summary */}
            <div className="p-3.5 bg-[#240606] border border-[#5C1313] rounded-xl text-xs text-red-200">
              <span className="font-bold block mb-1 text-red-primary">
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
                  className="p-3.5 bg-dark-cardSecondary border border-dark-borderSubtle hover:border-zinc-700 rounded-xl flex flex-col justify-between gap-2 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(opt.action)}
                      <span className="text-xs font-bold text-white">{opt.title}</span>
                    </div>

                    <button
                      onClick={() => handleApplyOption(opt)}
                      disabled={applying}
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-intense hover:bg-red-hover text-white transition-colors disabled:opacity-50"
                    >
                      Elegir
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-300">{opt.description}</p>
                  <p className="text-[10px] text-zinc-500 font-mono italic">
                    Impacto: {opt.impactAssessment}
                  </p>

                  {opt.suggestedSlot && (
                    <div className="mt-1 p-2 bg-black rounded-lg text-[10px] text-red-intense font-mono border border-dark-border">
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

        <div className="flex justify-end pt-2 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
