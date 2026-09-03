"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityScorer = void 0;
const date_fns_1 = require("date-fns");
class PriorityScorer {
    /**
     * Weights for the priority score components (sum to 1.0)
     */
    static WEIGHTS = {
        proximity: 0.30,
        urgency: 0.20,
        remainingWork: 0.15,
        lowMastery: 0.15,
        importance: 0.10,
        difficulty: 0.10,
    };
    /**
     * Calculate PriorityScore for a specific academic task
     */
    static calculateTaskPriority(task, referenceDate = new Date('2026-09-02T12:00:00')) {
        // 1. Proximity score (0 to 10)
        let proximityScore = 2.0;
        let daysToExam = null;
        if (task.examDate) {
            daysToExam = (0, date_fns_1.differenceInCalendarDays)(task.examDate, referenceDate);
            if (daysToExam <= 0) {
                proximityScore = 10.0;
            }
            else if (daysToExam <= 3) {
                proximityScore = 10.0;
            }
            else if (daysToExam <= 7) {
                proximityScore = 9.5;
            }
            else if (daysToExam <= 15) {
                proximityScore = 8.5;
            }
            else if (daysToExam <= 25) {
                proximityScore = 7.5;
            }
            else if (daysToExam <= 40) {
                proximityScore = 6.0;
            }
            else {
                proximityScore = Math.max(1.0, 10 - daysToExam * 0.15);
            }
        }
        // 2. Urgency score (due date proximity)
        let urgencyScore = 3.0;
        if (task.dueDate) {
            const hoursToDue = (0, date_fns_1.differenceInHours)(task.dueDate, referenceDate);
            if (hoursToDue <= 24) {
                urgencyScore = 10.0;
            }
            else if (hoursToDue <= 72) {
                urgencyScore = 9.0;
            }
            else if (hoursToDue <= 168) {
                urgencyScore = 7.5;
            }
            else {
                urgencyScore = 5.0;
            }
        }
        else if (daysToExam !== null) {
            // If no explicit task due date, inherit smoothed exam urgency
            urgencyScore = proximityScore * 0.9;
        }
        // 3. Low Mastery score (prioritizing topics with lowest mastery)
        let lowMasteryScore = 5.0;
        if (task.subjectMastery === 'BAJO') {
            lowMasteryScore = 10.0;
        }
        else if (task.subjectMastery === 'MEDIO') {
            lowMasteryScore = 6.5;
        }
        else {
            lowMasteryScore = 2.5;
        }
        // 4. Remaining work score (0 to 10 based on remaining minutes)
        const remainingWorkScore = Math.min(10.0, Math.max(2.0, (task.remainingMinutes / 60) * 4.0));
        // 5. Importance score (based on subject weight / exam weight)
        const importanceScore = Math.min(10.0, task.subjectWeight * 3.5);
        // 6. Difficulty score (deep study / simulation vs light review)
        let difficultyScore = 5.0;
        if (task.taskType === 'SIMULACRO' || task.taskType === 'ESTUDIO_PROFUNDO') {
            difficultyScore = 9.0;
        }
        else if (task.taskType === 'EJERCICIOS') {
            difficultyScore = 7.0;
        }
        else if (task.taskType === 'REPASO') {
            difficultyScore = 5.0;
        }
        else {
            difficultyScore = 3.0;
        }
        // Weighted composite score scaled to 0 - 100
        const compositeRaw = this.WEIGHTS.proximity * proximityScore +
            this.WEIGHTS.urgency * urgencyScore +
            this.WEIGHTS.remainingWork * remainingWorkScore +
            this.WEIGHTS.lowMastery * lowMasteryScore +
            this.WEIGHTS.importance * importanceScore +
            this.WEIGHTS.difficulty * difficultyScore;
        const totalScore = Math.round(compositeRaw * 10 * 10) / 10; // 0 to 100 with 1 decimal
        // Generate clear, explainable justification in Spanish
        let explanation = `Prioridad calculada: ${totalScore}/100. `;
        if (daysToExam !== null) {
            explanation += `Examen a ${daysToExam} días (${task.subjectName}). `;
        }
        explanation += `Dominio: ${task.subjectMastery.toLowerCase()}. `;
        explanation += `Tipo: ${task.taskType.replace('_', ' ').toLowerCase()}.`;
        return {
            proximityScore: Math.round(proximityScore * 10) / 10,
            urgencyScore: Math.round(urgencyScore * 10) / 10,
            remainingWorkScore: Math.round(remainingWorkScore * 10) / 10,
            lowMasteryScore: Math.round(lowMasteryScore * 10) / 10,
            difficultyScore: Math.round(difficultyScore * 10) / 10,
            importanceScore: Math.round(importanceScore * 10) / 10,
            totalScore,
            explanation,
        };
    }
    /**
     * Calculate Subject priority relative to current date
     */
    static calculateSubjectPriority(subject, referenceDate = new Date('2026-09-02T12:00:00')) {
        let nearestExamDays = null;
        let closestExam = null;
        for (const exam of subject.exams) {
            const days = (0, date_fns_1.differenceInCalendarDays)(exam.date, referenceDate);
            if (days >= 0 && (nearestExamDays === null || days < nearestExamDays)) {
                nearestExamDays = days;
                closestExam = exam;
            }
        }
        let proximityFactor = 2.0;
        if (nearestExamDays !== null) {
            if (nearestExamDays <= 7)
                proximityFactor = 10.0;
            else if (nearestExamDays <= 15)
                proximityFactor = 8.0;
            else if (nearestExamDays <= 30)
                proximityFactor = 6.0;
            else if (nearestExamDays <= 45)
                proximityFactor = 4.5;
            else
                proximityFactor = 2.0;
        }
        const masteryFactor = subject.masteryLevel === 'BAJO' ? 9.0 : subject.masteryLevel === 'MEDIO' ? 5.5 : 2.5;
        const remainingHoursFactor = Math.min(10.0, (subject.remainingStudyHours / 15) * 10);
        const weightFactor = subject.priorityWeight * 2.0;
        const score = Math.round((proximityFactor * 0.4 +
            masteryFactor * 0.25 +
            remainingHoursFactor * 0.2 +
            weightFactor * 0.15) *
            10 *
            10) / 10;
        const explanation = closestExam
            ? `${subject.name}: Próximo examen '${closestExam.title}' en ${nearestExamDays} días. Dominio ${subject.masteryLevel}.`
            : `${subject.name}: Sin exámenes inmediatos registrados.`;
        return {
            priorityScore: score,
            nearestExamDays,
            explanation,
        };
    }
}
exports.PriorityScorer = PriorityScorer;
