import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Flame,
  CheckCircle2,
  Circle,
  Activity,
  Calendar,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Sun,
  LineChart,
  BookOpen,
  Dumbbell,
  Laptop,
  Check,
} from 'lucide-react';

interface HabitWeekDay {
  dayOfWeek: number;
  date: string;
  isTarget: boolean;
  completed: boolean;
}

interface HabitMatrixRow {
  id: string;
  key: string;
  name: string;
  category: string;
  streakDays: number;
  targetDays: number[];
  weekDays: HabitWeekDay[];
}

interface HabitCheckInItem {
  key: string;
  name: string;
  completed: boolean;
}

interface HabitsOverviewData {
  activeHabitsCount: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  maxStreakDays: number;
  weeklyConsistency: number;
  checkInToday: HabitCheckInItem[];
  matrix: HabitMatrixRow[];
}

export const HabitosPage: React.FC = () => {
  const [data, setData] = useState<HabitsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [togglingKeys, setTogglingKeys] = useState<Record<string, boolean>>({});

  const loadData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      else setSyncing(true);
      const res = await api.getHabitsOverview();
      setData(res);
    } catch (err) {
      console.error('Error al cargar resumen de hábitos:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle habit optimistically
  const handleToggleHabit = async (habitKey: string, dateStr?: string) => {
    if (!data) return;

    // Prevent spam clicks on same habit
    setTogglingKeys((prev) => ({ ...prev, [habitKey]: true }));

    // Capture previous state for rollback
    const previousData = JSON.parse(JSON.stringify(data)) as HabitsOverviewData;

    // Optimistic calculation
    const isTodayToggle = !dateStr || dateStr === '2026-11-04' || dateStr.startsWith(new Date().toISOString().split('T')[0]);

    const updatedCheckIn = data.checkInToday.map((item) => {
      if (item.key === habitKey) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    const targetCheckIn = updatedCheckIn.find((i) => i.key === habitKey);
    const newCompletedState = targetCheckIn ? targetCheckIn.completed : true;

    // Update matrix
    const updatedMatrix = data.matrix.map((row) => {
      if (row.key !== habitKey) return row;
      const updatedWeekDays = row.weekDays.map((wd) => {
        const matchesDate = dateStr ? wd.date === dateStr : (wd.dayOfWeek === 3 || wd.date === '2026-11-04');
        if (matchesDate) {
          return { ...wd, completed: !wd.completed };
        }
        return wd;
      });
      return {
        ...row,
        weekDays: updatedWeekDays,
      };
    });

    const newTodayCompletedCount = updatedCheckIn.filter((i) => i.completed).length;

    setData({
      ...data,
      checkInToday: updatedCheckIn,
      todayCompletedCount: newTodayCompletedCount,
      matrix: updatedMatrix,
    });

    try {
      await api.toggleHabitAtomic(habitKey, dateStr);
    } catch (err) {
      console.error('Error al persistir toggle de hábito:', err);
      // Rollback on error
      setData(previousData);
    } finally {
      setTogglingKeys((prev) => ({ ...prev, [habitKey]: false }));
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PERSONAL':
        return 'text-sky-400 border-sky-500/20 bg-sky-500/10';
      case 'TRADING':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      case 'GYM':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'READING':
        return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-800/40';
    }
  };

  const getHabitIcon = (key: string) => {
    switch (key) {
      case 'wake_up_7am':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'trading_10am':
        return <LineChart className="w-4 h-4 text-emerald-400" />;
      case 'running':
      case 'gym':
        return <Dumbbell className="w-4 h-4 text-rose-400" />;
      case 'reading':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'dev_bots_ai':
        return <Laptop className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Day columns metadata
  const weekColumns = [
    { label: 'L', full: 'Lun', date: '2/11', dayOfWeek: 1 },
    { label: 'M', full: 'Mar', date: '3/11', dayOfWeek: 2 },
    { label: 'M', full: 'Mié', date: '4/11', dayOfWeek: 3, isToday: true },
    { label: 'J', full: 'Jue', date: '5/11', dayOfWeek: 4 },
    { label: 'V', full: 'Vie', date: '6/11', dayOfWeek: 5 },
    { label: 'S', full: 'Sáb', date: '7/11', dayOfWeek: 6 },
    { label: 'D', full: 'Dom', date: '8/11', dayOfWeek: 0 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
        <RefreshCw className="w-7 h-7 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Sincronizando hábitos y matriz semanal...</p>
      </div>
    );
  }

  const activeHabitsCount = data?.activeHabitsCount ?? 6;
  const todayCompletedCount = data?.todayCompletedCount ?? 0;
  const todayTotalCount = data?.todayTotalCount ?? 5;
  const maxStreakDays = data?.maxStreakDays ?? 21;
  const weeklyConsistency = data?.weeklyConsistency ?? 85;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in text-white">
      {/* Header Title & Sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272A]/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Gestión de Hábitos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              En Vivo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tracking de disciplina diaria, consistencia matemática y matriz de rendimiento semanal.
          </p>
        </div>

        <button
          onClick={() => loadData(false)}
          disabled={syncing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#121215] border border-[#27272A] hover:border-zinc-600 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
          <span>{syncing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* 1. LAS 4 MÉTRICAS SUPERIORES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: HÁBITOS ACTIVOS */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 relative overflow-hidden shadow-sm group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Hábitos Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeHabitsCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Definidos en el sistema</p>
          </div>
        </div>

        {/* Card 2: COMPLETADOS HOY */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 relative overflow-hidden shadow-sm group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Completados Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {`${todayCompletedCount} / ${todayTotalCount}`}
            </div>
            <div className="w-full bg-[#18181B] rounded-full h-1.5 mt-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${todayTotalCount > 0 ? Math.min(100, Math.round((todayCompletedCount / todayTotalCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: RACHA MÁXIMA */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 relative overflow-hidden shadow-sm group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Racha Máxima
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {`${maxStreakDays} días`}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Récord activo ininterrumpido</p>
          </div>
        </div>

        {/* Card 4: CONSISTENCIA SEMANAL */}
        <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-5 relative overflow-hidden shadow-sm group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Consistencia Semanal
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-purple-400 tracking-tight">
              {`${weeklyConsistency}%`}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Objetivo meta cumplido</p>
          </div>
        </div>
      </section>

      {/* 2. CHECK-IN DE HOY (Toggles interactivos optimistas) */}
      <section className="bg-[#121215] border border-[#27272A] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Check-In de Hoy (Miércoles 4/11)
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Toca cada hábito para marcarlo o desmarcarlo al instante
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {(data?.checkInToday || []).map((item) => {
            const isCompleted = item.completed;
            const isPendingToggle = !!togglingKeys[item.key];

            return (
              <button
                key={item.key}
                onClick={() => handleToggleHabit(item.key)}
                disabled={isPendingToggle}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none group relative overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                    : 'bg-[#18181B] border-[#27272A] text-zinc-300 hover:border-zinc-700 hover:bg-[#202024]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-[#121215] border-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  >
                    {getHabitIcon(item.key)}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-semibold leading-tight truncate ${isCompleted ? 'text-white' : 'text-zinc-200'}`}>
                      {item.name}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {isCompleted ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-sm'
                      : 'border-zinc-700 group-hover:border-zinc-500 bg-zinc-900/60'
                  }`}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. TABLA MATRIZ: SEMANA DEL 2/11 AL 8/11 */}
      <section className="bg-[#121215] border border-[#27272A] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Semana del 2/11 al 8/11
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Matriz completa de cumplimiento y días objetivo programados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272A] text-zinc-400">
                <th className="py-3 px-4 font-semibold">Hábito</th>
                <th className="py-3 px-3 font-semibold">Categoría</th>
                <th className="py-3 px-3 font-semibold text-center">Racha</th>
                {weekColumns.map((col) => (
                  <th
                    key={col.dayOfWeek}
                    className={`py-3 px-2 text-center font-bold transition-colors ${
                      col.isToday
                        ? 'text-emerald-400 bg-emerald-500/5 rounded-t-lg border-x border-[#27272A]/50'
                        : 'text-zinc-400'
                    }`}
                  >
                    <div>{col.label}</div>
                    <div className="text-[10px] font-normal text-zinc-500">{col.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/50 font-medium">
              {(data?.matrix || []).map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#18181B]/50 transition-colors group"
                >
                  {/* Habit Name */}
                  <td className="py-3 px-4 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
                        {getHabitIcon(row.key)}
                      </div>
                      <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCategoryColor(
                        row.category
                      )}`}
                    >
                      {row.category}
                    </span>
                  </td>

                  {/* Racha (días acumulados) */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[11px]">
                      <Flame className="w-3 h-3 fill-amber-400/30" />
                      <span>{row.streakDays}d</span>
                    </div>
                  </td>

                  {/* Columns L, M, M, J, V, S, D */}
                  {weekColumns.map((col) => {
                    const dayItem = row.weekDays.find((wd) => wd.dayOfWeek === col.dayOfWeek);
                    const isTarget = dayItem ? dayItem.isTarget : row.targetDays.includes(col.dayOfWeek);
                    const isCompleted = dayItem ? dayItem.completed : false;
                    const dateStr = dayItem ? dayItem.date : undefined;

                    return (
                      <td
                        key={col.dayOfWeek}
                        className={`py-3 px-2 text-center align-middle ${
                          col.isToday ? 'bg-emerald-500/5 border-x border-[#27272A]/50' : ''
                        }`}
                      >
                        {isTarget ? (
                          <button
                            onClick={() => handleToggleHabit(row.key, dateStr)}
                            title={isCompleted ? 'Completado - Click para alternar' : 'Pendiente - Click para marcar'}
                            className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : 'bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-transparent hover:text-zinc-500'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        ) : (
                          <span className="text-zinc-600 font-mono select-none text-base">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default HabitosPage;
