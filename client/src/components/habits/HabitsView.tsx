import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/client';
import {
  Sparkles,
  Flame,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Target,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface HabitLogItem {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

interface HabitItem {
  id: string;
  title: string;
  category: string;
  targetFrequency: number;
  frequencyUnit: string;
  isActive: boolean;
  streak: number;
  logs: HabitLogItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const HabitsView: React.FC = () => {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous, etc.

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('ESTUDIO');
  const [formTarget, setFormTarget] = useState(7);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await api.getHabits();
      setHabits(data);
    } catch (err) {
      console.error('Error cargando hábitos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  // Compute the 7 days of the selected week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const today = new Date();
    // Shift by weekOffset weeks
    const ref = new Date(today);
    ref.setDate(today.getDate() + weekOffset * 7);

    const dayOfWeek = ref.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() + diffToMonday);

    const days = [];
    const shortLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = toDateStr(today);

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = toDateStr(current);
      days.push({
        shortLabel: shortLabels[i],
        dayName: dayNames[i],
        dayNum: current.getDate(),
        monthNum: current.getMonth() + 1,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [weekOffset]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleToggleDay = async (habitId: string, dateStr: string) => {
    // 1. Optimistic UI update
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const existingLog = habit.logs.find((l) => l.date === dateStr);
        let newLogs = [...habit.logs];
        if (existingLog) {
          newLogs = newLogs.map((l) =>
            l.date === dateStr ? { ...l, completed: !l.completed } : l
          );
        } else {
          newLogs.push({
            id: `temp-${Date.now()}`,
            habitId,
            date: dateStr,
            completed: true,
          });
        }
        return {
          ...habit,
          logs: newLogs,
        };
      })
    );

    // 2. Persist to SQLite backend
    try {
      const updatedHabit = await api.toggleHabitDay(habitId, dateStr);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...updatedHabit } : h))
      );
    } catch (err) {
      console.error('Error al marcar hábito en SQLite:', err);
      // Revert on error
      loadHabits();
    }
  };

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setFormTitle('');
    setFormCategory('ESTUDIO');
    setFormTarget(7);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (habit: HabitItem) => {
    setEditingHabit(habit);
    setFormTitle(habit.title);
    setFormCategory(habit.category);
    setFormTarget(habit.targetFrequency);
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingHabit) {
        await api.updateHabit(editingHabit.id, {
          title: formTitle.trim(),
          category: formCategory,
          targetFrequency: formTarget,
        });
      } else {
        await api.createHabit({
          title: formTitle.trim(),
          category: formCategory,
          targetFrequency: formTarget,
          frequencyUnit: 'SEMANAL',
        });
      }
      setIsModalOpen(false);
      loadHabits();
    } catch (err) {
      console.error('Error guardando hábito:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('¿Eliminar este hábito y su historial?')) return;
    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (err) {
      console.error('Error eliminando hábito:', err);
    }
  };

  // Metrics
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) =>
    h.logs.some((l) => l.date === todayStr && l.completed)
  ).length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;

  const totalWeeklyChecks = habits.reduce((acc, h) => {
    return (
      acc +
      h.logs.filter((l) => weekDays.some((d) => d.dateStr === l.date) && l.completed).length
    );
  }, 0);
  const totalPossibleChecks = totalHabits * 7;
  const weeklyConsistency =
    totalPossibleChecks > 0 ? Math.round((totalWeeklyChecks / totalPossibleChecks) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#09090B] text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Matriz de Hábitos Diarios
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 pl-10.5">
            Check-in diario de 1 clic, rachas acumuladas y consistencia semanal (L a D)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-[#E4E4E7] shadow transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Hábito</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-[#121215] border border-[#27272A] rounded-2xl space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Hábitos Activos
          </span>
          <span className="text-2xl font-black text-white font-mono">{totalHabits}</span>
        </div>

        <div className="p-4 bg-[#121215] border border-[#27272A] rounded-2xl space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Completados Hoy
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-white">{completedTodayCount}</span>
            <span className="text-xs text-zinc-500">/ {totalHabits}</span>
          </div>
        </div>

        <div className="p-4 bg-[#121215] border border-[#27272A] rounded-2xl space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Racha Máxima
          </span>
          <div className="flex items-center gap-1.5 text-white font-mono">
            <Flame className="w-5 h-5 text-white fill-white" />
            <span className="text-2xl font-black">{maxStreak} días</span>
          </div>
        </div>

        <div className="p-4 bg-[#121215] border border-[#27272A] rounded-2xl space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Consistencia Semanal
          </span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-white">{weeklyConsistency}%</span>
            <span className="text-xs text-zinc-500">({totalWeeklyChecks}/{totalPossibleChecks})</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA DE CHECK-IN DE "HOY" (PRIORITARIA EN MÓVIL) CON BOTONES TÁCTILES    */}
      {/* ========================================================================= */}
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Check-in de Hoy
              </h3>
              <p className="text-[11px] text-zinc-400">
                Toca para marcar o desmarcar tus hábitos del día con botones táctiles rápidos
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-300">
            {completedTodayCount} / {totalHabits}
          </span>
        </div>

        {/* Habit Cards with Big Tactile Touch Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {habits.map((habit) => {
            const isChecked = habit.logs.some(
              (l) => l.date === todayStr && l.completed
            );
            return (
              <div
                key={`today-card-${habit.id}`}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-sm ${
                  isChecked
                    ? 'bg-[#18181B] border-zinc-700/70'
                    : 'bg-[#09090B] border-[#27272A] hover:border-zinc-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {habit.category}
                    </span>
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300">
                      <Flame className="w-3.5 h-3.5 text-white fill-white" />
                      <span>{habit.streak}d</span>
                    </div>
                  </div>
                  <h4
                    className={`text-sm font-bold mt-1.5 leading-snug truncate ${
                      isChecked ? 'text-zinc-400 line-through' : 'text-white'
                    }`}
                  >
                    {habit.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Meta: {habit.targetFrequency}x / semana
                  </p>
                </div>

                {/* Big Tactile Action Button */}
                <button
                  onClick={() => handleToggleDay(habit.id, todayStr)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 shadow-sm ${
                    isChecked
                      ? 'bg-white text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.35)]'
                      : 'bg-[#18181B] border-2 border-[#27272A] hover:border-white text-zinc-500 hover:text-white'
                  }`}
                  title={isChecked ? 'Completado hoy (tocar para desmarcar)' : 'Marcar completado hoy'}
                  aria-label={`Marcar ${habit.title}`}
                >
                  {isChecked ? (
                    <Check className="w-7 h-7 stroke-[3.5]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-zinc-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Navigator & Daily Grid Container */}
      <div className="bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
        {/* Week Navigator Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-white font-mono">
              Semana del {weekDays[0].dayNum}/{weekDays[0].monthNum} al {weekDays[6].dayNum}/{weekDays[6].monthNum}
            </span>
            {weekOffset === 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#18181B] text-zinc-300 border border-[#27272A]">
                Semana Actual
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                weekOffset === 0
                  ? 'bg-[#18181B] text-zinc-600 border border-transparent cursor-default'
                  : 'bg-[#18181B] border border-[#27272A] text-white hover:border-zinc-500 cursor-pointer'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DAILY GRID TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#27272A] text-xs font-mono text-zinc-400">
                <th className="pb-3 pr-4 font-semibold">Hábito</th>
                <th className="pb-3 px-3 text-center font-semibold w-24">Racha</th>
                {weekDays.map((day) => (
                  <th key={day.dateStr} className="pb-3 px-1.5 text-center w-12 sm:w-14">
                    <div
                      className={`flex flex-col items-center py-1 rounded-lg transition-colors ${
                        day.isToday ? 'bg-[#18181B] border border-zinc-700 text-white font-bold' : ''
                      }`}
                    >
                      <span className="text-[11px] uppercase tracking-wider">{day.shortLabel}</span>
                      <span className="text-[10px] text-zinc-500">{day.dayNum}</span>
                    </div>
                  </th>
                ))}
                <th className="pb-3 pl-3 text-right font-semibold w-20">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#27272A]/60">
              {habits.map((habit) => (
                <tr key={habit.id} className="group hover:bg-[#18181B]/40 transition-colors">
                  {/* Habit Title & Category */}
                  <td className="py-3.5 pr-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {habit.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-500">
                          {habit.category}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">
                          · {habit.targetFrequency}x/sem
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Streak Badge */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs font-bold text-white shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-white fill-white" />
                      <span>{habit.streak}d</span>
                    </div>
                  </td>

                  {/* 7 Day check-in boxes (L, M, M, J, V, S, D) */}
                  {weekDays.map((day) => {
                    const isChecked = habit.logs.some(
                      (l) => l.date === day.dateStr && l.completed
                    );
                    return (
                      <td key={day.dateStr} className="py-3.5 px-1.5 text-center">
                        <button
                          onClick={() => handleToggleDay(habit.id, day.dateStr)}
                          title={`${habit.title} - ${day.dayName} ${day.dayNum}/${day.monthNum}: ${
                            isChecked ? 'Completado (clic para desmarcar)' : 'Pendiente (clic para marcar)'
                          }`}
                          className={`w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-white text-zinc-950 font-black border border-white hover:bg-[#E4E4E7] shadow'
                              : 'bg-[#09090B] border border-[#27272A] text-zinc-600 hover:border-zinc-400 hover:text-white'
                          }`}
                        >
                          {isChecked ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-mono font-medium opacity-60">
                              {day.shortLabel}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Actions (Edit / Delete) */}
                  <td className="py-3.5 pl-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(habit)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
                        title="Editar hábito"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-[#18181B] transition-colors cursor-pointer"
                        title="Eliminar hábito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREAR / EDITAR HÁBITO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white" />
                <h3 className="text-base font-bold text-white">
                  {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold block">Nombre del hábito</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Levantarse temprano, Lectura, Gimnasio..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-semibold block">Categoría</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white focus:outline-none focus:border-white transition-colors cursor-pointer"
                    >
                      <option value="SUENO">SUENO (Descanso)</option>
                      <option value="LECTURA">LECTURA</option>
                      <option value="ESTUDIO">ESTUDIO</option>
                      <option value="FINANZAS">FINANZAS / TRADING</option>
                      <option value="PERSONAL">PERSONAL / ORDEN</option>
                      <option value="DESCANSO">DESCANSO</option>
                      <option value="GIMNASIO">GIMNASIO / DEPORTE</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-semibold block">Meta semanal (días)</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      required
                      value={formTarget}
                      onChange={(e) => setFormTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#18181B] border border-[#27272A] rounded-xl text-white font-mono focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18181B] border border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-500 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-[#E4E4E7] shadow transition-all cursor-pointer"
                >
                  {editingHabit ? 'Guardar Cambios' : 'Crear Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
