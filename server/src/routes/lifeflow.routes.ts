import { getHabitsOverview, getBooksOverview } from '../controllers/catalog.controller';
import { Router } from 'express';
import { HabitsController } from '../controllers/habits.controller';
import { PlannerController } from '../controllers/planner.controller';
import { prisma } from '../db';
import { Category } from '@prisma/client';

const router = Router();

// Endpoint de alternancia atómica y reactividad de hábitos
router.post('/habits/toggle', HabitsController.toggleHabit);

// Endpoints del planificador y métricas
router.get('/planner/pre-check', PlannerController.getPreCheck);
router.get('/planner/summary', PlannerController.getWeeklySummary);
router.post('/planner/generate', PlannerController.generateWeeklyPlan);
router.get('/planner/current-week', PlannerController.getCurrentWeek);

// Endpoints de Calendario y Agenda Semanal Sanitizada
router.get('/calendar', PlannerController.getCalendar);
router.patch('/calendar/block/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.plannedSlot.update({
      where: { id },
      data: {
        status: status === 'COMPLETADO' || status === 'COMPLETED' ? 'COMPLETED' as any : 'PENDING' as any,
      },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
router.delete('/calendar/block/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.plannedSlot.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint principal del Dashboard
router.get('/dashboard', PlannerController.getDashboardData);

// GET /api/academic/subjects
// Retorna la lista de materias con su progreso, exámenes y temario parseado en JSON
router.get('/academic/subjects', async (req, res) => {
  try {
    let subjects = await prisma.academicSubject.findMany({
      orderBy: { name: 'asc' },
    });

    if (subjects.length === 0) {
      const defaultSubjects = [
        {
          name: 'Paradigmas',
          syllabus: [
            { id: 1, title: 'Unidad 1: Paradigma Funcional (Haskell)', completed: true },
            { id: 2, title: 'Unidad 2: Paradigma Lógico (Prolog)', completed: true },
            { id: 3, title: 'Unidad 3: Objetos y Polimorfismo', completed: false },
          ],
        },
        {
          name: 'Economía',
          syllabus: [
            { id: 1, title: 'Unidad 1: Microeconomía y Elasticidad', completed: true },
            { id: 2, title: 'Unidad 2: Estructuras de Mercado y Costos', completed: true },
            { id: 3, title: 'Unidad 3: Cuentas Nacionales e Inflación', completed: false },
          ],
        },
      ];

      for (const item of defaultSubjects) {
        const completed = item.syllabus.filter((t) => t.completed).length;
        const perc = Math.round((completed / item.syllabus.length) * 100);
        await prisma.academicSubject.upsert({
          where: { name: item.name },
          update: {
            progressPerc: perc,
            syllabus: item.syllabus,
          },
          create: {
            name: item.name,
            progressPerc: perc,
            syllabus: item.syllabus,
          },
        });
        await prisma.academicProgress.upsert({
          where: { subject: item.name },
          update: { progressPerc: perc },
          create: { subject: item.name, progressPerc: perc },
        });
      }

      subjects = await prisma.academicSubject.findMany({
        orderBy: { name: 'asc' },
      });
    }

    const allExams = await prisma.exam.findMany({
      orderBy: { date: 'asc' },
    });

    const result = subjects.map((subj) => {
      let parsedSyllabus: Array<{ id: number; title: string; completed: boolean }> = [];
      if (Array.isArray(subj.syllabus)) {
        parsedSyllabus = subj.syllabus as any;
      } else if (typeof subj.syllabus === 'string') {
        try {
          parsedSyllabus = JSON.parse(subj.syllabus);
        } catch {
          parsedSyllabus = [];
        }
      }

      const exams = allExams.filter((e) => {
        const sName = subj.name.toLowerCase();
        const eSubj = e.subject.toLowerCase();
        return sName === eSubj || sName.includes(eSubj) || eSubj.includes(sName);
      });

      return {
        id: subj.id,
        name: subj.name,
        progressPerc: subj.progressPerc,
        syllabus: parsedSyllabus,
        exams,
        createdAt: subj.createdAt,
        updatedAt: subj.updatedAt,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching academic subjects:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener materias' });
  }
});

// PUT /api/academic/syllabus
// Recibe { subjectName: string, syllabus: Array<{ id: number, title: string, completed: boolean }> }
// Actualiza el temario y recalcula progressPerc en base al porcentaje de items completados. Responde HTTP 200 con el objeto actualizado.
router.put('/academic/syllabus', async (req, res) => {
  try {
    const { subjectName, syllabus } = req.body;
    if (!subjectName || typeof subjectName !== 'string') {
      return res.status(400).json({ error: 'subjectName es requerido y debe ser un texto' });
    }
    if (!Array.isArray(syllabus)) {
      return res.status(400).json({ error: 'syllabus es requerido y debe ser un arreglo de temas' });
    }

    const trimmedName = subjectName.trim();
    const completedCount = syllabus.filter((t: any) => Boolean(t && t.completed)).length;
    const progressPerc = syllabus.length > 0 ? Math.round((completedCount / syllabus.length) * 100) : 0;

    const updated = await prisma.academicSubject.upsert({
      where: { name: trimmedName },
      update: {
        syllabus,
        progressPerc,
      },
      create: {
        name: trimmedName,
        syllabus,
        progressPerc,
      },
    });

    // Sincronizar también con AcademicProgress para retrocompatibilidad
    await prisma.academicProgress.upsert({
      where: { subject: trimmedName },
      update: { progressPerc },
      create: { subject: trimmedName, progressPerc },
    });

    let parsedSyllabus = [];
    if (Array.isArray(updated.syllabus)) {
      parsedSyllabus = updated.syllabus;
    } else if (typeof updated.syllabus === 'string') {
      try {
        parsedSyllabus = JSON.parse(updated.syllabus);
      } catch {
        parsedSyllabus = [];
      }
    }

    return res.status(200).json({
      id: updated.id,
      name: updated.name,
      progressPerc: updated.progressPerc,
      syllabus: parsedSyllabus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating academic syllabus:', error);
    return res.status(500).json({ error: error.message || 'Error al actualizar el temario' });
  }
});

// Endpoint de Plan Académico & Materias
router.post('/academic/subject', async (req, res) => {
  try {
    const { name, scheduleDay, scheduleTime, examType, examDate, weight, progressPerc } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'El nombre de la materia es requerido' });
    }

    const trimmedName = name.trim();

    // Upsert AcademicProgress
    const progress = await prisma.academicProgress.upsert({
      where: { subject: trimmedName },
      update: {
        progressPerc: typeof progressPerc === 'number' ? progressPerc : 0,
      },
      create: {
        subject: trimmedName,
        progressPerc: typeof progressPerc === 'number' ? progressPerc : 0,
      },
    });

    // Upsert AcademicSubject
    await prisma.academicSubject.upsert({
      where: { name: trimmedName },
      update: {
        progressPerc: typeof progressPerc === 'number' ? progressPerc : 0,
      },
      create: {
        name: trimmedName,
        progressPerc: typeof progressPerc === 'number' ? progressPerc : 0,
        syllabus: [],
      },
    });

    let createdExam = null;
    if (examType && examDate) {
      createdExam = await prisma.exam.create({
        data: {
          subject: trimmedName,
          type: String(examType),
          date: new Date(examDate),
          weight: typeof weight === 'number' ? weight : parseFloat(weight) || 1.0,
        },
      });
    }

    let createdRoutine = null;
    if (scheduleDay && scheduleTime) {
      const times = String(scheduleTime).split('-');
      const startTime = times[0]?.trim() || '08:00';
      const endTime = times[1]?.trim() || '12:00';
      const dayMap: Record<string, number> = {
        domingo: 0,
        lunes: 1,
        martes: 2,
        miercoles: 3,
        miércoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        sábado: 6,
      };
      const dayInt = typeof scheduleDay === 'number' ? scheduleDay : (dayMap[String(scheduleDay).toLowerCase()] ?? 1);

      createdRoutine = await prisma.fixedRoutine.create({
        data: {
          title: `Cursado: ${trimmedName}`,
          category: Category.ACADEMIC_CLASS,
          dayOfWeek: dayInt,
          startTime,
          endTime,
          isFlexible: false,
        },
      });
    }

    return res.status(201).json({
      success: true,
      subject: {
        id: progress.id,
        name: progress.subject,
        progressPerc: progress.progressPerc,
        exam: createdExam,
        routine: createdRoutine,
      },
    });
  } catch (error: any) {
    console.error('Error creating academic subject:', error);
    return res.status(500).json({ error: error.message || 'Error al crear materia' });
  }
});

router.get('/habits/overview', getHabitsOverview);
router.get('/books/overview', getBooksOverview);

router.post('/books', async (req, res) => {
  try {
    const { title, author, totalPages, currentPage, category, dailyTargetMin, status } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Título y autor son obligatorios' });
    }
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        totalPages: Number(totalPages) || 100,
        currentPage: Number(currentPage) || 0,
        category: category || 'General',
        dailyTargetMin: Number(dailyTargetMin) || 30,
        status: status || 'QUEUED',
      },
    });
    return res.status(201).json(book);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPage, status, totalPages, title, author } = req.body;
    const dataToUpdate: any = {};
    if (currentPage !== undefined) dataToUpdate.currentPage = Number(currentPage);
    if (status !== undefined) dataToUpdate.status = status;
    if (totalPages !== undefined) dataToUpdate.totalPages = Number(totalPages);
    if (title !== undefined) dataToUpdate.title = title;
    if (author !== undefined) dataToUpdate.author = author;

    const book = await prisma.book.update({
      where: { id },
      data: dataToUpdate,
    });
    return res.json(book);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
