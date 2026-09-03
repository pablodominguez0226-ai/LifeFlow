import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Dumbbell,
  Heart,
  BookOpen,
  BarChart3,
  Settings,
  Activity,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'academic', label: 'Académico', icon: GraduationCap },
    { id: 'sports', label: 'Entrenamiento', icon: Dumbbell },
    { id: 'habits', label: 'Hábitos', icon: Heart },
    { id: 'readings', label: 'Lecturas', icon: BookOpen },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black border-r border-dark-border flex flex-col justify-between p-4 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Logo: LIFE in White, FLOW in Intense Red with Pulse Icon */}
        <div className="flex items-center gap-2.5 px-3 py-4 mb-6">
          <Activity className="w-6 h-6 text-red-intense stroke-[2.5]" />
          <div className="flex items-baseline tracking-wider font-extrabold text-xl">
            <span className="text-white">LIFE</span>
            <span className="text-red-intense ml-0.5">FLOW</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-red-intense text-white shadow-lg shadow-red-intense/25'
                    : 'text-zinc-400 hover:text-white hover:bg-dark-cardHover'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile, Dark Mode Switch and Logout */}
      <div className="pt-4 border-t border-dark-border space-y-3">
        {/* Profile Card */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-dark-cardHover cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-dark-border flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              <span className="text-zinc-300">PD</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight">Pablo Dominguez</p>
              <p className="text-[10px] text-zinc-500">Ver perfil</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </div>

        {/* Dark Mode Toggle Switch */}
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-zinc-400 font-medium text-[11px]">Modo Oscuro</span>
          <div className="w-8 h-4 bg-red-intense rounded-full relative cursor-pointer flex items-center p-0.5">
            <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm" />
          </div>
        </div>

        {/* Logout Link */}
        <button
          onClick={() => {}}
          className="w-full flex items-center gap-2 px-2 py-1 text-[11px] font-medium text-red-intense hover:text-red-hover transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
