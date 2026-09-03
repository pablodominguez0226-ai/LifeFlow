import React from 'react';
import { Sparkles, Plus, Clock, RefreshCw, Calendar } from 'lucide-react';

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
    <header className="h-16 border-b border-dark-border bg-black px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-white tracking-tight">{getTabTitle()}</h2>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-dark-cardSecondary text-zinc-400 border border-dark-border">
          Semestre 2026-2
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {onSync && (
          <button
            onClick={onSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-600 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        )}

        <button
          onClick={onOpenDailyPlanner}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Planificar mi día</span>
        </button>

        {onOpenRecurringRules && (
          <button
            onClick={onOpenRecurringRules}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-cardSecondary text-zinc-200 border border-dark-border hover:border-red-intense hover:text-white transition-all"
            title="Administrar horarios fijos y cursadas recurrentes"
          >
            <Calendar className="w-3.5 h-3.5 text-red-intense" />
            <span>Horarios Fijos</span>
          </button>
        )}

        <button
          onClick={onOpenWeeklyGenerator}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-cardSecondary text-zinc-200 border border-dark-border hover:border-red-intense hover:text-white transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-red-intense" />
          <span>Generar semana</span>
        </button>

        <button
          onClick={onOpenNewActivity}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-600 hover:text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Actividad</span>
        </button>
      </div>
    </header>
  );
};
