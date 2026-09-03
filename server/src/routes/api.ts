import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { CalendarController } from '../controllers/calendarController';
import { SubjectController } from '../controllers/subjectController';
import { ExamController } from '../controllers/examController';
import { TaskController } from '../controllers/taskController';
import { PlanningController } from '../controllers/planningController';
import { CheckinController } from '../controllers/checkinController';
import { StatsController, RecommendationController } from '../controllers/statsController';
import { RecurringRuleController } from '../controllers/recurringRuleController';

const router = Router();

// Dashboard
router.get('/dashboard', DashboardController.getSummary);

// Calendar
router.get('/calendar/feed.ics', CalendarController.getIcsFeed);
router.get('/calendar', CalendarController.getBlocks);
router.post('/calendar/block', CalendarController.createBlock);
router.patch('/calendar/block/:id', CalendarController.updateBlock);
router.delete('/calendar/block/:id', CalendarController.deleteBlock);

// Recurring Schedule Rules (Horarios Fijos / Cursadas recurrentes)
router.get('/recurring-rules', RecurringRuleController.getRules);
router.post('/recurring-rules', RecurringRuleController.createRule);
router.patch('/recurring-rules/:id', RecurringRuleController.updateRule);
router.delete('/recurring-rules/:id', RecurringRuleController.deleteRule);

// Subjects & Exams & Tasks
router.get('/subjects', SubjectController.getSubjects);
router.get('/subjects/:id', SubjectController.getSubjectById);
router.post('/subjects', SubjectController.createSubject);
router.patch('/subjects/:id', SubjectController.updateSubject);
router.delete('/subjects/:id', SubjectController.deleteSubject);

router.get('/exams', ExamController.getExams);
router.post('/exams', ExamController.createExam);
router.patch('/exams/:id', ExamController.updateExam);
router.delete('/exams/:id', ExamController.deleteExam);

router.get('/tasks', TaskController.getTasks);
router.post('/tasks', TaskController.createTask);
router.patch('/tasks/:id', TaskController.updateTask);
router.delete('/tasks/:id', TaskController.deleteTask);
router.patch('/topics/:id/status', TaskController.updateTopicStatus);

// Planning Engine interactive endpoints
router.post('/planning/generate-week', PlanningController.generateWeek);
router.post('/planning/apply-week', PlanningController.applyWeek);
router.post('/planning/plan-day', PlanningController.planDay);
router.post('/planning/replan', PlanningController.replan);

// Habits & Check-ins
router.get('/habits', CheckinController.getHabits);
router.patch('/habits/:id/toggle', CheckinController.toggleHabit);
router.post('/checkin', CheckinController.createCheckin);
router.get('/checkin/history', CheckinController.getHistory);

// Recommendations & Stats
router.get('/recommendations', RecommendationController.getRecommendations);
router.patch('/recommendations/:id/dismiss', RecommendationController.dismissRecommendation);
router.get('/statistics', StatsController.getStats);

export default router;
