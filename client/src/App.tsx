import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { AcademicView } from './components/academic/AcademicView';
import { SportsView } from './components/sports/SportsView';
import { HabitsView } from './components/habits/HabitsView';
import { ReadingView } from './components/reading/ReadingView';
import { StatsView } from './components/stats/StatsView';

import { WeeklyGeneratorModal } from './components/planning/WeeklyGeneratorModal';
import { DailyPlanModal } from './components/planning/DailyPlanModal';
import { ReplanModal } from './components/planning/ReplanModal';
import { NewActivityModal } from './components/planning/NewActivityModal';
import { RecurringRulesModal } from './components/planning/RecurringRulesModal';
import {
  LayoutDashboard,
  Calendar,
  Heart,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { Logo } from './components/common/Logo';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modal control states
  const [isWeeklyGenOpen, setIsWeeklyGenOpen] = useState(false);
  const [isDailyPlanOpen, setIsDailyPlanOpen] = useState(false);
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isRecurringRulesOpen, setIsRecurringRulesOpen] = useState(false);
  const [replanTaskId, setReplanTaskId] = useState<string | null>(null);

  // Key to force re-render/refetch across views on mutation
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            key={refreshKey}
            onNavigateToCalendar={() => setCurrentTab('calendar')}
            onNavigateToAcademic={() => setCurrentTab('academic')}
            onNavigateToSports={() => setCurrentTab('sports')}
            onOpenReplan={(taskId) => setReplanTaskId(taskId)}
            onOpenDailyPlanner={() => setIsDailyPlanOpen(true)}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            key={refreshKey}
            onOpenReplan={(taskId) => setReplanTaskId(taskId)}
            onOpenNewActivity={() => setIsNewActivityOpen(true)}
          />
        );
      case 'academic':
        return <AcademicView key={refreshKey} />;
      case 'sports':
        return <SportsView key={refreshKey} />;
      case 'habits':
        return <HabitsView key={refreshKey} />;
      case 'readings':
        return <ReadingView key={refreshKey} />;
      case 'stats':
        return <StatsView key={refreshKey} />;
      case 'settings':
        return (
          <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-[#09090B] text-white">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Configuración del Sistema</h2>
            <div className="bg-[#121215] border border-[#27272A] p-6 rounded-2xl max-w-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Restricciones Personales Inviolables</h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-3 bg-[#18181B] rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Hora máxima de dormir:</span>
                  <span className="font-bold text-zinc-200">00:00 (Protegida)</span>
                </div>
                <div className="flex justify-between p-3 bg-[#18181B] rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Hora objetivo despertar:</span>
                  <span className="font-bold text-white">06:30 — 07:00</span>
                </div>
                <div className="flex justify-between p-3 bg-[#18181B] rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Horas objetivo de sueño:</span>
                  <span className="font-bold text-white">7.5 horas</span>
                </div>
                <div className="flex justify-between p-3 bg-[#18181B] rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Capacidad máx. concentración:</span>
                  <span className="font-bold text-white">120 minutos (bloques de 50m + 10m)</span>
                </div>
                <div className="flex justify-between p-3 bg-[#18181B] rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">Buffer personal mínimo:</span>
                  <span className="font-bold text-zinc-300">15% del tiempo libre semanal</span>
                </div>
              </div>
            </div>

            {/* Recurring Schedule Rules Card */}
            <div className="bg-[#121215] border border-[#27272A] p-6 rounded-2xl max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Horarios Fijos & Cursadas Semanales</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configura tus materias fijas, días de gimnasio, deportes y descanso recurrente.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecurringRulesOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-[#E4E4E7] text-zinc-950 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  Administrar Horarios
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <DashboardView
            key={refreshKey}
            onNavigateToCalendar={() => setCurrentTab('calendar')}
            onNavigateToAcademic={() => setCurrentTab('academic')}
            onNavigateToSports={() => setCurrentTab('sports')}
            onOpenReplan={(taskId) => setReplanTaskId(taskId)}
            onOpenDailyPlanner={() => setIsDailyPlanOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] text-white selection:bg-white/20 selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090B]">
        <Header
          currentTab={currentTab}
          onOpenDailyPlanner={() => setIsDailyPlanOpen(true)}
          onOpenWeeklyGenerator={() => setIsWeeklyGenOpen(true)}
          onOpenNewActivity={() => setIsNewActivityOpen(true)}
          onOpenRecurringRules={() => setIsRecurringRulesOpen(true)}
          onSync={handleDataChange}
        />

        <main className="flex-1 overflow-y-auto pb-28 sm:pb-12 bg-[#09090B]">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (< md) */}
      <nav
        aria-label="Navegación Móvil LifeFlow Lite"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272A] md:hidden px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
      >
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[46px] active:scale-95 cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'stroke-[2.5] scale-105 text-white' : ''}`} />
          <span className={`text-[10px] mt-1 font-semibold tracking-tight ${currentTab === 'dashboard' ? 'text-white font-bold' : ''}`}>
            Hoy
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[46px] active:scale-95 cursor-pointer ${
            currentTab === 'calendar'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className={`w-5 h-5 transition-transform ${currentTab === 'calendar' ? 'stroke-[2.5] scale-105 text-white' : ''}`} />
          <span className={`text-[10px] mt-1 font-semibold tracking-tight ${currentTab === 'calendar' ? 'text-white font-bold' : ''}`}>
            Calendario
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('academic')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[46px] active:scale-95 cursor-pointer ${
            currentTab === 'academic'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <GraduationCap className={`w-5 h-5 transition-transform ${currentTab === 'academic' ? 'stroke-[2.5] scale-105 text-white' : ''}`} />
          <span className={`text-[10px] mt-1 font-semibold tracking-tight ${currentTab === 'academic' ? 'text-white font-bold' : ''}`}>
            Académico
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('habits')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[46px] active:scale-95 cursor-pointer ${
            currentTab === 'habits'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Heart className={`w-5 h-5 transition-transform ${currentTab === 'habits' ? 'stroke-[2.5] scale-105 text-white' : ''}`} />
          <span className={`text-[10px] mt-1 font-semibold tracking-tight ${currentTab === 'habits' ? 'text-white font-bold' : ''}`}>
            Hábitos
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('readings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[46px] active:scale-95 cursor-pointer ${
            currentTab === 'readings'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BookOpen className={`w-5 h-5 transition-transform ${currentTab === 'readings' ? 'stroke-[2.5] scale-105 text-white' : ''}`} />
          <span className={`text-[10px] mt-1 font-semibold tracking-tight ${currentTab === 'readings' ? 'text-white font-bold' : ''}`}>
            Lectura
          </span>
        </button>
      </nav>

      {/* Global Modals */}

      <WeeklyGeneratorModal
        isOpen={isWeeklyGenOpen}
        onClose={() => setIsWeeklyGenOpen(false)}
        onSuccess={handleDataChange}
      />

      <DailyPlanModal
        isOpen={isDailyPlanOpen}
        onClose={() => setIsDailyPlanOpen(false)}
      />

      <ReplanModal
        taskId={replanTaskId}
        onClose={() => setReplanTaskId(null)}
        onSuccess={handleDataChange}
      />

      <NewActivityModal
        isOpen={isNewActivityOpen}
        onClose={() => setIsNewActivityOpen(false)}
        onSuccess={handleDataChange}
      />

      <RecurringRulesModal
        isOpen={isRecurringRulesOpen}
        onClose={() => setIsRecurringRulesOpen(false)}
        onRulesChanged={handleDataChange}
      />
    </div>
  );
}

export default App;
