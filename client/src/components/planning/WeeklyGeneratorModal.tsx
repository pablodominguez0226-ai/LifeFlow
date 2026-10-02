import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

interface WeeklyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WeeklyGeneratorModal: React.FC<WeeklyGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mondayDate, setMondayDate] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [gymSessions, setGymSessions] = useState(4);
  const [enableRugby, setEnableRugby] = useState(true);
  const [enableMarket, setEnableMarket] = useState(false);

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.generateWeek({
        mondayDate: `${mondayDate}T00:00:00Z`,
        gymSessionsTarget: gymSessions,
        enableRugby,
        enableMarket,
      });
      setProposal(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!proposal) return;
    try {
      setApplying(true);
      await api.applyWeek(proposal);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Generar Propuesta Semanal Dinámica</h3>
              <p className="text-xs text-zinc-400">
                El Planning Engine evalúa fechas de examen, sueño, cansancio y descanso antes de proponer
              </p>
            </div>
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
          {/* Configuration inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#18181B] p-4 rounded-xl border border-[#27272A]">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">
                Lunes de Inicio
              </label>
              <input
                type="date"
                value={mondayDate}
                onChange={(e) => setMondayDate(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">
                Meta Gimnasio Semanal
              </label>
              <select
                value={gymSessions}
                onChange={(e) => setGymSessions(Number(e.target.value))}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-zinc-500"
              >
                <option value={4}>4 sesiones (Habitual)</option>
                <option value={3}>3 sesiones (Alta carga)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <input
                type="checkbox"
                id="rugby"
                checked={enableRugby}
                onChange={(e) => setEnableRugby(e.target.checked)}
                className="rounded bg-[#09090B] border-[#27272A] accent-white focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rugby" className="text-xs text-zinc-300 font-medium cursor-pointer">
                Rugby Martes (Flexible)
              </label>
            </div>

            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <input
                type="checkbox"
                id="market"
                checked={enableMarket}
                onChange={(e) => setEnableMarket(e.target.checked)}
                className="rounded bg-[#09090B] border-[#27272A] accent-white focus:ring-0 cursor-pointer"
              />
              <label htmlFor="market" className="text-xs text-zinc-300 font-medium cursor-pointer">
                Mercado Miércoles
              </label>
            </div>
          </div>

          {/* Generate action */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 bg-white hover:bg-[#E4E4E7] text-zinc-950 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Calculando restricciones y equilibrio...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Ejecutar Motor de Planificación
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-[#260505] border border-[#5C1313] text-red-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Engine Proposal Result */}
          {proposal && (
            <div className="space-y-4 pt-2 border-t border-[#27272A]">
              {/* Score & Load Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-[#18181B] border border-[#27272A] gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider font-mono">
                    Evaluación de Sostenibilidad Humana
                  </span>
                  <p className="text-xs text-zinc-300 mt-0.5">{proposal.summary}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                      Score
                    </span>
                    <span className="text-xl font-bold font-mono text-white">
                      {proposal.sustainabilityScore}/100
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                      Carga
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        proposal.overloadReport.level === 'EXCESIVA'
                          ? 'bg-[#260505] text-red-400 border-[#5C1313]'
                          : proposal.overloadReport.level === 'ALTA'
                          ? 'bg-[#291307] text-orange-400 border-[#5E2B0D]'
                          : 'bg-[#07210F] text-emerald-400 border-[#16592B]'
                      }`}
                    >
                      {proposal.overloadReport.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overload Recommendations or Sacrifices */}
              {proposal.overloadReport.suggestedSacrifices?.length > 0 && (
                <div className="p-3.5 bg-[#291307] border border-[#5E2B0D] rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-300">
                    <AlertTriangle className="w-4 h-4 text-accent-orange" />
                    Regla de Sacrificio Consciente Aplicada:
                  </div>
                  {proposal.overloadReport.suggestedSacrifices.map((sac: string, i: number) => (
                    <p key={i} className="text-[11px] text-zinc-200 pl-5">
                      • {sac}
                    </p>
                  ))}
                </div>
              )}

              {/* Blocks Preview List */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">
                  Bloques Asignados ({proposal.blocks.length} actividades programadas)
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
                  {proposal.blocks.map((block: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-300 font-semibold">
                          {format(new Date(block.startTime), 'EEE dd HH:mm')}
                        </span>
                        <span className="text-white font-medium">{block.title}</span>
                      </div>

                      <span className="text-zinc-400 text-[10px] italic line-clamp-1 max-w-xs">
                        {block.justification}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2">
          {proposal ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white cursor-pointer transition-colors"
              >
                Cerrar sin aplicar
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm disabled:opacity-50 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                {applying ? 'Guardando en Calendario...' : 'Confirmar & Aplicar al Calendario'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
