import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

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
  const [mondayDate, setMondayDate] = useState('2026-08-31');
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-red-intense" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generar Propuesta Semanal Dinámica</h3>
              <p className="text-xs text-zinc-400">
                El Planning Engine evalúa fechas de examen, sueño, cansancio y descanso antes de proponer
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

        {/* Configuration inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-dark-cardSecondary p-4 rounded-xl border border-dark-borderSubtle">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">
              Lunes de Inicio
            </label>
            <input
              type="date"
              value={mondayDate}
              onChange={(e) => setMondayDate(e.target.value)}
              className="w-full bg-black border border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">
              Meta Gimnasio Semanal
            </label>
            <select
              value={gymSessions}
              onChange={(e) => setGymSessions(Number(e.target.value))}
              className="w-full bg-black border border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-red-intense"
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
              className="rounded bg-black border-dark-border text-red-intense focus:ring-0"
            />
            <label htmlFor="rugby" className="text-xs text-zinc-300 font-medium">
              Rugby Martes (Flexible)
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4 sm:pt-0">
            <input
              type="checkbox"
              id="market"
              checked={enableMarket}
              onChange={(e) => setEnableMarket(e.target.checked)}
              className="rounded bg-black border-dark-border text-red-intense focus:ring-0"
            />
            <label htmlFor="market" className="text-xs text-zinc-300 font-medium">
              Operar Mercado 20:30
            </label>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2.5 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-intense/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="space-y-4 pt-2 border-t border-dark-border">
            {/* Score & Load Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-dark-cardSecondary border border-dark-border gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-intense block tracking-wider">
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-dark-cardSecondary border border-dark-borderSubtle text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-red-intense font-semibold">
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

            {/* Confirm Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-dark-border">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500"
              >
                Cerrar sin aplicar
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-md shadow-red-intense/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {applying ? 'Guardando en Calendario...' : 'Confirmar & Aplicar al Calendario'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
