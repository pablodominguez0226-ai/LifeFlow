"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const calendarController_1 = require("../controllers/calendarController");
const subjectController_1 = require("../controllers/subjectController");
const examController_1 = require("../controllers/examController");
const taskController_1 = require("../controllers/taskController");
const planningController_1 = require("../controllers/planningController");
const checkinController_1 = require("../controllers/checkinController");
const statsController_1 = require("../controllers/statsController");
const router = (0, express_1.Router)();
// Dashboard
router.get('/dashboard', dashboardController_1.DashboardController.getSummary);
// Calendar
router.get('/calendar', calendarController_1.CalendarController.getBlocks);
router.post('/calendar/block', calendarController_1.CalendarController.createBlock);
router.patch('/calendar/block/:id', calendarController_1.CalendarController.updateBlock);
router.delete('/calendar/block/:id', calendarController_1.CalendarController.deleteBlock);
// Subjects & Exams & Tasks
router.get('/subjects', subjectController_1.SubjectController.getSubjects);
router.get('/subjects/:id', subjectController_1.SubjectController.getSubjectById);
router.post('/subjects', subjectController_1.SubjectController.createSubject);
router.patch('/subjects/:id', subjectController_1.SubjectController.updateSubject);
router.delete('/subjects/:id', subjectController_1.SubjectController.deleteSubject);
router.get('/exams', examController_1.ExamController.getExams);
router.post('/exams', examController_1.ExamController.createExam);
router.patch('/exams/:id', examController_1.ExamController.updateExam);
router.delete('/exams/:id', examController_1.ExamController.deleteExam);
router.get('/tasks', taskController_1.TaskController.getTasks);
router.post('/tasks', taskController_1.TaskController.createTask);
router.patch('/tasks/:id', taskController_1.TaskController.updateTask);
router.delete('/tasks/:id', taskController_1.TaskController.deleteTask);
router.patch('/topics/:id/status', taskController_1.TaskController.updateTopicStatus);
// Planning Engine interactive endpoints
router.post('/planning/generate-week', planningController_1.PlanningController.generateWeek);
router.post('/planning/apply-week', planningController_1.PlanningController.applyWeek);
router.post('/planning/plan-day', planningController_1.PlanningController.planDay);
router.post('/planning/replan', planningController_1.PlanningController.replan);
// Habits & Check-ins
router.get('/habits', checkinController_1.CheckinController.getHabits);
router.patch('/habits/:id/toggle', checkinController_1.CheckinController.toggleHabit);
router.post('/checkin', checkinController_1.CheckinController.createCheckin);
router.get('/checkin/history', checkinController_1.CheckinController.getHistory);
// Recommendations & Stats
router.get('/recommendations', statsController_1.RecommendationController.getRecommendations);
router.patch('/recommendations/:id/dismiss', statsController_1.RecommendationController.dismissRecommendation);
router.get('/statistics', statsController_1.StatsController.getStats);
exports.default = router;
