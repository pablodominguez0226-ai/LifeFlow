import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const StatsView: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.getStatistics(new Date().toISOString());
        setStats(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500 text-xs font-medium">
        Calculando métricas de sostenibilidad humana...
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Óptimo':
        return 'bg-[#0A2613] text-emerald-400 border-[#165E30]';
      case 'Moderado':
        return 'bg-[#2B1705] text-amber-400 border-[#5C2F09]';
      default:
        return 'bg-[#260505] text-red-primary border-[#5C1313]';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-black text-white">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Estadísticas & Cumplimiento Sostenible
        </h2>
        <p className="text-xs text-zinc-400">
          No medimos solo volumen de trabajo, sino equilibrio real entre avance académico, sueño y salud
        </p>
      </div>

      {/* Main Score Banner: Cumplimiento Sostenible */}
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <ShieldCheck className="w-5 h-5 text-red-intense" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-intense">
                Métrica Maestra de Rendimiento
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white">Cumplimiento Sostenible</h3>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              "Una semana con 25 horas de estudio pero 5 horas de sueño es un fracaso de planificación.
              Optimizamos progreso continuo sin autodestrucción biológica."
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-5xl font-extrabold font-mono text-white block">
                {stats.sustainableScore}
                <span className="text-lg text-zinc-500 font-normal">/100</span>
              </span>
              <span
                className={`inline-block px-3.5 py-0.5 rounded-full text-xs font-bold border mt-2 ${getStatusBadge(
                  stats.sustainabilityStatus
                )}`}
              >
                {stats.sustainabilityStatus}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Sustainable Score */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-dark-borderSubtle">
          <div className="p-3.5 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Salud del Sueño
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {stats.scoreBreakdown.sleepScore}/30
            </span>
          </div>
          <div className="p-3.5 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Entrenamiento Físico
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {stats.scoreBreakdown.workoutScore}/25
            </span>
          </div>
          <div className="p-3.5 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Control del Estrés
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {stats.scoreBreakdown.stressScore}/25
            </span>
          </div>
          <div className="p-3.5 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Avance de Estudio
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {stats.scoreBreakdown.studyScore}/20
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown: Hours by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category Hours (7 cols) */}
        <div className="lg:col-span-7 bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-intense" />
            Distribución Semanal de Horas Planificadas
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(stats.categoryHours).map(([category, hours]: [string, any]) => {
              if (hours === 0) return null;
              const maxHours = 35;
              const pct = Math.min(100, Math.round((hours / maxHours) * 100));

              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">{category}</span>
                    <span className="text-zinc-400 font-bold">{hours} horas</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-red-intense transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Key Summary Metrics (5 cols) */}
        <div className="lg:col-span-5 bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-intense" />
              Resumen Operativo
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                <span className="text-zinc-400">Promedio de Sueño:</span>
                <span className="font-bold text-white">{stats.metrics.avgSleep}h / noche</span>
              </div>

              <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                <span className="text-zinc-400">Gimnasio Realizado:</span>
                <span className="font-bold text-accent-orange">
                  {stats.metrics.workoutSessionsThisWeek} de {stats.metrics.targetWorkouts} sesiones
                </span>
              </div>

              <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                <span className="text-zinc-400">Estudio Registrado:</span>
                <span className="font-bold text-white">
                  {stats.metrics.studyHoursLogged} horas
                </span>
              </div>

              <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                <span className="text-zinc-400">Tareas Pendientes:</span>
                <span className="font-bold text-red-intense">
                  {stats.metrics.pendingTasks} tareas activas
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#240606] border border-[#5C1313] rounded-xl text-[11px] text-red-200">
            <strong className="text-white">Fase Macro 1 Activa:</strong> Foco en Paradigmas 1P (25/09) manteniendo avances sostenidos en el Final de Diseño (08/10).
          </div>
        </div>
      </div>
    </div>
  );
};
