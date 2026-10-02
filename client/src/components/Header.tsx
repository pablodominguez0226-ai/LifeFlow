import React from 'react';
import { Sparkles, Plus, Clock, RefreshCw, Calendar } from 'lucide-react';
import { Logo } from './common/Logo';

interface HeaderProps {
  currentTab: string;
  onOpenDailyPlanner: () => void;
  onOpenWeeklyGenerator: () => void;
  onOpenNewActivity: () => void;
  onOpenRecurringRules?: () => void;
  onSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenDailyPlanner,
  onOpenWeeklyGenerator,
  onOpenNewActivity,
  onOpenRecurringRules,
  onSync,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'calendar':
        return 'Calendario Semanal';
      case 'academic':
        return 'Plan Académico & Materias';
      case 'sports':
        return 'Entrenamiento & Rendimiento';
      case 'habits':
        return 'Hábitos & Recuperación';
      case 'readings':
        return 'Lecturas Personales';
      case 'stats':
        return 'Estadísticas & Cumplimiento';
      case 'settings':
        return 'Configuración del Sistema';
      default:
        return 'LifeFlow';
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-[#27272A] bg-[#09090B] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={24} className="shrink-0" />
          <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase hidden md:inline">LifeFlow</span>
          <span className="text-zinc-600 hidden md:inline">/</span>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{getTabTitle()}</h2>
          <span className="inline-flex md:hidden items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#18181B] text-zinc-300 border border-[#27272A] shrink-0">
            Lite
          </span>
        </div>
        <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#18181B] text-zinc-400 border border-[#27272A]">
          Semestre 2026-2
        </span>
      </div>

      {/* Desktop Navigation & Actions */}
      <div className="hidden md:flex items-center gap-2.5">
        {onSync && (
          <button
            onClick={onSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sincronizar</span>
          </button>
        )}

        <button
          onClick={onOpenDailyPlanner}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>Planificar mi día</span>
        </button>

        {onOpenRecurringRules && (
          <button
            onClick={onOpenRecurringRules}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
            title="Administrar horarios fijos y cursadas recurrentes"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Horarios Fijos</span>
          </button>
        )}

        <button
          onClick={onOpenWeeklyGenerator}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Generar semana</span>
        </button>

        <button
          onClick={onOpenNewActivity}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span>Actividad</span>
        </button>
      </div>

      {/* Mobile Clean Actions (< md) */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        {onSync && (
          <button
            onClick={onSync}
            className="p-2 rounded-xl bg-[#18181B] text-zinc-400 border border-[#27272A] active:text-white active:border-zinc-500 transition-colors cursor-pointer"
            title="Sincronizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
