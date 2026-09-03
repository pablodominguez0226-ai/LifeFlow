import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  Calendar,
  CheckCircle2,
  Plus,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AcademicView: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Form states for new subject
  const [name, setName] = useState('');
  const [type, setType] = useState('CURSADA');
  const [color, setColor] = useState('#E50914');
  const [masteryLevel, setMasteryLevel] = useState('MEDIO');
  const [priorityWeight, setPriorityWeight] = useState(1.5);

  // Form states for new task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('ESTUDIO_PROFUNDO');
  const [estimatedMinutes, setEstimatedMinutes] = useState(90);
  const [energyLevel, setEnergyLevel] = useState('ALTA');

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects(new Date().toISOString());
      setSubjects(res);
      if (!selectedSubject && res.length > 0) {
        setSelectedSubject(res[0]);
      } else if (selectedSubject) {
        const updated = res.find((s: any) => s.id === selectedSubject.id);
        setSelectedSubject(updated || res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject({
        name,
        type,
        color,
        masteryLevel,
        priorityWeight: Number(priorityWeight),
      });
      setName('');
      setShowNewSubjectModal(false);
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      await api.createTask({
        subjectId: selectedSubject.id,
        title: taskTitle,
        taskType,
        estimatedMinutes: Number(estimatedMinutes),
        energyLevel,
      });
      setTaskTitle('');
      setShowNewTaskModal(false);
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopicStatusChange = async (topicId: string, status: string) => {
    try {
      await api.updateTopicStatus(topicId, status);
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
      await api.updateTask(taskId, { status: newStatus });
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500 text-xs font-medium">
        Cargando plan académico y materias...
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 bg-black text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Plan Académico & Materias</h2>
          <p className="text-xs text-zinc-400">
            Seguimiento de cursadas, exámenes parciales y preparación progresiva de finales
          </p>
        </div>

        <button
          onClick={() => setShowNewSubjectModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-md shadow-red-intense/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Materia / Final</span>
        </button>
      </div>

      {/* Grid: Subjects List (Left) + Subject Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subjects Navigation List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {subjects.map((subj) => {
            const isSelected = selectedSubject?.id === subj.id;
            const isFinal = subj.type === 'FINAL';

            return (
              <div
                key={subj.id}
                onClick={() => setSelectedSubject(subj)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#150505] border-red-intense shadow-lg shadow-red-intense/10'
                    : 'bg-dark-card border-dark-border hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-intense" />
                    <h3 className="text-sm font-bold text-white">{subj.name}</h3>
                  </div>

                  {isFinal && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-intense/20 text-red-primary border border-red-intense/40 font-mono">
                      FINAL
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                    <span>Progreso: {subj.progress}%</span>
                    <span>Dominio: {subj.masteryLevel}</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-red-intense transition-all"
                      style={{ width: `${subj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Nearest Exam Preview */}
                {subj.nearestExamDays !== null ? (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Próximo examen:</span>
                    <span className="font-mono font-bold text-red-intense">
                      en {subj.nearestExamDays} días
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500 mt-2 block">
                    Sin examen inmediato
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Subject Deep Dive (8 cols) */}
        {selectedSubject ? (
          <div className="lg:col-span-8 bg-dark-card border border-dark-border rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-dark-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-intense" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {selectedSubject.type}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">{selectedSubject.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedSubject.priorityExplanation}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block font-mono">
                    Priority Score
                  </span>
                  <span className="text-xl font-bold text-red-intense font-mono">
                    {selectedSubject.priorityScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Exams list */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-intense" />
                Exámenes Registrados
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSubject.exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="p-3.5 bg-dark-cardSecondary border border-dark-borderSubtle rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white">{exam.title}</span>
                      <span className="text-xs font-extrabold font-mono text-red-intense">
                        {exam.daysRemaining} días
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                      <span>Fecha: {new Date(exam.date).toLocaleDateString()}</span>
                      <span>Horas: {exam.completedHours}h / {exam.targetHoursEstimate}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics (Temas) */}
            {selectedSubject.topics && selectedSubject.topics.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-intense" />
                  Estructura de Temas & Dominio
                </h3>

                <div className="space-y-2">
                  {selectedSubject.topics.map((topic: any) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 bg-dark-cardSecondary/70 border border-dark-borderSubtle rounded-xl text-xs"
                    >
                      <span className="text-white font-medium">{topic.title}</span>

                      <div className="flex items-center gap-2">
                        <select
                          value={topic.status}
                          onChange={(e) => handleTopicStatusChange(topic.id, e.target.value)}
                          className="bg-black text-zinc-200 border border-dark-border text-[11px] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-red-intense"
                        >
                          <option value="NO_INICIADO">No Iniciado</option>
                          <option value="EN_PROGRESO">En Progreso</option>
                          <option value="DOMINADO">Dominado</option>
                          <option value="REPASAR">Repasar</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-red-intense" />
                  Tareas de Estudio Específicas
                </h3>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="flex items-center gap-1 text-xs text-red-intense hover:text-red-hover font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Tarea
                </button>
              </div>

              <div className="space-y-2">
                {selectedSubject.academicTasks && selectedSubject.academicTasks.length > 0 ? (
                  selectedSubject.academicTasks.map((task: any) => {
                    const isDone = task.status === 'COMPLETADA';
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                          isDone
                            ? 'bg-dark-cardSecondary/30 border-dark-borderSubtle opacity-40'
                            : 'bg-dark-cardSecondary border-dark-borderSubtle hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTaskStatusToggle(task.id, task.status)}
                            className={`p-1 rounded-full border transition-colors ${
                              isDone
                                ? 'bg-red-intense border-red-intense text-white'
                                : 'border-zinc-600 hover:border-zinc-400 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <p
                              className={`font-semibold text-white ${
                                isDone ? 'line-through text-zinc-500' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 font-mono">
                              <span>{task.estimatedMinutes} min</span>
                              <span>•</span>
                              <span>Energía: {task.energyLevel}</span>
                              <span>•</span>
                              <span>{task.taskType.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-red-intense block">
                            Score: {task.priorityScore}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No hay tareas pendientes registradas para esta materia.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal: New Subject / Final */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubject}
            className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">Agregar Nueva Asignatura o Final</h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nombre de la Asignatura</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Redes de Información"
                className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
                >
                  <option value="CURSADA">Cursada</option>
                  <option value="FINAL">Preparación de Final</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Dominio Actual</label>
                <select
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value)}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
                >
                  <option value="BAJO">Bajo</option>
                  <option value="MEDIO">Medio</option>
                  <option value="ALTO">Alto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Peso de Importancia (1-3)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={priorityWeight}
                onChange={(e) => setPriorityWeight(Number(e.target.value))}
                className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setShowNewSubjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-sm"
              >
                Guardar Materia
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Task */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              Nueva Tarea para {selectedSubject?.name}
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Título de la Tarea</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ej. Resolver guía 3 de ejercicios"
                className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Tipo de Estudio</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
                >
                  <option value="ESTUDIO_PROFUNDO">Estudio Profundo</option>
                  <option value="ESTUDIO_LIVIANO">Estudio Liviano / Lectura</option>
                  <option value="EJERCICIOS">Práctica / Ejercicios</option>
                  <option value="SIMULACRO">Simulacro de Examen</option>
                  <option value="REPASO">Repaso</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  step="15"
                  min="30"
                  max="120"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nivel de Energía Requerido</label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full bg-dark-cardSecondary border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-intense"
              >
                <option value="ALTA">Alta (Resolución, lógica, conceptos difíciles)</option>
                <option value="MEDIA">Media (Resúmenes, práctica estructurada)</option>
                <option value="BAJA">Baja (Lectura, ordenar apuntes)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-cardSecondary text-zinc-300 border border-dark-border hover:border-zinc-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-intense text-white hover:bg-red-hover shadow-sm"
              >
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
