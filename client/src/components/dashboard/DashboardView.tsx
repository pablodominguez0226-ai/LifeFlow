import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Target,
  Gauge,
  BookOpen,
  Moon,
  Calendar,
  Key,
  GraduationCap,
  Utensils,
  Dumbbell,
  TrendingUp,
  Clock,
  Coffee,
  Play,
  Pause,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToCalendar: () => void;
  onNavigateToAcademic: () => void;
  onOpenReplan: (taskId: string) => void;
  onOpenDailyPlanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToCalendar,
  onNavigateToAcademic,
  onOpenReplan,
  onOpenDailyPlanner,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(50 * 60);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard('2026-09-02T12:00:00Z');
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-red-intense animate-spin" />
          <span className="text-xs text-zinc-500 font-medium">Cargando LifeFlow Dashboard...</span>
        </div>
      </div>
    );
  }

  // Wednesday 02/09 agenda (Definitive Timetable: Miércoles sin cursada fija, día de alta flexibilidad)
  const agendaItems = [
    {
      time: '09:00\n11:00',
      title: 'Estudio Profundo: Diseño de Sistemas',
      subtitle: 'Final 08/10 — Caching & ACID',
      tag: 'ALTA',
      tagColor: 'bg-[#2A0808] text-red-300 border-[#5C1313]',
      icon: BookOpen,
    },
    {
      time: '12:30\n13:30',
      title: 'Almuerzo + Descanso (Buffer)',
      subtitle: 'Tiempo personal no negociable',
      tag: 'DESCANSO',
      tagColor: 'bg-[#181818] text-zinc-400 border-[#2A2A2A]',
      icon: Utensils,
    },
    {
      time: '15:00\n17:00',
      title: 'Estudio Profundo: Paradigmas',
      subtitle: 'Prolog & Programación Lógica (1P en 23d)',
      tag: 'ALTA',
      tagColor: 'bg-[#2A0808] text-red-300 border-[#5C1313]',
      icon: GraduationCap,
    },
    {
      time: '20:30\n21:30',
      title: 'Operar mercado con amigo',
      subtitle: 'Actividad flexible opcional',
      tag: 'OPCIONAL',
      tagColor: 'bg-[#181818] text-zinc-400 border-[#2A2A2A]',
      icon: TrendingUp,
    },
    {
      time: '22:30\n23:30',
      title: 'Lectura Personal: Filosofía & Psicología',
      subtitle: 'Descanso cognitivo sin pantallas',
      tag: 'DESCANSO',
      tagColor: 'bg-[#181818] text-zinc-400 border-[#2A2A2A]',
      icon: BookOpen,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-black text-white">
      {/* Top Header Greeting & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¡Buen día, Pablo!
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Miércoles, 2 de Septiembre de 2026</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500 hover:text-white transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sincronizar</span>
          </button>

          {onOpenDailyPlanner && (
            <button
              onClick={onOpenDailyPlanner}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-md shadow-red-intense/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Planificar mi día</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Prioridad de hoy */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-red-intense stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block">Prioridad de hoy</span>
            <p className="text-base font-bold text-white truncate">Paradigmas & Diseño</p>
            <p className="text-[11px] text-zinc-400">1º parcial en 23 días • Final en 36 días</p>
          </div>
        </div>

        {/* Metric 2: Carga del día */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 text-red-intense stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block">Carga del día</span>
            <p className="text-base font-bold text-white">Equilibrada</p>
            <p className="text-[11px] text-zinc-400">Sin cursada fija hoy</p>
          </div>
        </div>

        {/* Metric 3: Estudio hoy */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-red-intense stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block">Estudio hoy</span>
              <p className="text-base font-bold text-white font-mono">4h 00m</p>
              <p className="text-[11px] text-zinc-400">en 2 bloques de 120m</p>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-red-intense h-1 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>

        {/* Metric 4: Sueño */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
              <Moon className="w-6 h-6 text-red-intense stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block">Sueño</span>
              <p className="text-base font-bold text-white font-mono">7h 30m</p>
              <p className="text-[11px] text-zinc-400">anoche (máx acostarse 00:00)</p>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-red-intense h-1 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Section & Right Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Row: Agenda de hoy + Focus Timer */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Agenda de hoy (7 cols) */}
            <div className="md:col-span-7 bg-dark-card border border-dark-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Agenda de hoy (Miércoles)</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Día flexible</span>
              </div>

              <div className="space-y-4 relative">
                {/* Continuous vertical red line */}
                <div className="absolute left-[59px] top-3 bottom-3 w-[2px] bg-zinc-800" />

                {agendaItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 relative">
                      {/* Time */}
                      <span className="text-[11px] font-mono text-zinc-400 w-11 shrink-0 whitespace-pre-line leading-tight text-right">
                        {item.time}
                      </span>

                      {/* Timeline Red Dot */}
                      <div className="w-3 h-3 rounded-full bg-red-intense border-2 border-black z-10 shrink-0" />

                      {/* Content Card */}
                      <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl bg-dark-cardSecondary/60 border border-dark-borderSubtle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-red-intense shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-zinc-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${item.tagColor} shrink-0 font-mono`}
                        >
                          {item.tag}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Focus / Pomodoro Timer Widget (5 cols) */}
            <div className="md:col-span-5 bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="w-full text-left">
                <span className="text-xs font-semibold text-zinc-400">Enfoque actual</span>
              </div>

              {/* Circular Gauge Ring with Timer */}
              <div className="relative my-4 flex items-center justify-center">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-zinc-900"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-red-intense"
                    strokeWidth="6"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (timerSeconds / (50 * 60)))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-wider">
                    {formatTimer(timerSeconds)}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">Estudio profundo</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="w-full max-w-[160px] py-2.5 rounded-xl bg-red-intense hover:bg-red-hover text-white text-xs font-bold shadow-lg shadow-red-intense/20 transition-all flex items-center justify-center gap-2"
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Iniciar</span>
                  </>
                )}
              </button>

              {/* Next Break Footer */}
              <div className="mt-4 pt-3 border-t border-dark-borderSubtle w-full flex items-center justify-between text-[11px] text-zinc-400">
                <div className="text-left">
                  <span className="block text-[10px] text-zinc-500">Siguiente descanso</span>
                  <span className="font-mono text-zinc-300 font-bold">11:00</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Coffee className="w-4 h-4 text-zinc-500" />
                  <span>Pausa de 10 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Semanal Definitiva */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Vista semanal (Horarios Definitivos)</h3>
              <span className="text-[11px] text-zinc-400">Gimnasio 4x • Cursadas fijas • Sueño protegido</span>
            </div>

            {/* Days Columns */}
            <div className="grid grid-cols-7 gap-2">
              {/* LUN */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">LUN</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#300707] border border-[#5C1313] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Paradigmas</p>
                    <p className="text-[9px] text-zinc-400 font-mono">08:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#291307] border border-[#5E2B0D] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">16:00 - 18:15</p>
                  </div>
                </div>
              </div>

              {/* MAR */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">MAR</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#291307] border border-[#5E2B0D] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">10:30 - 12:45</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#2E0B2C] border border-[#5C1B58] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Consulta Diseño</p>
                    <p className="text-[9px] text-zinc-400 font-mono">17:30 - 18:30</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#291307] border border-[#5E2B0D] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Rugby</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:30 salida</p>
                  </div>
                </div>
              </div>

              {/* MIÉ (Active Today) */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-white font-mono py-1 bg-red-intense rounded-md">
                  MIÉ (Hoy)
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#240808] border border-[#451010] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Diseño</p>
                    <p className="text-[9px] text-zinc-400 font-mono">09:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#240808] border border-[#451010] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Parad.</p>
                    <p className="text-[9px] text-zinc-400 font-mono">15:00 - 17:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181818] border border-[#2A2A2A] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Mercado</p>
                    <p className="text-[9px] text-zinc-400 font-mono">20:30</p>
                  </div>
                </div>
              </div>

              {/* JUE */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">JUE</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#240808] border border-[#451010] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Estudio Econ.</p>
                    <p className="text-[9px] text-zinc-400 font-mono">10:00 - 12:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#291307] border border-[#5E2B0D] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">16:00 - 18:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#300707] border border-[#5C1313] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Administración</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:00 - 23:00</p>
                  </div>
                </div>
              </div>

              {/* VIE */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">VIE</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#300707] border border-[#5C1313] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Paradigmas</p>
                    <p className="text-[9px] text-zinc-400 font-mono">08:00 - 11:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#300707] border border-[#5C1313] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Economía</p>
                    <p className="text-[9px] text-zinc-400 font-mono">14:30 - 17:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#291307] border border-[#5E2B0D] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Gimnasio</p>
                    <p className="text-[9px] text-zinc-400 font-mono">17:15 - 19:30</p>
                  </div>
                </div>
              </div>

              {/* SÁB */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">SÁB</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#0A2613] border border-[#165E30] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Fútbol</p>
                    <p className="text-[9px] text-zinc-400 font-mono">09:30 - 12:00</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#181818] border border-[#2A2A2A] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Libre / Amigos</p>
                    <p className="text-[9px] text-zinc-400">Mates & relax</p>
                  </div>
                </div>
              </div>

              {/* DOM */}
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold text-zinc-400 font-mono py-1">DOM</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#181818] border border-[#2A2A2A] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Descanso</p>
                    <p className="text-[9px] text-zinc-400">Paseo / Mates</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#240808] border border-[#451010] text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">Plan Semanal</p>
                    <p className="text-[9px] text-zinc-400 font-mono">19:30 - 20:15</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-dark-borderSubtle text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-intense" /> Cursada / Examen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" /> Gimnasio (4x)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Deporte (Fútbol / Rugby)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Consulta Diseño
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Descanso & Buffer
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Próximos exámenes */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Próximos exámenes</h3>
              <button
                onClick={onNavigateToAcademic}
                className="text-xs font-semibold text-red-intense hover:text-red-hover transition-colors"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {(data?.upcomingExams || []).map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-dark-cardSecondary/70 border border-dark-borderSubtle hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-red-intense" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{exam.title}</p>
                      <p className="text-[11px] text-zinc-400">
                        {new Date(exam.date).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-sm font-extrabold font-mono text-red-intense block leading-tight">
                      {exam.daysRemaining}
                    </span>
                    <span className="text-[10px] text-red-intense font-medium uppercase tracking-wider">
                      días
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Recomendaciones */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-accent-orange" />
              <h3 className="text-sm font-bold text-white">Directivas del Planning Engine</h3>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-red-intense">•</span>
                <span>Jueves: Gimnasio termina a las 18:00 (1h de margen antes de Sistemas a las 19:00).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-intense">•</span>
                <span>Viernes: Gimnasio arranca 17:15 (15 min de traslado post-Economía).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-intense">•</span>
                <span>Martes: Gimnasio temprano (10:30) para dejar libre la Consulta de Diseño (17:30).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-intense">•</span>
                <span>Miércoles: Día de alta flexibilidad sin cursada fija para avanzar temas pesados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-intense">•</span>
                <span>Sueño sagrado: Prohibido estudio profundo después de las 22:30.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-dark-borderSubtle">
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-bold text-red-intense hover:text-red-hover flex items-center gap-1 transition-colors"
              >
                Ver todas las recomendaciones →
              </button>
            </div>
          </div>

          {/* Card 3: Progreso académico */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Progreso académico</h3>
              <button
                onClick={onNavigateToAcademic}
                className="text-xs font-semibold text-red-intense hover:text-red-hover transition-colors"
              >
                Ver detalles
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Paradigmas (1P en 23 días)</span>
                  <span className="text-zinc-400 font-mono">65%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-intense h-1.5 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Economía (1P en 25 días)</span>
                  <span className="text-zinc-400 font-mono">48%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-intense h-1.5 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-white">Diseño (Final en 36 días — 72% completado)</span>
                  <span className="text-zinc-400 font-mono">72%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-intense h-1.5 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
