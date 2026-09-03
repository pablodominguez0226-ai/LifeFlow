import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  RotateCw,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface RecurringRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesChanged?: () => void;
}

export interface RecurringRule {
  id: string;
  dayOfWeek: number; // 0 = Dom, 1 = Lun, ..., 6 = Sáb
  startTime: string; // "08:00"
  endTime: string; // "11:00"
  durationMinutes: number;
  title: string;
  category: string;
  flexibility: string;
  isFixed: boolean;
  energyLevel: string;
  justification?: string | null;
  notes?: string | null;
  location?: string | null;
  isActive: boolean;
}

const DAY_NAMES = [
  { value: 1, label: 'Lunes', short: 'LUN' },
  { value: 2, label: 'Martes', short: 'MAR' },
  { value: 3, label: 'Miércoles', short: 'MIÉ' },
  { value: 4, label: 'Jueves', short: 'JUE' },
  { value: 5, label: 'Viernes', short: 'VIE' },
  { value: 6, label: 'Sábado', short: 'SÁB' },
  { value: 0, label: 'Domingo', short: 'DOM' },
];

export const RecurringRulesModal: React.FC<RecurringRulesModalProps> = ({
  isOpen,
  onClose,
  onRulesChanged,
}) => {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'ALL'>('ALL');

  // Form State (Add / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    title: '',
    category: 'ACADEMIA',
    startTime: '08:00',
    endTime: '11:00',
    flexibility: 'FIJA',
    isFixed: true,
    energyLevel: 'ALTA',
    location: 'Facultad',
    justification: '',
    notes: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRecurringRules();
      setRules(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRules();
      setIsEditing(false);
      setEditingId(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setFormData({
      dayOfWeek: selectedDayFilter === 'ALL' ? 1 : selectedDayFilter,
      title: '',
      category: 'ACADEMIA',
      startTime: '08:00',
      endTime: '11:00',
      flexibility: 'FIJA',
      isFixed: true,
      energyLevel: 'ALTA',
      location: 'Facultad',
      justification: '',
      notes: '',
      isActive: true,
    });
    setEditingId(null);
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (rule: RecurringRule) => {
    setFormData({
      dayOfWeek: rule.dayOfWeek,
      title: rule.title,
      category: rule.category,
      startTime: rule.startTime,
      endTime: rule.endTime,
      flexibility: rule.flexibility,
      isFixed: rule.isFixed,
      energyLevel: rule.energyLevel,
      location: rule.location || '',
      justification: rule.justification || '',
      notes: rule.notes || '',
      isActive: rule.isActive,
    });
    setEditingId(rule.id);
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleToggleActive = async (rule: RecurringRule) => {
    try {
      await api.updateRecurringRule(rule.id, { isActive: !rule.isActive });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      );
      if (onRulesChanged) onRulesChanged();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este horario fijo recurrente?')) return;
    try {
      await api.deleteRecurringRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      if (onRulesChanged) onRulesChanged();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('El título del compromiso es obligatorio.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      if (editingId) {
        // Update
        const updated = await api.updateRecurringRule(editingId, formData);
        setRules((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      } else {
        // Create
        const created = await api.createRecurringRule(formData);
        setRules((prev) => [...prev, created]);
      }

      setIsEditing(false);
      setEditingId(null);
      if (onRulesChanged) onRulesChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la regla recurrente');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRules = rules.filter((r) =>
    selectedDayFilter === 'ALL' ? true : r.dayOfWeek === selectedDayFilter
  );

  const getDayName = (dayOfWeek: number) => {
    return DAY_NAMES.find((d) => d.value === dayOfWeek)?.label || 'Día';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ACADEMIA':
        return 'bg-[#2A0808] text-red-300 border-[#5C1313]';
      case 'GIMNASIO':
        return 'bg-[#291307] text-orange-300 border-[#5E2B0D]';
      case 'DEPORTE':
        return 'bg-[#0A2613] text-emerald-300 border-[#165E30]';
      case 'LECTURA':
        return 'bg-[#181818] text-zinc-300 border-[#2A2A2A]';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-intense/10 border border-red-intense/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-red-intense" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Horarios Fijos & Cursadas Semanales
              </h2>
              <p className="text-xs text-zinc-400">
                Administra tus compromisos recurrentes. El Planning Engine los inyectará automáticamente en cada semana generada.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-dark-cardSecondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subheader: Filter by Day and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Day Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-dark-cardSecondary rounded-2xl border border-dark-borderSubtle">
              <button
                onClick={() => setSelectedDayFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDayFilter === 'ALL'
                    ? 'bg-red-intense text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({rules.length})
              </button>
              {DAY_NAMES.map((d) => {
                const count = rules.filter((r) => r.dayOfWeek === d.value).length;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDayFilter(d.value)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedDayFilter === d.value
                        ? 'bg-red-intense text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.short} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-intense/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Horario Fijo</span>
            </button>
          </div>

          {/* Form Overlay / Drawer if Editing or Adding */}
          {isEditing && (
            <div className="p-5 bg-dark-cardSecondary border border-red-intense/40 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-intense" />
                  <h3 className="text-sm font-bold text-white">
                    {editingId ? 'Editar Horario Fijo' : 'Crear Nuevo Horario Fijo'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Título de la Cursada o Compromiso *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej. Cursada: Inteligencia Artificial"
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    />
                  </div>

                  {/* Day of Week */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Día de la Semana
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) =>
                        setFormData({ ...formData, dayOfWeek: Number(e.target.value) })
                      }
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    >
                      {DAY_NAMES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Start Time */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Hora Inicio (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Hora Fin (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-intense"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    >
                      <option value="ACADEMIA">Academia (Cursada/Consulta)</option>
                      <option value="GIMNASIO">Gimnasio</option>
                      <option value="DEPORTE">Deporte (Fútbol/Rugby)</option>
                      <option value="LECTURA">Lectura</option>
                      <option value="PERSONAL">Personal / Buffer</option>
                      <option value="DESCANSO">Descanso</option>
                    </select>
                  </div>

                  {/* Flexibility */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Flexibilidad
                    </label>
                    <select
                      value={formData.flexibility}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          flexibility: e.target.value,
                          isFixed: e.target.value === 'FIJA',
                        })
                      }
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    >
                      <option value="FIJA">FIJA (Inamovible)</option>
                      <option value="FLEXIBLE">FLEXIBLE (Reubicable)</option>
                      <option value="OPCIONAL">OPCIONAL (Sacrificable)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Location */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Ubicación / Traslado
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ej. Facultad (10 min traslado)"
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    />
                  </div>

                  {/* Justification */}
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                      Justificación / Regla
                    </label>
                    <input
                      type="text"
                      value={formData.justification}
                      onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                      placeholder="Ej. Cursada universitaria obligatoria"
                      className="w-full bg-black border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-intense"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ruleIsFixed"
                      checked={formData.isFixed}
                      onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
                      className="rounded bg-black border-dark-border text-red-intense"
                    />
                    <label htmlFor="ruleIsFixed" className="text-xs text-zinc-300 cursor-pointer">
                      Bloqueo estricto (isFixed = true)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-dark-card border border-dark-border"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 bg-red-intense hover:bg-red-hover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar Horario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Rules List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RotateCw className="w-6 h-6 text-red-intense animate-spin" />
              <span className="text-xs text-zinc-500">Cargando reglas semanales...</span>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No hay horarios fijos registrados para este filtro.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRules.map((rule) => {
                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rule.isActive
                        ? 'bg-dark-cardSecondary/70 border-dark-borderSubtle hover:border-zinc-700'
                        : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-16 text-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block">
                          {getDayName(rule.dayOfWeek).slice(0, 3)}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {rule.startTime}
                        </span>
                      </div>

                      <div className="w-[1px] h-8 bg-zinc-800 shrink-0 hidden sm:block" />

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{rule.title}</h4>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getCategoryColor(
                              rule.category
                            )}`}
                          >
                            {rule.category}
                          </span>
                          {rule.isFixed ? (
                            <span className="flex items-center gap-1 text-[9px] text-red-400 font-mono">
                              <Lock className="w-2.5 h-2.5" /> Fija
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
                              <Unlock className="w-2.5 h-2.5" /> {rule.flexibility}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 truncate">
                          {rule.startTime} — {rule.endTime} ({rule.durationMinutes} min)
                          {rule.location ? ` • ${rule.location}` : ''}
                          {rule.justification ? ` • ${rule.justification}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(rule)}
                        title={rule.isActive ? 'Desactivar regla' : 'Activar regla'}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border transition-all ${
                          rule.isActive
                            ? 'bg-[#0A2613] text-emerald-300 border-[#165E30]'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {rule.isActive ? 'Activo' : 'Pausado'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(rule)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Editar regla"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-dark-border bg-dark-card flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            {rules.filter((r) => r.isActive).length} reglas activas configuradas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-cardSecondary hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold border border-dark-border transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
