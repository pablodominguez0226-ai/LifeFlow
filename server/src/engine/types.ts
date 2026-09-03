export type PriorityLevel = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type EnergyLevel = 'BAJA' | 'MEDIA' | 'ALTA';
export type FlexibilityType = 'FIJA' | 'FLEXIBLE' | 'OPCIONAL';
export type ActivityCategory =
  | 'ACADEMIA'
  | 'GIMNASIO'
  | 'DEPORTE'
  | 'SUENO'
  | 'LECTURA'
  | 'PERSONAL'
  | 'MERCADO'
  | 'DESCANSO'
  | 'OTROS';

export type TaskType =
  | 'ESTUDIO_PROFUNDO'
  | 'ESTUDIO_LIVIANO'
  | 'EJERCICIOS'
  | 'SIMULACRO'
  | 'REPASO';

export type OverloadLevel = 'BAJA' | 'MODERADA' | 'ALTA' | 'EXCESIVA';

export interface UserConstraints {
  targetWakeTime: string; // "06:30"
  maxBedTime: string; // "00:00"
  targetSleepHours: number; // 7.5
  maxFocusBlockMinutes: number; // 120
  chunkWorkMinutes: number; // 50
  chunkBreakMinutes: number; // 10
  personalBufferRatio: number; // 0.15 (15% reserved)
  travelFacultadMinutes: number; // 10
  travelGymMinutes: number; // 10
  rugbyPrepTravelMinutes: number; // 90 (round trip + prep)
  windDownStartTime: string; // "22:30" (no deep study after this)
}

export interface ExamInput {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  type: string;
  date: Date;
  weight: number; // 1 to 5
  targetHoursEstimate: number;
  completedHours: number;
}

export interface SubjectInput {
  id: string;
  name: string;
  type: 'CURSADA' | 'FINAL';
  masteryLevel: 'BAJO' | 'MEDIO' | 'ALTO';
  priorityWeight: number;
  exams: ExamInput[];
  pendingTasksCount: number;
  remainingStudyHours: number;
}

export interface TaskInput {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  taskType: TaskType;
  estimatedMinutes: number;
  remainingMinutes: number;
  energyLevel: EnergyLevel;
  dueDate?: Date;
  examId?: string;
  examDate?: Date;
  subjectMastery: 'BAJO' | 'MEDIO' | 'ALTO';
  subjectWeight: number;
}

export interface PriorityBreakdown {
  proximityScore: number;
  remainingWorkScore: number;
  lowMasteryScore: number;
  difficultyScore: number;
  importanceScore: number;
  urgencyScore: number;
  totalScore: number;
  explanation: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  category: ActivityCategory;
  title: string;
  isFixed: boolean;
  flexibility: FlexibilityType;
  energyLevel: EnergyLevel;
  justification?: string;
  subjectId?: string;
  academicTaskId?: string;
}

export interface RecurringRuleInput {
  id?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:mm", e.g. "08:00"
  endTime: string; // "HH:mm", e.g. "11:00"
  durationMinutes: number;
  title: string;
  category: ActivityCategory;
  flexibility: FlexibilityType;
  isFixed: boolean;
  energyLevel: EnergyLevel;
  justification?: string;
  notes?: string;
  location?: string;
  isActive?: boolean;
}

export interface OverloadReport {
  level: OverloadLevel;
  isOverloaded: boolean;
  totalAvailableHours: number;
  totalCommittedHours: number;
  studyHours: number;
  classHours: number;
  gymHours: number;
  sportHours: number;
  sleepHours: number;
  bufferHours: number;
  personalHours: number;
  bufferRatioRemaining: number;
  warnings: string[];
  recommendations: string[];
  suggestedSacrifices: string[];
}

export interface UserEnergyContext {
  date: Date;
  sleepHours: number;
  energyLevel: number; // 1 to 5
  stressLevel: number; // 1 to 5
  studyHoursDone?: number;
  workoutDone?: boolean;
  notes?: string | null;
}

export interface FatigueAdjustment {
  isFatigued: boolean;
  fatigueScore: number; // 0 to 100
  adjustedMaxFocusMinutes: number; // e.g. 60 vs 120
  adjustedWindDownStartTime: string; // e.g. "22:00" vs "22:30"
  downgradeDeepStudy: boolean;
  recommendedTaskType?: TaskType;
  durationScale: number; // e.g. 0.6 vs 1.0
  recommendedAction: string;
  warnings: string[];
}

export interface DailyScheduleBreakdown {
  date: Date;
  morning: TimeSlot[]; // 07:00 - 13:00
  afternoon: TimeSlot[]; // 13:00 - 19:00
  evening: TimeSlot[]; // 19:00 - 23:30
  overloadLevel: OverloadLevel;
  summary: string;
  sleepTargetProtected: boolean;
  fatigueAdjustment?: FatigueAdjustment;
}

export interface WeeklyPlanProposal {
  startDate: Date;
  endDate: Date;
  macroPhase: string;
  overloadReport: OverloadReport;
  blocks: TimeSlot[];
  sustainabilityScore: number;
  summary: string;
}
