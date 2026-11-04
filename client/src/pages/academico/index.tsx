import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import { api, fetchApi } from '../../api/client';

export type ModalType = 'SYLLABUS' | 'EDIT_COURSE' | null;

export interface ExamItem {
  id: string;
  title: string;
  date: string;
  dateFormatted: string;
  daysRemaining: number;
  weight: number;
  isCritical: boolean;
}

export interface ClassSchedule {
  id: string;
  day: string;
  time: string;
  shift: 'Mañana' | 'Tarde' | 'Noche';
}

export interface UnitTopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface SubjectUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: UnitTopic[];
}

export interface AcademicSubject {
  id: string;
  name: string;
  code?: string;
  statusBadge: string;
  progressPerc: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  schedules: ClassSchedule[];
  exams: ExamItem[];
  units: SubjectUnit[];
  syllabus?: Array<{ id: number; title: string; completed: boolean }>;
  priorityWeight: number;
  color?: string;
}

const LOCAL_STORAGE_KEY = 'lifeflow_academic_custom_subjects_v1';

const INITIAL_SUBJECTS: AcademicSubject[] = [
  {
    id: 'subj-paradigmas',
    name: 'Paradigmas de Programación',
    code: 'PAR-2026',
    statusBadge: 'En Cursada',
    progressPerc: 67,
    completedTopicsCount: 2,
    totalTopicsCount: 3,
    syllabus: [
      { id: 1, title: 'Unidad 1: Paradigma Funcional (Haskell)', completed: true },
      { id: 2, title: 'Unidad 2: Paradigma Lógico (Prolog)', completed: true },
      { id: 3, title: 'Unidad 3: Objetos y Polimorfismo', completed: false },
    ],
    priorityWeight: 2.0,
    color: '#E50914',
    schedules: [
      { id: 'sch-1', day: 'Lunes', time: '08:00 - 12:00', shift: 'Mañana' },
      { id: 'sch-2', day: 'Viernes', time: '08:00 - 12:00', shift: 'Mañana' },
    ],
    exams: [
      {
        id: 'exam-1',
        title: '2º Parcial',
        date: '2026-11-06T08:00:00.000Z',
        dateFormatted: 'Viernes 6 de Noviembre',
        daysRemaining: 2,
        weight: 2.0,
        isCritical: true,
      },
      {
        id: 'exam-2',
        title: 'Examen Global',
        date: '2026-11-21T08:00:00.000Z',
        dateFormatted: 'Sábado 21 de Noviembre',
        daysRemaining: 17,
        weight: 2.0,
        isCritical: false,
      },
    ],
    units: [
      {
        id: 'u-1',
        unitNumber: 1,
        title: 'Programación Funcional',
        topics: [
          { id: 't-1', title: 'Inmutabilidad y Funciones Puras', completed: true },
          { id: 't-2', title: 'Funciones de Orden Superior & Lambdas', completed: true },
          { id: 't-3', title: 'Composición y Currying', completed: true },
          { id: 't-4', title: 'Recursión de Cola (Tail Call Optimization)', completed: true },
          { id: 't-5', title: 'Mónadas y Manejo Seguro de Efectos', completed: true },
        ],
      },
      {
        id: 'u-2',
        unitNumber: 2,
        title: 'Programación Orientada a Objetos Avanzada',
        topics: [
          { id: 't-6', title: 'Polimorfismo Paramétrico & Subtipado', completed: true },
          { id: 't-7', title: 'Patrones de Diseño Comportamentales', completed: true },
          { id: 't-8', title: 'Modelos de Dominio y Principios SOLID', completed: true },
          { id: 't-9', title: 'Metaprogramación y Reflexión', completed: true },
          { id: 't-10', title: 'Inyección de Dependencias desacoplada', completed: false },
        ],
      },
      {
        id: 'u-3',
        unitNumber: 3,
        title: 'Programación Lógica y Resolución de Restricciones',
        topics: [
          { id: 't-11', title: 'Bases de Conocimiento: Hechos y Reglas', completed: true },
          { id: 't-12', title: 'Unificación y Resolución SLD', completed: true },
          { id: 't-13', title: 'Backtracking y Corte (Cut Operator)', completed: true },
          { id: 't-14', title: 'Aritmética y Listas en Prolog', completed: true },
          { id: 't-15', title: 'Gramáticas de Cláusulas Definidas (DCG)', completed: false },
        ],
      },
      {
        id: 'u-4',
        unitNumber: 4,
        title: 'Concurrencia y Nuevos Paradigmas',
        topics: [
          { id: 't-16', title: 'Modelo de Actores y Canales CSP', completed: false },
          { id: 't-17', title: 'Manejo de Memoria Transaccional (STM)', completed: false },
          { id: 't-18', title: 'Programación Reactiva y Streams', completed: false },
          { id: 't-19', title: 'Sistemas Distribuidos y Tolerancia a Fallos', completed: false },
          { id: 't-20', title: 'Evaluación Comparativa de Paradigmas', completed: false },
        ],
      },
    ],
  },
  {
    id: 'subj-economia',
    name: 'Economía',
    code: 'ECO-2026',
    statusBadge: 'En Cursada',
    progressPerc: 67,
    completedTopicsCount: 2,
    totalTopicsCount: 3,
    syllabus: [
      { id: 1, title: 'Unidad 1: Microeconomía y Elasticidad', completed: true },
      { id: 2, title: 'Unidad 2: Estructuras de Mercado y Costos', completed: true },
      { id: 3, title: 'Unidad 3: Cuentas Nacionales e Inflación', completed: false },
    ],
    priorityWeight: 1.5,
    color: '#3b82f6',
    schedules: [
      { id: 'sch-3', day: 'Jueves', time: '19:30 - 22:30', shift: 'Noche' },
    ],
    exams: [
      {
        id: 'exam-3',
        title: '3º Parcial',
        date: '2026-11-13T08:00:00.000Z',
        dateFormatted: 'Viernes 13 de Noviembre',
        daysRemaining: 9,
        weight: 1.5,
        isCritical: false,
      },
    ],
    units: [
      {
        id: 'u-21',
        unitNumber: 1,
        title: 'Microeconomía y Teoría de Mercados',
        topics: [
          { id: 't-21', title: 'Oferta, Demanda y Punto de Equilibrio', completed: true },
          { id: 't-22', title: 'Elasticidad Precio e Ingreso', completed: true },
          { id: 't-23', title: 'Estructuras: Competencia Perfecta vs Monopolio', completed: true },
          { id: 't-24', title: 'Teoría del Consumidor & Curvas de Indiferencia', completed: true },
          { id: 't-25', title: 'Costos Marginales y Rendimientos de Escala', completed: true },
        ],
      },
      {
        id: 'u-22',
        unitNumber: 2,
        title: 'Macroeconomía y Variables Agregadas',
        topics: [
          { id: 't-26', title: 'Producto Bruto Interno (PBI) Nominal y Real', completed: true },
          { id: 't-27', title: 'Inflación, Índices de Precios y Masa Monetaria', completed: true },
          { id: 't-28', title: 'Política Fiscal y Presupuesto Público', completed: true },
          { id: 't-29', title: 'Balanza de Pagos y Tipo de Cambio', completed: true },
          { id: 't-30', title: 'Modelo IS-LM en Economía Cerrada y Abierta', completed: false },
        ],
      },
      {
        id: 'u-23',
        unitNumber: 3,
        title: 'Finanzas Corporativas y Evaluación de Proyectos',
        topics: [
          { id: 't-31', title: 'Valor Tiempo del Dinero y Tasa de Descuento', completed: true },
          { id: 't-32', title: 'Valor Actual Neto (VAN) y Tasa Interna de Retorno (TIR)', completed: true },
          { id: 't-33', title: 'Flujo de Fondos Proyectado y Capital de Trabajo', completed: false },
          { id: 't-34', title: 'Análisis de Sensibilidad y Riesgo', completed: false },
          { id: 't-35', title: 'Estructura de Capital y Costo Promedio Ponderado (WACC)', completed: false },
        ],
      },
      {
        id: 'u-24',
        unitNumber: 4,
        title: 'Economía Internacional y Desarrollo',
        topics: [
          { id: 't-36', title: 'Ventajas Comparativas y Comercio Exterior', completed: false },
          { id: 't-37', title: 'Aranceles y Políticas Proteccionistas', completed: false },
          { id: 't-38', title: 'Crecimiento Económico Sostenible', completed: false },
          { id: 't-39', title: 'Mercados Financieros Globales', completed: false },
          { id: 't-40', title: 'Políticas de Desarrollo Productivo', completed: false },
        ],
      },
    ],
  },
];

