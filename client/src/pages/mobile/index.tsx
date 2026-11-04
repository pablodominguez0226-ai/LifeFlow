import React, { useState, useEffect } from 'react';
import {
  Sun,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Check,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  WifiOff,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitItem {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  timeHint: string;
  accentColor: string;
}

const HABITS_CONFIG: HabitItem[] = [
  {
    key: 'wake_up_7am',
    title: 'Despertar 07:00 AM',
    subtitle: 'Protocolo de energía matutina',
    icon: Sun,
    timeHint: '07:00 AM',
    accentColor: '#f59e0b',
  },
  {
    key: 'trading_10am',
    title: 'Operar Trading 10:00 AM',
    subtitle: 'Apertura de mercado NYSE',
    icon: TrendingUp,
    timeHint: '10:00 AM',
    accentColor: '#10b981',
  },
  {
    key: 'reading',
    title: 'Lectura de Libros',
    subtitle: 'Desarrollo & enfoque',
    icon: BookOpen,
    timeHint: '20 min',
    accentColor: '#3b82f6',
  },
  {
    key: 'gym',
    title: 'Gimnasio (Tarde)',
    subtitle: 'Fuerza & hipertrofia / Slot dinámico',
    icon: Dumbbell,
    timeHint: '19:00 PM',
    accentColor: '#e50914',
  },
];

export const MobilePage: React.FC = () => {
  const [completedHabits, setCompletedHabits] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({
    wake_up_7am: 14,
    trading_10am: 21,
    reading: 9,
    gym: 18,
  });
  const [todayAgenda, setTodayAgenda] = useState<any[]>([]);
  const [nextSlot, setNextSlot] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);

  // Cargar estado inicial y fallback de localStorage
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar caché local
    const cachedHabits = localStorage.getItem('lifeflow_mobile_habits');
    if (cachedHabits) {
      try {
        setCompletedHabits(JSON.parse(cachedHabits));
      } catch (e) {
        // ignore
      }
    }

    loadDashboard();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardData();
      if (data) {
        if (data.todayAgenda) {
          setTodayAgenda(data.todayAgenda);

          // Buscar próximo bloque activo
          const now = new Date();
          const upcoming = data.todayAgenda.find((slot: any) => new Date(slot.end) > now);
          setNextSlot(upcoming || data.todayAgenda[0] || null);
        }

        // Mapear hábitos completados hoy
        if (data.habitsToday && Array.isArray(data.habitsToday)) {
          const map: Record<string, boolean> = {};
          data.habitsToday.forEach((log: any) => {
            if (log.completed) {
              map[log.habitKey] = true;
            }
          });
          setCompletedHabits((prev) => {
            const merged = { ...prev, ...map };
            localStorage.setItem('lifeflow_mobile_habits', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch offline fallback active:', err);
    } finally {
      setLoading(false);
    }
  };

  // Alternar hábito con actualización optimista inmediata
  const handleToggle = async (habitKey: string) => {
    const previousState = completedHabits[habitKey] || false;
    const nextState = !previousState;

    // Actualización optimista inmediata
    const updated = { ...completedHabits, [habitKey]: nextState };
    setCompletedHabits(updated);
    localStorage.setItem('lifeflow_mobile_habits', JSON.stringify(updated));

    // Feedback táctil con Haptic Vibration si está disponible en móvil
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(nextState ? 40 : 20);
    }

    // Actualizar racha optimista
    setStreaks((prev) => ({
      ...prev,
      [habitKey]: nextState ? (prev[habitKey] || 0) + 1 : Math.max(0, (prev[habitKey] || 1) - 1),
    }));

    try {
      const res = await api.toggleHabitAtomic(habitKey);

      // Si la API devuelve un dynamicSlot tras completar Gym, mostrar el toast solicitado
      if (habitKey === 'gym' && res?.dynamicSlot) {
        setToastMessage('Tiempo de Gym liberado -> Horas de estudio sugeridas añadidas al Dashboard');
        loadDashboard(); // Recargar agenda para reflejar el slot dinámico
      }
    } catch (err) {
      console.warn('Error syncing habit, stored in local storage:', err);
      // Guardar en cola de sincronización offline
      const queue = JSON.parse(localStorage.getItem('lifeflow_offline_queue') || '[]');
      queue.push({ habitKey, date: new Date().toISOString() });
      localStorage.setItem('lifeflow_offline_queue', JSON.stringify(queue));
    }
  };

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between selection:bg-[#e50914]/30 pb-20">
      {/* Toast Dinámico */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1e293b] border-2 border-[#e50914] text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-lg">
            <Sparkles className="w-5 h-5 text-[#e50914] shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-[#e50914]">Optimización Dinámica</p>
              <p className="text-xs font-medium text-zinc-100 mt-0.5 leading-relaxed">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Móvil */}
      <header className="px-5 pt-8 pb-4 border-b border-slate-800/80 bg-[#0f172a]/95 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e50914] animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#e50914]">LifeFlow Mobile</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white mt-1 capitalize">{todayFormatted}</h1>
          </div>

          {isOffline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              <WifiOff className="w-3 h-3" />
              Offline
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="px-5 py-6 space-y-6 flex-1 max-w-md mx-auto w-full">
        {/* Próximo Bloque Activo */}
        {nextSlot && (
          <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] border border-slate-700/60 rounded-3xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#e50914]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#e50914]" /> Bloque en Agenda
              </span>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {format(new Date(nextSlot.start), 'HH:mm')} — {format(new Date(nextSlot.end), 'HH:mm')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate">{nextSlot.title}</h3>
            {nextSlot.subject && (
              <p className="text-xs text-[#e50914] font-semibold mt-0.5">{nextSlot.subject}</p>
            )}
          </div>
        )}

        {/* Acciones Clave del Día (Switches táctiles instantáneos) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Acciones Clave del Día</h2>
            <span className="text-[11px] font-bold text-slate-500">
              {Object.values(completedHabits).filter(Boolean).length} / {HABITS_CONFIG.length} hechos
            </span>
          </div>

          <div className="space-y-2.5">
            {HABITS_CONFIG.map((habit) => {
              const isDone = completedHabits[habit.key] || false;
              const Icon = habit.icon;

              return (
                <div
                  key={habit.key}
                  onClick={() => handleToggle(habit.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                    isDone
                      ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-[#1e293b] border-[#e50914]/60 shadow-[0_4px_20px_rgba(229,9,20,0.15)]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                        isDone
                          ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-tight truncate ${isDone ? 'text-white' : 'text-slate-200'}`}>
                          {habit.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{habit.subtitle}</p>
                    </div>
                  </div>

                  {/* Switch Táctil */}
                  <div
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                      isDone ? 'bg-[#e50914]' : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        isDone ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 text-[#e50914] stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Consistencia & Rachas Acumuladas */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#e50914]" /> Consistencia & Rachas
            </h2>
            <span className="text-[11px] font-bold text-slate-500">Histórico</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {HABITS_CONFIG.map((habit) => {
              const currentStreak = streaks[habit.key] || 0;
              const weeks = (currentStreak / 7).toFixed(1);
              const months = (currentStreak / 30).toFixed(1);

              return (
                <div
                  key={habit.key}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 truncate">{habit.title.split(' ')[0]}</span>
                    <div className="flex items-center gap-1 text-[#e50914]">
                      <Flame className="w-3.5 h-3.5 fill-[#e50914]" />
                      <span className="text-xs font-black font-mono">{currentStreak}d</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-baseline justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                    <span>{weeks} semanas</span>
                    <span className="font-semibold text-slate-300">{months} meses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer Fijo Mobile */}
      <footer className="px-5 py-3 text-center border-t border-slate-800/80 bg-[#0f172a]/95 text-[11px] text-slate-500">
        LifeFlow 2.0 • Registros sincronizados en tiempo real
      </footer>
    </div>
  );
};

export default MobilePage;
