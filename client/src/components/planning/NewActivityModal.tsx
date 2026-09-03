import React, { useState } from 'react';
import { api } from '../../api/client';
import { X } from 'lucide-react';

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
  const [date, setDate] = useState('2026-09-02');
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white">Nueva Actividad / Bloque</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-cardHover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">Nombre de la actividad</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Sesión de estudio o Gimnasio"
            className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-intense"
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
              className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-intense"
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
              className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Hora Inicio</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
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
              className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">Nivel de Energía Requerido</label>
          <select
            value={energyLevel}
            onChange={(e) => setEnergyLevel(e.target.value)}
            className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-intense"
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
            className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Actividad'}
          </button>
        </div>
      </form>
    </div>
  );
};