export const getDefaultTopicsForSubject = (
  subjectName: string
): Array<{ id: number; title: string; completed: boolean }> => {
  const nameLower = subjectName.toLowerCase();
  if (nameLower.includes('paradigmas')) {
    return [
      { id: 1, title: 'Unidad 1: Paradigma Funcional (Haskell)', completed: true },
      { id: 2, title: 'Unidad 2: Paradigma Lógico (Prolog)', completed: true },
      { id: 3, title: 'Unidad 3: Objetos y Polimorfismo', completed: false },
    ];
  }
  if (nameLower.includes('econom')) {
    return [
      { id: 1, title: 'Unidad 1: Microeconomía y Elasticidad', completed: true },
      { id: 2, title: 'Unidad 2: Estructuras de Mercado y Costos', completed: true },
      { id: 3, title: 'Unidad 3: Cuentas Nacionales e Inflación', completed: false },
    ];
  }
  return [
    { id: 1, title: 'Unidad 1: Conceptos Fundamentales', completed: true },
    { id: 2, title: 'Unidad 2: Práctica y Desarrollo', completed: false },
    { id: 3, title: 'Unidad 3: Cierre y Examen', completed: false },
  ];
};

interface SyllabusContentProps {
  subject: AcademicSubject;
  onClose: () => void;
  onSubjectUpdated?: (updated: Partial<AcademicSubject>) => void;
}

