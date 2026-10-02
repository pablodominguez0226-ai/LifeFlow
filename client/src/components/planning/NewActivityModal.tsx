import React, { useState } from 'react';
import { api } from '../../api/client';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewActivityModal: React.FC<NewActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ACADEMIA');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [flexibility, setFlexibility] = useState('FLEXIBLE');
  const [energyLevel, setEnergyLevel] = useState('MEDIA');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const [hours, minutes] = time.split(':').map(Number);
      const start = new Date(`${date}T00:00:00Z`);
      start.setUTCHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + durationMinutes * 60000);

      await api.createBlock({
        title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: Number(durationMinutes),
        category,
        flexibility,
        isFixed: flexibility === 'FIJA',
        energyLevel,
        justification: justification || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white">Nueva Actividad / Bloque</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nombre de la actividad</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Sesión de estudio o Gimnasio"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-zinc-500"
              >
                <option value="ACADEMIA">Academia</option>
                <option value="GIMNASIO">Gimnasio</option>
                <option value="DEPORTE">Deporte</option>
                <option value="LECTURA">Lectura</option>
                <option value="MERCADO">Mercado</option>
                <option value="PERSONAL">Personal / Mandados</option>
                <option value="DESCANSO">Descanso</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Flexibilidad</label>
              <select
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-zinc-500"
              >
                <option value="FLEXIBLE">Flexible (Mover según prioridad)</option>
                <option value="FIJA">Fija (No mover automáticamente)</option>
                <option value="OPCIONAL">Opcional (Eliminar si sobrecarga)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Hora Inicio</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Duración (min)</label>
              <input
                type="number"
                step="15"
                min="15"
                max="240"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nivel de Energía Requerido</label>
            <select
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-zinc-500"
            >
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Motivo / Notas</label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej. Preparación previa a consulta"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Crear Actividad'}
          </button>
        </div>
      </form>
    </div>
  );
};
