import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BookOpen,
  Sparkles,
  Plus,
  Minus,
  ShoppingBag,
} from 'lucide-react';

export const HabitsView: React.FC = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const res = await api.getHabits();
      setHabits(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleToggleStreak = async (habitId: string, increment: boolean) => {
    try {
      await api.toggleHabit(habitId, increment);
      loadHabits();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-black text-white">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Lectura, Hábitos & Buffer Personal
        </h2>
        <p className="text-xs text-zinc-400">
          Descanso cognitivo, desconexión de pantallas y protección del margen de maniobra semanal
        </p>
      </div>

      {/* Reading & Personal Buffer Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Lectura Personal */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-red-intense" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lectura: Filosofía & Psicología</h3>
              <p className="text-xs text-zinc-400">Descanso cognitivo sin pantallas</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Esta lectura <strong>NO</strong> se mezcla con el estudio universitario. Cumple un rol
            reparador en momentos de baja energía:
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-dark-cardSecondary border border-dark-borderSubtle rounded-xl">
              <span className="font-bold text-white block mb-1">Ventana Nocturna</span>
              <span className="text-zinc-400 text-[11px]">
                22:30 a 23:30 para relajar la mente previo al sueño de las 00:00.
              </span>
            </div>

            <div className="p-3 bg-dark-cardSecondary border border-dark-borderSubtle rounded-xl">
              <span className="font-bold text-white block mb-1">Fines de Semana</span>
              <span className="text-zinc-400 text-[11px]">
                Momentos de calma el sábado o domingo por la tarde.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Buffer Personal */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 border border-accent-orange/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent-orange" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Buffer Personal No Negociable</h3>
              <p className="text-xs text-zinc-400">Margen del ~15% de tiempo libre</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            El sistema nunca satura el 100% de la semana. Reserva espacios vacíos para:
          </p>

          <ul className="text-xs text-zinc-400 space-y-1.5 pl-4 list-disc">
            <li>Compras de comida, mandados domésticos y preparación del almuerzo.</li>
            <li>Imprevistos académicos y traslados con margen.</li>
            <li>Mates, pausas espontáneas y vida social tranquila el sábado.</li>
          </ul>

          <div className="p-3 bg-[#241307] border border-[#522507] rounded-xl text-[11px] text-orange-200">
            <strong className="text-white">Principio:</strong> Una planificación real y sostenible exige margen elástico.
          </div>
        </div>
      </div>

      {/* Habits Tracker Grid */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-intense" />
            <h3 className="text-base font-bold text-white">Hábitos Principales & Rachas</h3>
          </div>
          <span className="text-xs text-zinc-400">Pocos, medibles y sin sobrecarga</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="p-4 bg-dark-cardSecondary border border-dark-border rounded-xl flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block font-mono">
                  {habit.category}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{habit.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Meta: {habit.targetFrequency} veces / {habit.frequencyUnit.toLowerCase()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dark-borderSubtle">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-xs text-zinc-500">Racha:</span>
                  <span className="text-sm font-extrabold text-red-intense">{habit.streak} días</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStreak(habit.id, false)}
                    className="p-1.5 rounded-lg bg-black border border-dark-border text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStreak(habit.id, true)}
                    className="p-1.5 rounded-lg bg-red-intense hover:bg-red-hover text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