export const SyllabusContent: React.FC<SyllabusContentProps> = ({
  subject,
  onClose,
  onSubjectUpdated,
}) => {
  const [topics, setTopics] = useState<Array<{ id: number; title: string; completed: boolean }>>(() => {
    if (subject.syllabus && Array.isArray(subject.syllabus) && subject.syllabus.length > 0) {
      return JSON.parse(JSON.stringify(subject.syllabus));
    }
    return getDefaultTopicsForSubject(subject.name);
  });
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const completedCount = topics.filter((t) => t.completed).length;
  const currentPerc = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  const handleToggleTopic = (topicId: number) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTopic = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newTopicTitle.trim()) return;
    const nextId = topics.length > 0 ? Math.max(...topics.map((t) => t.id)) + 1 : 1;
    setTopics((prev) => [...prev, { id: nextId, title: newTopicTitle.trim(), completed: false }]);
    setNewTopicTitle('');
  };

  const handleRemoveTopic = (topicId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const handleSave = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);
    setFeedback(null);

    // 1. Actualización optimista local inmediata sin reiniciar hooks globales
    if (onSubjectUpdated) {
      onSubjectUpdated({
        syllabus: topics,
        progressPerc: currentPerc,
        completedTopicsCount: completedCount,
        totalTopicsCount: topics.length,
      });
    }

    // 2. Envío en segundo plano vía PUT a la API
    try {
      await api.saveAcademicSyllabus({
        subjectName: subject.name,
        syllabus: topics,
      });
      setFeedback(`✓ Temario guardado con éxito (${currentPerc}% completado)`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error('Error al guardar temario:', err);
      setFeedback(`Error: ${err.message || 'Error de red'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progreso del Temario */}
      <div className="flex items-center justify-between text-xs text-zinc-400 bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#e50914]" />
          <span>Progreso: <strong className="text-white">{currentPerc}%</strong></span>
        </div>
        <span className="font-mono text-zinc-400">
          {completedCount} de {topics.length} unidades completadas
        </span>
      </div>

      {/* 1. Lista de temas con checkboxes nativos interactivos */}
      <div className="overflow-y-auto space-y-2 pr-1 max-h-[42vh]">
        {topics.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-6 text-center">
            No hay unidades registradas en el temario. Puedes agregar una abajo.
          </p>
        ) : (
          topics.map((topic) => (
            <label
              key={topic.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-zinc-500 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <input
                  type="checkbox"
                  checked={topic.completed}
                  onChange={() => handleToggleTopic(topic.id)}
                  className="w-4 h-4 rounded border-[#30363d] text-[#e50914] focus:ring-[#e50914] bg-[#161b22] accent-[#e50914] cursor-pointer shrink-0"
                />
                <span
                  className={`text-xs sm:text-sm truncate ${
                    topic.completed ? 'text-zinc-400 line-through' : 'text-zinc-100 font-medium'
                  }`}
                >
                  {topic.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    topic.completed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {topic.completed ? 'Visto' : 'Pendiente'}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveTopic(topic.id, e)}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Eliminar tema"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </label>
          ))
        )}
      </div>

      {/* 2. Input + botón "+ Agregar Tema" para sumar unidades nuevas al array */}
      <form onSubmit={handleAddTopic} className="pt-2 border-t border-[#30363d] flex gap-2">
        <input
          type="text"
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
          placeholder="Nueva unidad o tema..."
          className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914]"
        />
        <button
          type="button"
          onClick={handleAddTopic}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-[#e50914]" />
          <span>+ Agregar Tema</span>
        </button>
      </form>

      {/* Feedback mensaje inline */}
      {feedback && (
        <div className="p-2.5 rounded-xl bg-[#0d281e] border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3. Botones de acción */}
      <div className="pt-3 border-t border-[#30363d] flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
        >
          Cerrar
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#e50914] hover:bg-[#b80710] text-white shadow-lg shadow-[#e50914]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface EditCourseContentProps {
  subject: AcademicSubject;
  onClose: () => void;
  onSubjectUpdated?: (updated: Partial<AcademicSubject>) => void;
}

export const EditCourseContent: React.FC<EditCourseContentProps> = ({
  subject,
  onClose,
  onSubjectUpdated,
}) => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>(() =>
    subject.schedules && subject.schedules.length > 0
      ? JSON.parse(JSON.stringify(subject.schedules))
      : [{ id: 'sch-default', day: 'Lunes', time: '08:00 - 12:00', shift: 'Mañana' }]
  );

  const handleAddSchedule = () => {
    const newId = `sch-${Date.now()}`;
    setSchedules((prev) => [
      ...prev,
      { id: newId, day: 'Lunes', time: '08:00 - 12:00', shift: 'Mañana' },
    ]);
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSubjectUpdated) {
      onSubjectUpdated({ schedules });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-400">
        Modifica los días, bloques horarios y turnos de cursado semanal de esta materia.
      </p>

      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
        {schedules.map((sch, idx) => (
          <div
            key={sch.id}
            className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span>Bloque {idx + 1}</span>
              {schedules.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveSchedule(sch.id);
                  }}
                  className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Día</label>
                <select
                  value={sch.day}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSchedules((prev) =>
                      prev.map((s) => (s.id === sch.id ? { ...s, day: val } : s))
                    );
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Horario</label>
                <input
                  type="text"
                  value={sch.time}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSchedules((prev) =>
                      prev.map((s) => (s.id === sch.id ? { ...s, time: val } : s))
                    );
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs font-mono"
                  placeholder="08:00 - 12:00"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Turno</label>
                <select
                  value={sch.shift}
                  onChange={(e) => {
                    const val = e.target.value as 'Mañana' | 'Tarde' | 'Noche';
                    setSchedules((prev) =>
                      prev.map((s) => (s.id === sch.id ? { ...s, shift: val } : s))
                    );
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddSchedule}
        className="w-full py-2.5 rounded-xl border border-dashed border-[#30363d] hover:border-zinc-500 text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar Bloque Horario
      </button>

      <div className="pt-3 border-t border-[#30363d] flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#e50914] hover:bg-[#b80710] text-white shadow-lg shadow-[#e50914]/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Guardar Cursado</span>
        </button>
      </div>
    </div>
  );
};

interface AcademicoPageProps {
  onSync?: () => void;
  onOpenDailyPlanner?: () => void;
  onOpenWeeklyGenerator?: () => void;
  onOpenRecurringRules?: () => void;
  hideTopHeader?: boolean;
  externalNewSubjectModalOpen?: boolean;
  onCloseExternalNewSubjectModal?: () => void;
}

export const AcademicoPage: React.FC<AcademicoPageProps> = ({
  onSync,
  onOpenDailyPlanner,
  onOpenWeeklyGenerator,
  onOpenRecurringRules,
  hideTopHeader = false,
  externalNewSubjectModalOpen,
  onCloseExternalNewSubjectModal,
}) => {
  const [subjects, setSubjects] = useState<AcademicSubject[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read subjects from localStorage', e);
    }
    return INITIAL_SUBJECTS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Aislamiento del Estado del Modal en el componente raíz
  const [activeModal, setActiveModal] = useState<{ type: ModalType; subject: AcademicSubject } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);

  // New Subject Form State
  const [formName, setFormName] = useState('');
  const [formScheduleDay, setFormScheduleDay] = useState('Lunes');
  const [formScheduleTime, setFormScheduleTime] = useState('08:00 - 12:00');
  const [formShift, setFormShift] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana');
  const [formExamType, setFormExamType] = useState('1.º Parcial');
  const [formExamDate, setFormExamDate] = useState('2026-11-20');
  const [formWeight, setFormWeight] = useState(1.5);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Synchronize state with LocalStorage
  const saveSubjects = (newSubjects: AcademicSubject[]) => {
    setSubjects(newSubjects);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSubjects));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  };

  // Actualización optimista para Syllabus y EditCourse sin cerrar ni reiniciar vista
  const handleSubjectUpdated = (updatedData: Partial<AcademicSubject>) => {
    if (!activeModal) return;
    const targetName = activeModal.subject.name;
    setSubjects((prev) => {
      const next = prev.map((s) => {
        const match =
          s.name.toLowerCase() === targetName.toLowerCase() ||
          s.name.toLowerCase().includes(targetName.toLowerCase()) ||
          targetName.toLowerCase().includes(s.name.toLowerCase());
        if (match) {
          return { ...s, ...updatedData };
        }
        return s;
      });
      saveSubjects(next);
      return next;
    });

    setActiveModal((prev) =>
      prev ? { ...prev, subject: { ...prev.subject, ...updatedData } } : null
    );
  };

  // Rule 3: Excluir explícitamente "Diseño" (no debe renderizarse en ninguna sección)
  const isExcluded = (name: string): boolean => {
    return /dise[ñn]o/i.test(name);
  };

  // Filtered subjects (excluding "Diseño" + search)
  const visibleSubjects = useMemo(() => {
    return subjects
      .filter((s) => !isExcluded(s.name))
      .filter((s) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q))
        );
      });
  }, [subjects, searchTerm]);

  // Sync data with live API /dashboard & /api/academic/subjects (estable sin onSync cíclico)
  const handleSyncData = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsLoading(true);
    try {
      const [dash, serverSubjects] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getAcademicSubjects().catch(() => null),
      ]);

      setSubjects((prev) => {
        let updated = [...prev];

        if (Array.isArray(serverSubjects) && serverSubjects.length > 0) {
          serverSubjects.forEach((serverSubj: any) => {
            const index = updated.findIndex(
              (s) =>
                s.name.toLowerCase().includes(serverSubj.name.toLowerCase()) ||
                serverSubj.name.toLowerCase().includes(s.name.toLowerCase())
            );
            const syllabusTopics: Array<{ id: number; title: string; completed: boolean }> =
              Array.isArray(serverSubj.syllabus) ? serverSubj.syllabus : [];
            const completedCount = syllabusTopics.filter((t: any) => t.completed).length;

            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                progressPerc: serverSubj.progressPerc,
                completedTopicsCount: completedCount > 0 ? completedCount : updated[index].completedTopicsCount,
                totalTopicsCount: syllabusTopics.length > 0 ? syllabusTopics.length : updated[index].totalTopicsCount,
                syllabus: syllabusTopics.length > 0 ? syllabusTopics : updated[index].syllabus,
              };
            }
          });
        }

        if (dash && Array.isArray(dash.academicProgress)) {
          updated = updated.map((subj) => {
            const foundProg = dash.academicProgress.find(
              (p: any) => p.subject && p.subject.toLowerCase() === subj.name.toLowerCase().split(' ')[0]
            );
            if (foundProg) {
              return {
                ...subj,
                progressPerc: foundProg.progressPerc,
              };
            }
            return subj;
          });
        }

        saveSubjects(updated);
        return updated;
      });
    } catch (err) {
      console.warn('API sync fallback to cached state', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSyncData();
  }, []);

  // Estabilizar ciclo de vida: desactivar revalidaciones agresivas en foco mientras el modal esté abierto
  useEffect(() => {
    const handleWindowFocus = () => {
      if (activeModal) return; // revalidateOnFocus: false
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [activeModal]);

  // Safe fallback list of topics if subject has no units loaded
  const getSyllabusUnits = (subj: AcademicSubject): SubjectUnit[] => {
    if (subj.units && subj.units.length > 0) {
      return subj.units;
    }
    const nameLower = subj.name.toLowerCase();
    if (nameLower.includes('paradigmas')) {
      return [
        {
          id: 'u-fb-1',
          unitNumber: 1,
          title: 'Programación Funcional',
          topics: [
            { id: 't-fb-1', title: 'Inmutabilidad y Funciones Puras', completed: true },
            { id: 't-fb-2', title: 'Funciones de Orden Superior & Lambdas', completed: true },
            { id: 't-fb-3', title: 'Composición y Currying', completed: true },
            { id: 't-fb-4', title: 'Recursión de Cola', completed: true },
          ],
        },
        {
          id: 'u-fb-2',
          unitNumber: 2,
          title: 'Programación Orientada a Objetos',
          topics: [
            { id: 't-fb-5', title: 'Polimorfismo Paramétrico & Subtipado', completed: true },
            { id: 't-fb-6', title: 'Patrones de Diseño Comportamentales', completed: true },
            { id: 't-fb-7', title: 'Modelos de Dominio y SOLID', completed: true },
          ],
        },
        {
          id: 'u-fb-3',
          unitNumber: 3,
          title: 'Programación Lógica',
          topics: [
            { id: 't-fb-8', title: 'Bases de Conocimiento: Hechos y Reglas', completed: true },
            { id: 't-fb-9', title: 'Unificación y Resolución SLD', completed: true },
            { id: 't-fb-10', title: 'Backtracking y Corte', completed: true },
          ],
        },
      ];
    }
    if (nameLower.includes('econom')) {
      return [
        {
          id: 'u-fb-11',
          unitNumber: 1,
          title: 'Microeconomía y Teoría de Mercados',
          topics: [
            { id: 't-fb-11', title: 'Oferta, Demanda y Punto de Equilibrio', completed: true },
            { id: 't-fb-12', title: 'Elasticidad Precio e Ingreso', completed: true },
            { id: 't-fb-13', title: 'Estructuras: Competencia Perfecta vs Monopolio', completed: true },
          ],
        },
        {
          id: 'u-fb-12',
          unitNumber: 2,
          title: 'Macroeconomía y Variables Agregadas',
          topics: [
            { id: 't-fb-14', title: 'Producto Bruto Interno (PBI)', completed: true },
            { id: 't-fb-15', title: 'Inflación y Política Monetaria', completed: true },
            { id: 't-fb-16', title: 'Política Fiscal y Presupuesto', completed: true },
          ],
        },
        {
          id: 'u-fb-13',
          unitNumber: 3,
          title: 'Costos y Evaluación de Proyectos',
          topics: [
            { id: 't-fb-17', title: 'Costos Marginales y Rendimientos de Escala', completed: true },
            { id: 't-fb-18', title: 'Valor Actual Neto (VAN) y TIR', completed: true },
            { id: 't-fb-19', title: 'Flujo de Fondos y Sensibilidad', completed: false },
          ],
        },
      ];
    }
    return [
      {
        id: 'u-fb-gen-1',
        unitNumber: 1,
        title: 'Fundamentos y Conceptos Iniciales',
        topics: [
          { id: 't-fb-g1', title: 'Introducción al marco conceptual', completed: true },
          { id: 't-fb-g2', title: 'Modelos teóricos principales', completed: false },
        ],
      },
      {
        id: 'u-fb-gen-2',
        unitNumber: 2,
        title: 'Casos Prácticos y Preparación de Exámenes',
        topics: [
          { id: 't-fb-g3', title: 'Resolución de ejercicios tipo parcial', completed: false },
          { id: 't-fb-g4', title: 'Repaso integral y simulacro', completed: false },
        ],
      },
    ];
  };

  // Toggle topic completion with optimistic update and exact scroll retention
  const handleToggleTopic = (
    subjectName: string,
    unitId: string,
    topicId: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const updated = subjects.map((s) => {
      if (s.name !== subjectName) return s;

      const currentUnits = getSyllabusUnits(s);
      const newUnits = currentUnits.map((u) => {
        if (u.id !== unitId) return u;
        return {
          ...u,
          topics: u.topics.map((t) =>
            t.id === topicId ? { ...t, completed: !t.completed } : t
          ),
        };
      });

      let total = 0;
      let completed = 0;
      newUnits.forEach((u) => {
        total += u.topics.length;
        completed += u.topics.filter((t) => t.completed).length;
      });
      const progressPerc = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...s,
        units: newUnits,
        totalTopicsCount: total,
        completedTopicsCount: completed,
        progressPerc,
      };
    });

    saveSubjects(updated);
  };

  // Submit "+ Nueva Materia / Final"
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formName.trim()) {
      setFormFeedback('Por favor ingresa el nombre de la materia.');
      return;
    }

    if (isExcluded(formName)) {
      setFormFeedback('La materia "Diseño" está reservada para el siguiente ciclo lectivo.');
      return;
    }

    setFormSubmitting(true);
    setFormFeedback(null);

    const examDateObj = new Date(formExamDate);
    const today = new Date('2026-11-04T15:00:25Z');
    const diffTime = examDateObj.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const newSubject: AcademicSubject = {
      id: `subj-${Date.now()}`,
      name: formName.trim(),
      code: formName.trim().substring(0, 3).toUpperCase() + '-2026',
      statusBadge: 'En Cursada',
      progressPerc: 0,
      completedTopicsCount: 0,
      totalTopicsCount: 15,
      priorityWeight: Number(formWeight),
      color: '#E50914',
      schedules: [
        {
          id: `sch-${Date.now()}`,
          day: formScheduleDay,
          time: formScheduleTime,
          shift: formShift,
        },
      ],
      exams: [
        {
          id: `exam-${Date.now()}`,
          title: formExamType,
          date: examDateObj.toISOString(),
          dateFormatted: examDateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          daysRemaining,
          weight: Number(formWeight),
          isCritical: daysRemaining <= 7,
        },
      ],
      units: [
        {
          id: `u-${Date.now()}-1`,
          unitNumber: 1,
          title: 'Unidad Introductoria y Fundamentos',
          topics: [
            { id: `t-${Date.now()}-1`, title: 'Conceptos Clave y Definición', completed: false },
            { id: `t-${Date.now()}-2`, title: 'Modelos Teóricos Principales', completed: false },
            { id: `t-${Date.now()}-3`, title: 'Casos Prácticos de Aplicación', completed: false },
          ],
        },
        {
          id: `u-${Date.now()}-2`,
          unitNumber: 2,
          title: 'Unidad de Profundización y Métodos',
          topics: [
            { id: `t-${Date.now()}-4`, title: 'Técnicas de Análisis y Resolución', completed: false },
            { id: `t-${Date.now()}-5`, title: 'Ejercicios de Examen Parcial', completed: false },
          ],
        },
      ],
    };

    try {
      await fetchApi('/academic/subject', {
        method: 'POST',
        body: JSON.stringify({
          name: formName.trim(),
          scheduleDay: formScheduleDay,
          scheduleTime: formScheduleTime,
          examType: formExamType,
          examDate: examDateObj.toISOString(),
          weight: Number(formWeight),
          progressPerc: 0,
        }),
      }).catch((apiErr) => {
        console.warn('API POST /api/academic/subject notice:', apiErr);
      });
    } catch (err) {
      console.warn('Fallback to reactive local state:', err);
    }

    const nextSubjects = [newSubject, ...subjects];
    saveSubjects(nextSubjects);

    setFormSubmitting(false);
    setIsNewSubjectModalOpen(false);
    if (onCloseExternalNewSubjectModal) onCloseExternalNewSubjectModal();

    setFormName('');
    setFormScheduleDay('Lunes');
    setFormScheduleTime('08:00 - 12:00');
    setFormShift('Mañana');
    setFormExamType('1.º Parcial');
    setFormExamDate('2026-11-20');
    setFormWeight(1.5);
  };

  return (
    <div className="w-full bg-[#09090B] text-white min-h-screen pb-24">
      {/* Top Header */}
      {!hideTopHeader && (
        <header className="h-16 border-b border-[#30363d] bg-[#0d1117] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center font-black text-white text-sm shadow-[0_0_12px_rgba(229,9,20,0.4)] shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase hidden md:inline">
                LifeFlow
              </span>
              <span className="text-zinc-600 hidden md:inline">/</span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Plan Académico & Materias
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#161b22] text-[#f0f6fc] border border-[#30363d] shadow-sm shrink-0">
              Semestre 2026-2
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSyncData}
              disabled={isLoading}
              title="Sincronizar datos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161b22] text-[#c9d1d9] border border-[#30363d] hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            {onOpenDailyPlanner && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenDailyPlanner();
                }}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161b22] text-[#c9d1d9] border border-[#30363d] hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                <span>Planificar mi día</span>
              </button>
            )}

            {onOpenRecurringRules && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenRecurringRules();
                }}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161b22] text-[#c9d1d9] border border-[#30363d] hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Horarios Fijos</span>
              </button>
            )}

            {onOpenWeeklyGenerator && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenWeeklyGenerator();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#161b22] text-[#c9d1d9] border border-[#30363d] hover:border-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Generar semana</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNewSubjectModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E50914] hover:bg-[#b80710] text-white border border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.35)] transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Nueva Materia / Final</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Banner Hero / Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#161b22] border border-[#30363d]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Planificación Académica Activa
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Seguimiento de cursadas en tiempo real, horarios protegidos y cuenta regresiva de parciales y finales globales.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar materia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNewSubjectModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E50914] hover:bg-[#c40811] text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Materias Activas (Grid de 2 columnas) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E50914]" />
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Materias en Cursada ({visibleSubjects.length})
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Ciclo Lectivo Activo 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleSubjects.map((subj) => {
              return (
                <div
                  key={subj.id}
                  className="rounded-2xl bg-[#161b22] border border-[#30363d] p-5 sm:p-6 space-y-5 hover:border-zinc-500 transition-all duration-200 shadow-lg relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E50914] via-[#f85149] to-[#E50914]/40" />

                  {/* Header de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                          {subj.name}
                        </h4>
                        {subj.code && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0d1117] text-zinc-400 border border-[#30363d]">
                            {subj.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Ponderación académica: <span className="font-semibold text-zinc-300">{subj.priorityWeight.toFixed(1)}x</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0d281e] text-[#34d399] border border-[#10b981]/30 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        {subj.statusBadge}
                      </span>
                    </div>
                  </div>

                  {/* Progreso de Estudio */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#E50914]" />
                        Progreso de Estudio
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-400 text-[11px]">
                          ({subj.completedTopicsCount} / {subj.totalTopicsCount} temas vistos)
                        </span>
                        <span className="text-sm font-black text-white">
                          {subj.progressPerc}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-[#161b22] border border-[#30363d] rounded-full overflow-hidden p-[1px]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#f85149] transition-all duration-500 shadow-[0_0_8px_rgba(229,9,20,0.5)]"
                        style={{ width: `${Math.min(100, Math.max(0, subj.progressPerc))}%` }}
                      />
                    </div>
                  </div>

                  {/* Horarios de Cursado */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      Horarios de Cursado
                    </h5>

                    <div className="space-y-1.5">
                      {subj.schedules.map((sch) => (
                        <div
                          key={sch.id}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{sch.day}:</span>
                            <span className="text-zinc-300">{sch.time}</span>
                          </div>
                          <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-md bg-[#161b22] text-zinc-400 border border-[#30363d]">
                            {sch.shift}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Próximos Exámenes */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      Próximos Exámenes de la Materia
                    </h5>

                    <div className="space-y-2">
                      {subj.exams.map((exam) => {
                        const isRed = exam.daysRemaining <= 2 || exam.isCritical;

                        return (
                          <div
                            key={exam.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                              isRed
                                ? 'bg-[#220d0f] border-[#E50914]/50 shadow-[0_0_14px_rgba(229,9,20,0.15)]'
                                : 'bg-[#1e1708] border-[#d29922]/40'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {exam.title}:
                                </span>
                                <span className="text-xs text-zinc-300">
                                  {exam.dateFormatted}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400">
                                Ponderación: {exam.weight.toFixed(1)}x • Enfoque prioritario
                              </p>
                            </div>

                            <div className="shrink-0 self-start sm:self-auto">
                              {isRed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-[#E50914]/20 text-[#ff7b72] border border-[#E50914]/60 shadow-[0_0_10px_rgba(229,9,20,0.3)] animate-pulse">
                                  <AlertCircle className="w-3.5 h-3.5 text-[#ff7b72]" />
                                  <span>(En {exam.daysRemaining} días)</span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-[#E50914] text-white font-sans font-black">
                                    Crítico
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-[#d29922]/15 text-[#e3b341] border border-[#d29922]/50">
                                  <Clock className="w-3.5 h-3.5 text-[#e3b341]" />
                                  <span>(En {exam.daysRemaining} días)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Acciones con preventDefault y stopPropagation explícitos */}
                  <div className="pt-2 border-t border-[#30363d] flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveModal({ type: 'SYLLABUS', subject: subj });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Ver Temario / Unidades</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveModal({ type: 'EDIT_COURSE', subject: subj });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#161b22] hover:bg-[#21262d] text-zinc-300 hover:text-white border border-[#30363d] hover:border-zinc-500 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Editar Cursado</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Exclusión Notice */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span>
              <strong>Filtro de Cursada:</strong> Materia "Diseño" excluida deliberadamente de este ciclo hasta la apertura del próximo período lectivo.
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
            Regla Activa
          </span>
        </div>
      </main>

      {/* 3. Modal con React Portal (Fondo fijo desacoplado en document.body) */}
      {mounted && typeof document !== 'undefined' && activeModal && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex justify-between items-center mb-4 border-b border-[#30363d] pb-3">
              <h3 className="text-xl font-bold">
                {activeModal.type === 'SYLLABUS' ? `Temario: ${activeModal.subject.name}` : `Editar Cursado: ${activeModal.subject.name}`}
              </h3>
              <button 
                type="button" 
                className="text-gray-400 hover:text-white text-xl p-1 cursor-pointer transition-colors"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal: Temario */}
            {activeModal.type === 'SYLLABUS' && (
              <SyllabusContent 
                subject={activeModal.subject} 
                onClose={() => setActiveModal(null)} 
                onSubjectUpdated={handleSubjectUpdated}
              />
            )}

            {/* Cuerpo del Modal: Editar Cursado */}
            {activeModal.type === 'EDIT_COURSE' && (
              <EditCourseContent 
                subject={activeModal.subject} 
                onClose={() => setActiveModal(null)} 
                onSubjectUpdated={handleSubjectUpdated}
              />
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: + NUEVA MATERIA / FINAL */}
      {(isNewSubjectModalOpen || externalNewSubjectModalOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            setIsNewSubjectModalOpen(false);
            if (onCloseExternalNewSubjectModal) onCloseExternalNewSubjectModal();
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl p-6 space-y-6 text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#E50914] flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                  Nueva Materia / Final
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Registra una cursada académica o examen final con horarios y ponderación.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNewSubjectModalOpen(false);
                  if (onCloseExternalNewSubjectModal) onCloseExternalNewSubjectModal();
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#30363d] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formFeedback && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300">
                {formFeedback}
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Nombre de la Materia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sistemas Operativos, Base de Datos..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Día de Cursado</label>
                  <select
                    value={formScheduleDay}
                    onChange={(e) => setFormScheduleDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Horario</label>
                  <input
                    type="text"
                    value={formScheduleTime}
                    onChange={(e) => setFormScheduleTime(e.target.value)}
                    placeholder="08:00 - 12:00"
                    className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Turno</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Tipo de Examen</label>
                  <select
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="1.º Parcial">1.º Parcial</option>
                    <option value="2.º Parcial">2.º Parcial</option>
                    <option value="3.º Parcial">3.º Parcial</option>
                    <option value="Examen Global">Examen Global</option>
                    <option value="Final Regular">Final Regular</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Fecha del Examen</label>
                  <input
                    type="date"
                    required
                    value={formExamDate}
                    onChange={(e) => setFormExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300">
                    Ponderación de Prioridad (1.0 - 2.0)
                  </span>
                  <span className="font-mono font-bold text-[#f85149] px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d]">
                    {Number(formWeight).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={formWeight}
                  onChange={(e) => setFormWeight(parseFloat(e.target.value))}
                  className="w-full accent-[#E50914] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>1.0x (Normal)</span>
                  <span>1.5x (Recomendada)</span>
                  <span>2.0x (Crítica Máxima)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSubjectModalOpen(false);
                    if (onCloseExternalNewSubjectModal) onCloseExternalNewSubjectModal();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E50914] hover:bg-[#b80710] text-white transition-all shadow-[0_0_12px_rgba(229,9,20,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Materia</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicoPage;
