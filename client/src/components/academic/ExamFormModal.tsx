import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Calendar, Clock, Flame, Sparkles, AlertCircle, Trash2 } from 'lucide-react';

export interface ExamData {
  id?: string;
  subjectId: string;
  title: string;
  type: string;
  date: string | Date;
  weight: number;
  targetHoursEstimate: number;
  completedHours?: number;
  notes?: string;
}

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects?: Array<{ id: string; name: string }>;
  subjectId: string;
  subjectName?: string;
  examToEdit?: ExamData | null;
  onSuccess: () => Promise<void> | void;
  onDelete?: (id: string, title: string) => Promise<void> | void;
}

const getInitialDate = (dateVal?: string | Date): string => {
  if (!dateVal) return '';
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const ExamModalContent: React.FC<{
  subjects?: Array<{ id: string; name: string }>;
  subjectId: string;
  subjectName?: string;
  examToEdit?: ExamData | null;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onDelete?: (id: string, title: string) => Promise<void> | void;
}> = ({ subjects, subjectId, subjectName, examToEdit, onClose, onSuccess, onDelete }) => {
  const isEditing = Boolean(examToEdit?.id);

  const [selectedSubjectId, setSelectedSubjectId] = useState(examToEdit?.subjectId || subjectId);
  const [title, setTitle] = useState(examToEdit?.title || '');
  const [type, setType] = useState(examToEdit?.type || 'PARCIAL_1');
  const [date, setDate] = useState(getInitialDate(examToEdit?.date));
  const [weight, setWeight] = useState(examToEdit?.weight ?? 3.0);
  const [targetHoursEstimate, setTargetHoursEstimate] = useState(examToEdit?.targetHoursEstimate ?? 20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSubjectName =
    subjects?.find((s) => s.id === selectedSubjectId)?.name || subjectName || 'Materia';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor indica el título del examen.');
      return;
    }
    if (!date) {
      setError('Por favor selecciona la fecha del examen.');
      return;
    }
    if (!selectedSubjectId) {
      setError('Por favor selecciona una materia.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construct noon UTC ISO string to prevent date shift across time zones
      const isoDate = new Date(`${date}T12:00:00.000Z`).toISOString();

      if (isEditing && examToEdit?.id) {
        await api.updateExam(examToEdit.id, {
          subjectId: selectedSubjectId,
          title: title.trim(),
          type,
          date: isoDate,
          weight: Number(weight),
          targetHoursEstimate: Number(targetHoursEstimate),
        });
      } else {
        await api.createExam({
          subjectId: selectedSubjectId,
          title: title.trim(),
          type,
          date: isoDate,
          weight: Number(weight),
          targetHoursEstimate: Number(targetHoursEstimate),
        });
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error guardando examen:', err);
      setError(err.message || 'Ocurrió un error al guardar el examen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!examToEdit?.id) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el examen "${title}"?`)) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (onDelete) {
        await onDelete(examToEdit.id, title);
      } else {
        await api.deleteExam(examToEdit.id);
        await onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Error eliminando examen:', err);
      setError(err.message || 'Ocurrió un error al eliminar el examen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 flex items-start justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isEditing ? 'Editar Examen' : 'Nuevo Examen / Parcial'}
            </h3>
            <p className="text-xs text-zinc-400">
              Materia: <span className="text-white font-medium">{currentSubjectName}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
          {/* Error notification */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        {/* Materia selector (if multiple subjects exist) */}
        {subjects && subjects.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Materia Asignada
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Título */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Título del Examen
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. 1.º Parcial Paradigmas"
            className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Tipo de examen & Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Tipo de Examen
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="PARCIAL_1">1.º Parcial (PARCIAL_1)</option>
              <option value="PARCIAL_2">2.º Parcial (PARCIAL_2)</option>
              <option value="FINAL">Examen Final (FINAL)</option>
              <option value="GLOBAL">Examen Global / Integrador (GLOBAL)</option>
              <option value="PRACTICO">Parcial Práctico / TP (PRACTICO)</option>
              <option value="CONSULTA">Clase de Consulta (CONSULTA)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span>Fecha del Examen</span>
              <span className="text-[10px] text-zinc-500 font-mono">YYYY-MM-DD</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Peso / Importancia (1 a 5) & Horas estimadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-zinc-400" />
                Peso / Importancia
              </span>
              <span className="font-mono text-xs font-bold text-zinc-200">{weight} / 5</span>
            </label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(Math.min(5, Math.max(1, Number(e.target.value))))}
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              1 (Bajo) • 3 (Estándar) • 5 (Crítico)
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Horas de Estudio
              </span>
              <span className="font-mono text-xs font-bold text-zinc-200">{targetHoursEstimate}h</span>
            </label>
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              value={targetHoursEstimate}
              onChange={(e) => setTargetHoursEstimate(Math.max(1, Number(e.target.value)))}
              placeholder="20"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Meta recomendada de preparación
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 text-[11px] text-zinc-400 bg-[#18181B] p-2.5 rounded-xl border border-[#27272A]">
          <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            Al guardar, el motor recalculará inmediatamente la prioridad y los días restantes de la materia.
          </span>
        </div>

        </div>

        {/* Footer Actions */}
        <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex items-center justify-between gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDeleteFromModal}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : isEditing ? (
                <span>Guardar Cambios</span>
              ) : (
                <span>+ Guardar Examen</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  subjects,
  subjectId,
  subjectName,
  examToEdit,
  onSuccess,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <ExamModalContent
        key={examToEdit?.id || 'new-exam'}
        subjects={subjects}
        subjectId={subjectId}
        subjectName={subjectName}
        examToEdit={examToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />
    </div>
  );
};
