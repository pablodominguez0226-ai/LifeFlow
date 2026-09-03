import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Clock, Sun, Sunset, Moon, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DailyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyPlanModal: React.FC<DailyPlanModalProps> = ({ isOpen, onClose }) => {
  const [date, setDate] = useState('2026-09-02');
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handlePlanDay();
    }
  }, [isOpen, date]);

  if (!isOpen) return null;

  const handlePlanDay = async () => {
    try {
      setLoading(true);
      const res = await api.planDay(`${date}T12:00:00Z`);
      setPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSlotList = (slots: any[]) => {
    if (!slots || slots.length === 0) {
      return (
        <p className="text-xs text-zinc-500 italic py-2">
          Sin actividades planificadas para este período (espacio de descanso o buffer).
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {slots.map((slot: any, i: number) => (
          <div
            key={i}
            className="p-3 bg-dark-cardSecondary border border-dark-borderSubtle rounded-xl space-y-1 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-red-intense">
                {format(new Date(slot.startTime), 'HH:mm')} -{' '}
                {format(new Date(slot.endTime), 'HH:mm')} ({slot.durationMinutes} min)
              </span>
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-black text-zinc-300 border border-dark-border font-mono">
                {slot.energyLevel} Energía
              </span>
            </div>

            <p className="font-bold text-white text-sm">{slot.title}</p>

            {slot.justification && (
              <p className="text-[11px] text-zinc-400 italic">
                Motivo: "{slot.justification}"
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-intense" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Planificar Mi Día</h3>
              <p className="text-xs text-zinc-400">
                Distribución estratégica por franjas horarias con justificación cognitiva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-cardHover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-dark-cardSecondary p-3 rounded-xl border border-dark-borderSubtle">
          <label className="text-xs text-zinc-300 font-medium">Fecha a planificar:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-black border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-xs text-zinc-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-red-intense" />
            Consultando agenda del día...
          </div>
        ) : plan ? (
          <div className="space-y-5">
            {/* Summary */}
            <div className="p-3 bg-dark-cardSecondary border border-dark-border rounded-xl text-xs text-zinc-200 flex justify-between items-center">
              <span>{plan.summary}</span>
              <span className="font-mono uppercase font-bold text-red-intense">
                {plan.overloadLevel}
              </span>
            </div>

            {/* Fatigue Warning Banner */}
            {plan.fatigueAdjustment?.isFatigued && (
              <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl space-y-1.5 text-xs text-red-200">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Protocolo de Fatiga & Sueño Activado</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {plan.fatigueAdjustment.recommendedAction}
                </p>
                {plan.fatigueAdjustment.warnings?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {plan.fatigueAdjustment.warnings.map((w: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-black/60 border border-red-900/50 text-[10px] text-red-300 font-mono"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. MAÑANA (07:00 - 13:00) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-accent-orange" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Mañana (07:00 — 13:00)
                </h4>
              </div>
              {renderSlotList(plan.morning)}
            </div>

            {/* 2. TARDE (13:00 - 19:00) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sunset className="w-4 h-4 text-red-intense" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Tarde (13:00 — 19:00)
                </h4>
              </div>
              {renderSlotList(plan.afternoon)}
            </div>

            {/* 3. NOCHE (19:00 - 23:30) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-red-intense" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Noche (19:00 — 23:30)
                </h4>
              </div>
              {renderSlotList(plan.evening)}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500 hover:text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
