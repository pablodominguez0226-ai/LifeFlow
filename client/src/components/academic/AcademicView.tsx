import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { api } from '../../api/client';
import {
  Calendar,
  CheckCircle2,
  Plus,
  BookOpen,
  Layers,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import { ExamFormModal, type ExamData } from './ExamFormModal';

export const AcademicView: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamData | null>(null);

  // Unit & Topic management state
  const [showNewUnitModal, setShowNewUnitModal] = useState(false);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [targetUnitForTopic, setTargetUnitForTopic] = useState<any | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [submittingSessionId, setSubmittingSessionId] = useState<string | null>(null);

  // Form states for unit
  const [unitTitle, setUnitTitle] = useState('');
  const [unitNumber, setUnitNumber] = useState<number | ''>('');

  // Form states for topic
  const [topicTitle, setTopicTitle] = useState('');

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
      setSelectedSubject((prev: any) => {
        if (!prev && res.length > 0) return res[0];
        if (prev) {
          const updated = res.find((s: any) => s.id === prev.id);
          return updated || res[0] || null;
        }
        return null;
      });
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

  const toggleUnitAccordion = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: prev[unitId] === undefined ? false : !prev[unitId],
    }));
  };

  const isUnitExpanded = (unitId: string) => {
    return expandedUnits[unitId] !== false; // default open
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      await api.createUnit(selectedSubject.id, {
        title: unitTitle.trim(),
        unitNumber: unitNumber !== '' ? Number(unitNumber) : undefined,
      });
      setUnitTitle('');
      setUnitNumber('');
      setShowNewUnitModal(false);
      await loadSubjects();
    } catch (err) {
      console.error('Error creando unidad:', err);
    }
  };

  const handleOpenAddTopic = (unit: any) => {
    setTargetUnitForTopic(unit);
    setTopicTitle('');
    setShowNewTopicModal(true);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUnitForTopic) return;
    try {
      await api.createTopic(targetUnitForTopic.id, {
        title: topicTitle.trim(),
      });
      setTopicTitle('');
      setShowNewTopicModal(false);
      await loadSubjects();
    } catch (err) {
      console.error('Error creando tema:', err);
    }
  };

  const handleDeleteUnit = async (unitId: string, title: string) => {
    if (!window.confirm(`¿Eliminar la unidad "${title}" y todos sus temas asociados?`)) return;
    try {
      await api.deleteUnit(unitId);
      await loadSubjects();
    } catch (err) {
      console.error('Error eliminando unidad:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    if (!window.confirm(`¿Eliminar el tema "${title}"?`)) return;
    try {
      await api.deleteTopic(topicId);
      await loadSubjects();
    } catch (err) {
      console.error('Error eliminando tema:', err);
    }
  };

  const handleRecordStudySession = async (topicId: string, isReview: boolean) => {
    try {
      setSubmittingSessionId(topicId);
      await api.recordStudySession(topicId, { force: isReview });
      await loadSubjects();
    } catch (err) {
      console.error('Error registrando sesión de estudio:', err);
    } finally {
      setSubmittingSessionId(null);
    }
  };

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setShowExamModal(true);
  };

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setShowExamModal(true);
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el examen "${examTitle}"?`)) {
      return;
    }
    try {
      await api.deleteExam(examId);
      await loadSubjects();
    } catch (err: any) {
      console.error('Error al eliminar el examen:', err);
      alert(err.message || 'Error al eliminar el examen');
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
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 bg-[#09090B] text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Plan Académico & Materias</h2>
          <p className="text-xs text-zinc-400">
            Seguimiento de cursadas, exámenes parciales y preparación progresiva de finales
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddExam}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>+ Agregar Examen / Parcial</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewSubjectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span>Nueva Materia / Final</span>
          </button>
        </div>
      </div>

      {/* Grid: Subjects List (Left) + Subject Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subjects Navigation List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {subjects.map((subj) => {
            const isSelected = selectedSubject?.id === subj.id;
            const isFinal = subj.type === 'FINAL';
            const isCriticalExam = subj.nearestExamDays !== null && subj.nearestExamDays <= 7;

            return (
              <div
                key={subj.id}
                onClick={() => setSelectedSubject(subj)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18181B] border-zinc-600 shadow-sm ring-1 ring-white/10'
                    : 'bg-[#121215] border-[#27272A] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCriticalExam ? 'bg-red-500' : 'bg-zinc-300'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-white">{subj.name}</h3>
                  </div>

                  {isFinal && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
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
                      className="h-1.5 rounded-full bg-white transition-all"
                      style={{ width: `${subj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Nearest Exam Preview */}
                {subj.nearestExamDays !== null ? (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Próximo examen:</span>
                    <span
                      className={`font-mono font-bold ${
                        isCriticalExam ? 'text-red-400' : 'text-zinc-200'
                      }`}
                    >
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
          <div className="lg:col-span-8 bg-[#121215] border border-[#27272A] rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#27272A]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedSubject.nearestExamDays !== null && selectedSubject.nearestExamDays <= 7
                        ? 'bg-red-500'
                        : 'bg-zinc-300'
                    }`}
                  />
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
                  <span className="text-xl font-bold text-white font-mono">
                    {selectedSubject.priorityScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Exams list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  Próximos Exámenes
                </h3>
                <button
                  type="button"
                  onClick={handleOpenAddExam}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Examen / Parcial</span>
                </button>
              </div>

              {selectedSubject.exams && selectedSubject.exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSubject.exams.map((exam: any) => {
                    const examDateObj = new Date(exam.date);
                    const formattedDate = !isNaN(examDateObj.getTime())
                      ? examDateObj.toLocaleDateString('es-AR', {
                          timeZone: 'UTC',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : 'Fecha a definir';
                    const isCritical = exam.daysRemaining <= 7;

                    return (
                      <div
                        key={exam.id}
                        className="group p-4 bg-[#18181B] border border-[#27272A] hover:border-zinc-700 rounded-xl space-y-3 transition-all relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                                {exam.title}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold">
                                {exam.type}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-400 font-mono block">
                              Fecha: {formattedDate}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg shrink-0 ${
                              isCritical
                                ? 'bg-red-950/40 text-red-400 border border-red-800/60'
                                : exam.daysRemaining <= 14
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            {exam.daysRemaining} días
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-zinc-400 font-mono pt-2 border-t border-zinc-800">
                          <span>Horas: {exam.completedHours ?? 0}h / {exam.targetHoursEstimate}h</span>
                          <span className="text-zinc-500">Peso: {exam.weight ?? 3}/5</span>
                        </div>

                        {/* Quick action buttons: Edit and Delete */}
                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-zinc-800">
                          <button
                            type="button"
                            onClick={() => handleEditExam(exam)}
                            title="Editar examen"
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-[#121215] hover:bg-zinc-800 rounded-lg transition-colors border border-[#27272A] hover:border-zinc-600 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            title="Eliminar examen"
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 rounded-lg transition-colors border border-red-900/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-[#18181B]/40 border border-dashed border-[#27272A] rounded-xl text-center space-y-2">
                  <p className="text-xs text-zinc-500 italic">No hay exámenes registrados para esta materia.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddExam}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white bg-[#18181B] border border-[#27272A] hover:border-zinc-600 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-400" />
                    <span>+ Agregar Examen / Parcial</span>
                  </button>
                </div>
              )}
            </div>

            {/* Temario Jerárquico por Unidades con Repetición Espaciada */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-400" />
                    Temario por Unidades & Repetición Espaciada
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Estudia hoy, repasa al día siguiente y consolida el dominio
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = (selectedSubject.units?.length || 0) + 1;
                    setUnitNumber(nextNum);
                    setUnitTitle(`Unidad ${nextNum}: `);
                    setShowNewUnitModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#18181B] border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva Unidad</span>
                </button>
              </div>

              {selectedSubject.units && selectedSubject.units.length > 0 ? (
                <div className="space-y-3">
                  {selectedSubject.units.map((unit: any) => {
                    const isExpanded = isUnitExpanded(unit.id);
                    const unitTopics = unit.topics || [];
                    const masteredCount = unitTopics.filter((t: any) => t.status === 'DOMINADO').length;
                    const reviewCount = unitTopics.filter((t: any) => t.status === 'REVISION_PENDIENTE').length;

                    return (
                      <div
                        key={unit.id}
                        className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden transition-all"
                      >
                        {/* Unit Accordion Header */}
                        <div className="p-4 flex items-center justify-between gap-3 bg-[#18181B] hover:bg-zinc-900/60 transition-colors">
                          <button
                            type="button"
                            onClick={() => toggleUnitAccordion(unit.id)}
                            className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                          >
                            <div className="p-1 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-zinc-300" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {unit.title}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121215] border border-zinc-800 text-zinc-400">
                                  {masteredCount}/{unitTopics.length} Dominados
                                </span>
                                {reviewCount > 0 && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300 font-semibold">
                                    {reviewCount} A Repasar
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Quick Unit Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenAddTopic(unit)}
                              title="Agregar tema a esta unidad"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white bg-[#121215] border border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Tema</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id, unit.title)}
                              title="Eliminar unidad"
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-[#27272A]/70 space-y-2.5">
                            {unitTopics.length > 0 ? (
                              unitTopics.map((topic: any) => {
                                const isPending = topic.status === 'PENDIENTE';
                                const isReview = topic.status === 'REVISION_PENDIENTE';
                                const isMastered = topic.status === 'DOMINADO';
                                const isSubmitting = submittingSessionId === topic.id;

                                return (
                                  <div
                                    key={topic.id}
                                    className="p-3.5 bg-[#121215] border border-[#27272A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                                  >
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                                          {topic.title}
                                        </h4>
                                        {/* Status Badge: Gris (Pendiente), Amarillo/Zinc (A Repasar), Verde/Blanco (Dominado) */}
                                        {isPending && (
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                            Pendiente
                                          </span>
                                        )}
                                        {isReview && (
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                                            <RotateCcw className="w-2.5 h-2.5" />
                                            A Repasar (Repetición Espaciada)
                                          </span>
                                        )}
                                        {isMastered && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            Dominado
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                                        {topic.lastStudiedAt ? (
                                          <span>
                                            Último estudio:{' '}
                                            {format(new Date(topic.lastStudiedAt), 'dd/MM/yyyy HH:mm')}
                                          </span>
                                        ) : (
                                          <span>Sin estudio registrado</span>
                                        )}
                                        {topic.reviewCount > 0 && (
                                          <span>• {topic.reviewCount} {topic.reviewCount === 1 ? 'repaso' : 'repasos'}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action button: Big touch target >= 44px */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isPending && (
                                        <button
                                          type="button"
                                          disabled={isSubmitting}
                                          onClick={() => handleRecordStudySession(topic.id, false)}
                                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                                          <span>{isSubmitting ? 'Guardando...' : 'Marcar Estudiado Hoy'}</span>
                                        </button>
                                      )}

                                      {isReview && (
                                        <button
                                          type="button"
                                          disabled={isSubmitting}
                                          onClick={() => handleRecordStudySession(topic.id, true)}
                                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                          <RotateCcw className="w-4 h-4 text-zinc-950" />
                                          <span>{isSubmitting ? 'Guardando...' : 'Hacer Repaso'}</span>
                                        </button>
                                      )}

                                      {isMastered && (
                                        <button
                                          type="button"
                                          disabled={isSubmitting}
                                          onClick={() => handleRecordStudySession(topic.id, true)}
                                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Refuerzo</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                                        title="Eliminar tema"
                                        className="p-2 text-zinc-500 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 bg-[#121215] border border-dashed border-[#27272A] rounded-xl text-center space-y-2">
                                <p className="text-xs text-zinc-500 italic">No hay temas en esta unidad todavía.</p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddTopic(unit)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#18181B] border border-[#27272A] cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Agregar Primer Tema</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-[#18181B]/40 border border-dashed border-[#27272A] rounded-xl text-center space-y-3">
                  <p className="text-xs text-zinc-400">
                    No hay unidades de estudio definidas para {selectedSubject.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitNumber(1);
                      setUnitTitle('Unidad 1: ');
                      setShowNewUnitModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#18181B] border border-[#27272A] hover:border-zinc-500 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Crear Unidad 1</span>
                  </button>
                </div>
              )}
            </div>

            {/* Academic Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                  Tareas de Estudio Específicas
                </h3>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-semibold transition-colors"
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
                            ? 'bg-[#18181B]/40 border-zinc-800/60 opacity-40'
                            : 'bg-[#18181B] border-[#27272A] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTaskStatusToggle(task.id, task.status)}
                            className={`p-1 rounded-full border transition-colors ${
                              isDone
                                ? 'bg-white border-white text-zinc-950'
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
                          <span className="text-xs font-semibold text-zinc-300 block">
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleCreateSubject}
            className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white">Agregar Nueva Asignatura o Final</h3>
              <button
                type="button"
                onClick={() => setShowNewSubjectModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre de la Asignatura</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Redes de Información"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
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
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
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
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewSubjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
              >
                Guardar Materia
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Task */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleCreateTask}
            className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                Nueva Tarea para {selectedSubject?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej. Resolver guía 3 de ejercicios"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tipo de Estudio</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
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
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nivel de Energía Requerido</label>
                <select
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value="ALTA">Alta (Resolución, lógica, conceptos difíciles)</option>
                  <option value="MEDIA">Media (Resúmenes, práctica estructurada)</option>
                  <option value="BAJA">Baja (Lectura, ordenar apuntes)</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
              >
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Unit */}
      {showNewUnitModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleCreateUnit}
            className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-white" />
                <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                  Nueva Unidad para {selectedSubject?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewUnitModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Número de Unidad</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej. 1"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título de la Unidad</label>
                <input
                  type="text"
                  required
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  placeholder="Ej. Unidad 1: Programación Funcional"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewUnitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
              >
                Crear Unidad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Topic */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleCreateTopic}
            className="bg-[#121215] border border-[#27272A] rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-white" />
                <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">
                  Agregar Tema a Unidad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTopicModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 px-4 sm:px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Unidad de Estudio</label>
                <select
                  value={targetUnitForTopic?.id || ''}
                  onChange={(e) => {
                    const found = selectedSubject?.units?.find((u: any) => u.id === e.target.value);
                    setTargetUnitForTopic(found || null);
                  }}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                >
                  {selectedSubject?.units?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título del Tema</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Ej. Inmutabilidad y Funciones Puras"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 px-4 sm:px-6 pb-4 bg-[#121215] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewTopicModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-zinc-300 border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-[#E4E4E7] shadow-sm transition-all cursor-pointer"
              >
                Guardar Tema
              </button>
            </div>
          </form>
        </div>
      )}
      {showExamModal && (
        <ExamFormModal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            setEditingExam(null);
          }}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          subjectId={editingExam?.subjectId || selectedSubject?.id || (subjects[0]?.id ?? '')}
          subjectName={
            subjects.find((s) => s.id === (editingExam?.subjectId || selectedSubject?.id))?.name ||
            selectedSubject?.name ||
            ''
          }
          examToEdit={editingExam}
          onSuccess={async () => {
            await loadSubjects();
          }}
          onDelete={async (id, title) => {
            await handleDeleteExam(id, title);
          }}
        />
      )}
    </div>
  );
};
