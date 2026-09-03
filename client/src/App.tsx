import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { AcademicView } from './components/academic/AcademicView';
import { SportsView } from './components/sports/SportsView';
import { HabitsView } from './components/habits/HabitsView';
import { StatsView } from './components/stats/StatsView';

import { WeeklyGeneratorModal } from './components/planning/WeeklyGeneratorModal';
import { DailyPlanModal } from './components/planning/DailyPlanModal';
import { ReplanModal } from './components/planning/ReplanModal';
import { NewActivityModal } from './components/planning/NewActivityModal';
import { RecurringRulesModal } from './components/planning/RecurringRulesModal';

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
      case 'readings':
        return <HabitsView key={refreshKey} />;
      case 'stats':
        return <StatsView key={refreshKey} />;
      case 'settings':
        return (
          <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-black text-white">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Configuración del Sistema</h2>
            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl max-w-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Restricciones Personales Inviolables</h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                  <span className="text-zinc-400">Hora máxima de dormir:</span>
                  <span className="font-bold text-red-intense">00:00 (Protegida)</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                  <span className="text-zinc-400">Hora objetivo despertar:</span>
                  <span className="font-bold text-white">06:30 — 07:00</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                  <span className="text-zinc-400">Horas objetivo de sueño:</span>
                  <span className="font-bold text-white">7.5 horas</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                  <span className="text-zinc-400">Capacidad máx. concentración:</span>
                  <span className="font-bold text-white">120 minutos (bloques de 50m + 10m)</span>
                </div>
                <div className="flex justify-between p-3 bg-dark-cardSecondary rounded-xl border border-dark-borderSubtle">
                  <span className="text-zinc-400">Buffer personal mínimo:</span>
                  <span className="font-bold text-accent-orange">15% del tiempo libre semanal</span>
                </div>
              </div>
            </div>

            {/* Recurring Schedule Rules Card */}
            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Horarios Fijos & Cursadas Semanales</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configura tus materias fijas, días de gimnasio, deportes y descanso recurrente.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecurringRulesOpen(true)}
                  className="px-4 py-2 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-intense/20"
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
            onOpenReplan={(taskId) => setReplanTaskId(taskId)}
            onOpenDailyPlanner={() => setIsDailyPlanOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-red-intense/30 selection:text-red-primary">
      {/* Fixed Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        <Header
          currentTab={currentTab}
          onOpenDailyPlanner={() => setIsDailyPlanOpen(true)}
          onOpenWeeklyGenerator={() => setIsWeeklyGenOpen(true)}
          onOpenNewActivity={() => setIsNewActivityOpen(true)}
          onOpenRecurringRules={() => setIsRecurringRulesOpen(true)}
          onSync={handleDataChange}
        />

        <main className="flex-1 overflow-y-auto pb-12 bg-black">
          {renderContent()}
        </main>
      </div>

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
