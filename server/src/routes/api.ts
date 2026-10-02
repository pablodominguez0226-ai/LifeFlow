import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { DashboardController } from '../controllers/dashboardController';
import { CalendarController } from '../controllers/calendarController';
import { SubjectController } from '../controllers/subjectController';
import { ExamController } from '../controllers/examController';
import { TaskController } from '../controllers/taskController';
import { PlanningController } from '../controllers/planningController';
import { CheckinController } from '../controllers/checkinController';
import { BookController } from '../controllers/bookController';
import { StatsController, RecommendationController } from '../controllers/statsController';
import { RecurringRuleController } from '../controllers/recurringRuleController';
import { AiController } from '../controllers/aiController';
import { AcademicController } from '../controllers/academicController';

const router = Router();

// Auth Endpoints
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authMiddleware, AuthController.me);

// Global Authentication & Account Context Middleware
router.use(authMiddleware);

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

// Subjects & Exams & Tasks & Units & Topics
router.get('/subjects', SubjectController.getSubjects);
router.get('/subjects/:id', SubjectController.getSubjectById);
router.post('/subjects', SubjectController.createSubject);
router.patch('/subjects/:id', SubjectController.updateSubject);
router.delete('/subjects/:id', SubjectController.deleteSubject);
router.post('/subjects/:id/log-focus-session', SubjectController.logFocusSession);

// Academic Units & Topics (Hierarchical Spaced Repetition)
router.get('/subjects/:id/units', AcademicController.getUnitsBySubject);
router.post('/subjects/:id/units', AcademicController.createUnit);
router.delete('/units/:id', AcademicController.deleteUnit);
router.post('/units/:id/topics', AcademicController.createTopic);
router.patch('/topics/:id', AcademicController.updateTopic);
router.delete('/topics/:id', AcademicController.deleteTopic);
router.post('/topics/:id/study-session', AcademicController.recordStudySession);
router.get('/academic/guided-study', AcademicController.getGuidedStudy);

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
router.post('/habits', CheckinController.createHabit);
router.patch('/habits/:id', CheckinController.updateHabit);
router.delete('/habits/:id', CheckinController.deleteHabit);
router.patch('/habits/:id/toggle', CheckinController.toggleHabit);
router.patch('/habits/:id/toggle-date', CheckinController.toggleHabitDate);
router.post('/checkin', CheckinController.createCheckin);
router.get('/checkin/history', CheckinController.getHistory);
router.get('/checkin/priority-tasks', CheckinController.getPriorityTasks);
router.patch('/checkin/priority-tasks/:taskId/toggle', CheckinController.togglePriorityTask);
router.post('/checkin/priority-tasks', CheckinController.addPriorityTask);

// Books & Readings
router.get('/books', BookController.getBooks);
router.post('/books', BookController.createBook);
router.patch('/books/:id', BookController.updateBook);
router.patch('/books/:id/start', BookController.startReading);
router.delete('/books/:id', BookController.deleteBook);

// Recommendations & Stats
router.get('/recommendations', RecommendationController.getRecommendations);
router.patch('/recommendations/:id/dismiss', RecommendationController.dismissRecommendation);
router.get('/statistics', StatsController.getStats);

// AI Copilot
router.get('/ai/daily-briefing', AiController.getDailyBriefing);

export default router;
