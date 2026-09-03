import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Dumbbell,
  Moon,
  Trophy,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const SportsView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Checkin form state
  const [sleepHours, setSleepHours] = useState(7.5);
  const [energyLevel, setEnergyLevel] = useState(4);
  const [stressLevel, setStressLevel] = useState(2);
  const [studyHoursDone, setStudyHoursDone] = useState(3.0);
  const [workoutDone, setWorkoutDone] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getCheckinHistory();
      setHistory(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createCheckin({
        date: new Date().toISOString(),
        sleepHours: Number(sleepHours),
        energyLevel: Number(energyLevel),
        stressLevel: Number(stressLevel),
        studyHoursDone: Number(studyHoursDone),
        workoutDone: Boolean(workoutDone),
        notes: notes || undefined,
      });
      setSubmittedMessage('Check-in registrado con éxito. El Planning Engine actualizará tu carga.');
      loadHistory();
      setTimeout(() => setSubmittedMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-black text-white">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Entrenamiento, Deporte & Sueño
        </h2>
        <p className="text-xs text-zinc-400">
          Garantizar rendimiento físico y recuperación biológica sin sacrificar el descanso sagrado
        </p>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Gimnasio */}
        <div className="bg-dark-card border border-dark-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-accent-orange" />
              <h3 className="text-sm font-bold text-white">Gimnasio (Fuerza)</h3>
            </div>
            <span className="text-xs font-mono font-bold text-accent-orange">4x / semana</span>
          </div>

          <p className="text-xs text-zinc-300">
            Sesiones de 2 a 2.5 horas. Horarios habituales:
          </p>

          <ul className="text-[11px] text-zinc-400 space-y-1 font-mono">
            <li>• Lunes: 16:00 / 17:00 (2 — 2.5 horas)</li>
            <li>• Martes: Temprano (10:30 — 12:45, antes de Consulta Diseño)</li>
            <li>• Jueves: 16:00 — 18:00 (1h de margen antes de Sistemas a las 19:00)</li>
            <li>• Viernes: 17:15 — 19:30 (con margen tras terminar Economía a las 17:00)</li>
          </ul>

          <div className="p-3 bg-[#240B04] border border-[#541B08] rounded-xl text-[10px] text-orange-200">
            <strong className="text-white">Regla de Alta Carga:</strong> En semanas críticas con 2+ exámenes inmediatos, se reduce automáticamente a 3 sesiones para proteger la recuperación.
          </div>
        </div>

        {/* Pillar 2: Deportes de Equipo */}
        <div className="bg-dark-card border border-dark-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-white">Fútbol & Rugby</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">Deportes</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
              <span className="font-bold text-white block">Fútbol (Sábado Mañana)</span>
              <span className="text-[11px] text-zinc-400">Fijo y social. Sábado tarde queda libre para amigos y mates.</span>
            </div>

            <div className="p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Rugby (Martes 21:00)</span>
                <span className="text-[9px] font-bold text-accent-orange uppercase px-2 py-0.5 rounded bg-[#2B1105] border border-[#5E2B0D]">
                  Flexible
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mt-1">
                Salida 19:30. Insume ~3.5h totales. Es el primer elemento a sacrificar ante sobrecarga.
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Sueño Sagrado */}
        <div className="bg-dark-card border border-dark-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-red-intense" />
              <h3 className="text-sm font-bold text-white">Restricción Dura de Sueño</h3>
            </div>
            <span className="text-xs font-mono font-bold text-red-intense">7 - 8 Horas</span>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Hora máxima dormir:</span>
              <span className="font-bold text-white">00:00</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Hora despertar:</span>
              <span className="font-bold text-white">06:30 - 07:00</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Fin estudio pesado:</span>
              <span className="font-bold text-red-intense">22:30</span>
            </div>
          </div>

          <div className="p-3 bg-[#240606] border border-[#5C1313] rounded-xl text-[10px] text-red-200">
            <strong className="text-white">Inviolable:</strong> El motor NUNCA asignará sesiones de estudio nocturnas que reduzcan el descanso básico por debajo de 7 horas.
          </div>
        </div>
      </div>

      {/* Daily Check-in Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-intense" />
              <h3 className="text-base font-bold text-white">Registro de Recuperación Diaria</h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">02 Sep 2026</span>
          </div>

          {submittedMessage && (
            <div className="p-3 bg-[#0A2613] border border-[#165E30] text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {submittedMessage}
            </div>
          )}

          <form onSubmit={handleCheckinSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">
                  Horas dormidas anoche ({sleepHours}h)
                </label>
                <input
                  type="range"
                  min="4.0"
                  max="10.0"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-red-intense cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>5h (Déficit)</span>
                  <span>7.5h (Objetivo)</span>
                  <span>9h (Óptimo)</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">
                  Horas estudiadas hoy ({studyHoursDone}h)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="14"
                  value={studyHoursDone}
                  onChange={(e) => setStudyHoursDone(Number(e.target.value))}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Nivel de Energía (1-5)</label>
                <select
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                >
                  <option value={1}>1 — Muy baja (Agotamiento)</option>
                  <option value={2}>2 — Baja</option>
                  <option value={3}>3 — Moderada</option>
                  <option value={4}>4 — Alta (Excelente foco)</option>
                  <option value={5}>5 — Máxima (Peak cognitivo)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Nivel de Estrés (1-5)</label>
                <select
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                >
                  <option value={1}>1 — Muy bajo (Calma total)</option>
                  <option value={2}>2 — Bajo / Controlado</option>
                  <option value={3}>3 — Moderado</option>
                  <option value={4}>4 — Alto</option>
                  <option value={5}>5 — Sobrecarga / Alerta</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="workout"
                checked={workoutDone}
                onChange={(e) => setWorkoutDone(e.target.checked)}
                className="rounded bg-dark-cardSecondary border-dark-border text-red-intense focus:ring-0"
              />
              <label htmlFor="workout" className="text-xs text-zinc-200 font-medium">
                ¿Realizaste entrenamiento o deporte hoy?
              </label>
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">Notas del día (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Buen foco matutino en Paradigmas, buena sesión de piernas."
                className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-intense/20 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Check-In Diario'}
            </button>
          </form>
        </div>

        {/* History Preview (5 cols) */}
        <div className="lg:col-span-5 bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Historial Reciente</h3>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {history.map((check) => (
              <div
                key={check.id}
                className="p-3.5 bg-dark-cardSecondary border border-dark-borderSubtle rounded-xl space-y-1 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-zinc-300">
                    {new Date(check.date).toLocaleDateString()}
                  </span>
                  <span className="text-red-intense font-mono font-bold">
                    {check.sleepHours}h sueño
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Estudio: {check.studyHoursDone}h</span>
                  <span>Energía: {check.energyLevel}/5</span>
                  <span>Estrés: {check.stressLevel}/5</span>
                  <span>{check.workoutDone ? '🏋️ Gym' : 'Rest'}</span>
                </div>
                {check.notes && (
                  <p className="text-[10px] text-zinc-400 italic">"{check.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
