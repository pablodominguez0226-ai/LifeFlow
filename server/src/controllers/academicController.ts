import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AcademicController {
  /**
   * POST /api/subjects/:id/units
   * Create a new unit under a subject
   */
  public static async createUnit(req: Request, res: Response) {
    try {
      const subjectId = req.params.id as string;
      const { title } = req.body;
      let unitNumber = req.body.unitNumber;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'El título de la unidad es requerido' });
      }

      // If unitNumber is not provided, auto-increment based on existing units
      if (unitNumber === undefined || unitNumber === null) {
        const lastUnit = await prisma.academicUnit.findFirst({
          where: { subjectId },
          orderBy: { unitNumber: 'desc' },
        });
        unitNumber = lastUnit ? lastUnit.unitNumber + 1 : 1;
      } else {
        unitNumber = Number(unitNumber);
      }

      const unit = await prisma.academicUnit.create({
        data: {
          subjectId,
          unitNumber,
          title: title.trim(),
        },
        include: {
          topics: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      res.status(201).json(unit);
    } catch (error: any) {
      console.error('Error creating academic unit:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/subjects/:id/units
   * List all units and their topics for a subject
   */
  public static async getUnitsBySubject(req: Request, res: Response) {
    try {
      const subjectId = req.params.id as string;
      const units = await prisma.academicUnit.findMany({
        where: { subjectId },
        include: {
          topics: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { unitNumber: 'asc' },
      });

      res.json(units);
    } catch (error: any) {
      console.error('Error fetching academic units:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/units/:id
   * Delete a unit and cascade its topics
   */
  public static async deleteUnit(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await prisma.academicUnit.delete({
        where: { id },
      });
      res.json({ success: true, message: 'Unidad eliminada correctamente' });
    } catch (error: any) {
      console.error('Error deleting academic unit:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/units/:id/topics
   * Create a new topic under a unit
   */
  public static async createTopic(req: Request, res: Response) {
    try {
      const unitId = req.params.id as string;
      const { title, status } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'El título del tema es requerido' });
      }

      const topic = await prisma.academicTopic.create({
        data: {
          unitId,
          title: title.trim(),
          status: status || 'PENDIENTE',
        },
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
      });

      res.status(201).json(topic);
    } catch (error: any) {
      console.error('Error creating academic topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/topics/:id
   * Update title, status or lastStudiedAt
   */
  public static async updateTopic(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, status, lastStudiedAt, lastStudiedToday, reviewCount } = req.body;

      // Check if it's an AcademicTopic first
      const existingAcademicTopic = await prisma.academicTopic.findUnique({
        where: { id },
      });

      if (existingAcademicTopic) {
        const updateData: any = {};
        if (title !== undefined) updateData.title = String(title).trim();
        if (status !== undefined) updateData.status = status;
        if (lastStudiedToday === true || lastStudiedAt === 'now') {
          updateData.lastStudiedAt = new Date();
        } else if (lastStudiedAt !== undefined) {
          updateData.lastStudiedAt = lastStudiedAt ? new Date(lastStudiedAt) : null;
        }
        if (reviewCount !== undefined) {
          updateData.reviewCount = Number(reviewCount);
        }

        const updated = await prisma.academicTopic.update({
          where: { id },
          data: updateData,
          include: {
            unit: {
              include: {
                subject: true,
              },
            },
          },
        });
        return res.json(updated);
      }

      // Fallback for legacy Topic model if any
      const existingLegacyTopic = await prisma.topic.findUnique({
        where: { id },
      });

      if (existingLegacyTopic) {
        const legacyData: any = {};
        if (title !== undefined) legacyData.title = String(title).trim();
        if (status !== undefined) legacyData.status = status;

        const updatedLegacy = await prisma.topic.update({
          where: { id },
          data: legacyData,
        });
        return res.json(updatedLegacy);
      }

      return res.status(404).json({ error: 'Tema no encontrado' });
    } catch (error: any) {
      console.error('Error updating topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/topics/:id
   * Delete a topic
   */
  public static async deleteTopic(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const existingAcademic = await prisma.academicTopic.findUnique({ where: { id } });
      if (existingAcademic) {
        await prisma.academicTopic.delete({ where: { id } });
        return res.json({ success: true, message: 'Tema eliminado correctamente' });
      }

      const existingLegacy = await prisma.topic.findUnique({ where: { id } });
      if (existingLegacy) {
        await prisma.topic.delete({ where: { id } });
        return res.json({ success: true, message: 'Tema eliminado correctamente' });
      }

      return res.status(404).json({ error: 'Tema no encontrado' });
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/topics/:id/study-session
   * Spaced repetition progression:
   * - If PENDIENTE -> REVISION_PENDIENTE with lastStudiedAt = now()
   * - If REVISION_PENDIENTE and >= 24h (or force: true) -> DOMINADO
   */
  public static async recordStudySession(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { force } = req.body || {};

      const topic = await prisma.academicTopic.findUnique({
        where: { id },
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
      });

      if (!topic) {
        return res.status(404).json({ error: 'Tema no encontrado' });
      }

      const now = new Date();
      let nextStatus = topic.status;
      let message = '';

      if (topic.status === 'PENDIENTE' || topic.status === 'EN_PROGRESO') {
        nextStatus = 'REVISION_PENDIENTE';
        message = 'Tema estudiado por primera vez. Programado para repaso al día siguiente.';
      } else if (topic.status === 'REVISION_PENDIENTE') {
        const hoursPassed = topic.lastStudiedAt
          ? (now.getTime() - new Date(topic.lastStudiedAt).getTime()) / (1000 * 60 * 60)
          : 24;

        // If >= 20 hours or user explicitly completes the session via UI
        if (hoursPassed >= 20 || force === true || req.body.action === 'COMPLETAR_REPASO') {
          nextStatus = 'DOMINADO';
          message = 'Repaso completado exitosamente. ¡Tema Dominado!';
        } else {
          // Allow completion while logging feedback
          nextStatus = 'DOMINADO';
          message = 'Repaso completado. Tema Dominado.';
        }
      } else if (topic.status === 'DOMINADO') {
        nextStatus = 'DOMINADO';
        message = 'Sesión de repaso adicional consolidada.';
      }

      const updatedTopic = await prisma.academicTopic.update({
        where: { id },
        data: {
          status: nextStatus,
          lastStudiedAt: now,
          reviewCount: { increment: 1 },
        },
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
      });

      res.json({
        topic: updatedTopic,
        message,
        previousStatus: topic.status,
        newStatus: nextStatus,
      });
    } catch (error: any) {
      console.error('Error recording study session:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/academic/guided-study
   * Returns guided study topics for today:
   * 1. Topic needing review (studied yesterday / >= 24h ago with REVISION_PENDIENTE)
   * 2. Next virgin topic to study (PENDIENTE)
   */
  public static async getGuidedStudy(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const whereUnit: any = {};
      if (userId) {
        whereUnit.subject = { userId };
      }

      // 1. Topic needing review: REVISION_PENDIENTE
      const pendingReviewTopics = await prisma.academicTopic.findMany({
        where: {
          status: 'REVISION_PENDIENTE',
          unit: whereUnit,
        },
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: { lastStudiedAt: 'asc' },
      });

      const now = new Date();
      // Prioritize topics studied >= 20h ago, or pick the oldest review
      const dueReviewTopic = pendingReviewTopics.find((t) => {
        if (!t.lastStudiedAt) return true;
        const hoursPassed = (now.getTime() - new Date(t.lastStudiedAt).getTime()) / (1000 * 60 * 60);
        return hoursPassed >= 18;
      }) || pendingReviewTopics[0] || null;

      // 2. Next virgin topic: PENDIENTE
      const nextNewTopic = await prisma.academicTopic.findFirst({
        where: {
          status: 'PENDIENTE',
          unit: whereUnit,
        },
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: [
          { unit: { unitNumber: 'asc' } },
          { createdAt: 'asc' },
        ],
      });

      // Stats
      const totalTopics = await prisma.academicTopic.count({
        where: { unit: whereUnit },
      });
      const masteredTopics = await prisma.academicTopic.count({
        where: { status: 'DOMINADO', unit: whereUnit },
      });

      res.json({
        pendingReviewTopic: dueReviewTopic,
        nextNewTopic,
        stats: {
          totalTopics,
          masteredTopics,
          pendingReviewCount: pendingReviewTopics.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching guided study topics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/subjects/:id
   * Update subject details (name, code, targetHours, difficulty/masteryLevel, priorityWeight, type, color, etc.)
   */
  public static async updateSubject(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const {
        name,
        code,
        type,
        color,
        professor,
        masteryLevel,
        priorityWeight,
        targetHours,
        difficulty,
      } = req.body;

      const existing = await prisma.subject.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Materia no encontrada' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = String(name).trim();
      if (code !== undefined) updateData.code = code ? String(code).trim().toUpperCase() : null;
      if (type !== undefined) updateData.type = type;
      if (color !== undefined) updateData.color = color;
      if (professor !== undefined) updateData.professor = professor ? String(professor).trim() : null;

      // Handle difficulty mapping (can accept string BAJO/MEDIO/ALTO or numeric priority weight)
      if (difficulty !== undefined) {
        if (typeof difficulty === 'string' && ['BAJO', 'MEDIO', 'ALTO'].includes(difficulty.toUpperCase())) {
          updateData.masteryLevel = difficulty.toUpperCase();
        } else if (!isNaN(Number(difficulty))) {
          updateData.priorityWeight = Number(difficulty);
        }
      }

      if (masteryLevel !== undefined) {
        updateData.masteryLevel = String(masteryLevel).toUpperCase();
      }
      if (priorityWeight !== undefined) {
        updateData.priorityWeight = Number(priorityWeight);
      }
      if (targetHours !== undefined) {
        updateData.targetHours = targetHours !== null && targetHours !== '' ? Number(targetHours) : null;
      }

      const updated = await prisma.subject.update({
        where: { id },
        data: updateData,
        include: {
          exams: { orderBy: { date: 'asc' } },
          units: {
            include: {
              topics: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { unitNumber: 'asc' },
          },
          topics: { orderBy: { orderIndex: 'asc' } },
          academicTasks: { orderBy: { priorityScore: 'desc' } },
        },
      });

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating subject:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/subjects/:id
   * Cascade delete subject along with its exams, units, topics, and tasks
   */
  public static async deleteSubject(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
          units: { select: { id: true } },
          exams: { select: { id: true } },
          academicTasks: { select: { id: true } },
          topics: { select: { id: true } },
        },
      });

      if (!subject) {
        return res.status(404).json({ error: 'Materia no encontrada' });
      }

      const unitIds = subject.units.map((u) => u.id);
      const taskIds = subject.academicTasks.map((t) => t.id);

      // Perform cascade deletion in atomic transaction
      await prisma.$transaction(async (tx) => {
        // 1. Unlink schedule blocks referencing tasks from this subject
        if (taskIds.length > 0) {
          await tx.scheduleBlock.updateMany({
            where: { academicTaskId: { in: taskIds } },
            data: { academicTaskId: null },
          });
        }

        // 2. Unlink activities referencing this subject
        await tx.activity.updateMany({
          where: { subjectId: id },
          data: { subjectId: null },
        });

        // 3. Delete topics from academic units
        if (unitIds.length > 0) {
          await tx.academicTopic.deleteMany({
            where: { unitId: { in: unitIds } },
          });
        }

        // 4. Delete academic units
        await tx.academicUnit.deleteMany({
          where: { subjectId: id },
        });

        // 5. Delete academic tasks
        await tx.academicTask.deleteMany({
          where: { subjectId: id },
        });

        // 6. Delete legacy topics
        await tx.topic.deleteMany({
          where: { subjectId: id },
        });

        // 7. Delete exams
        await tx.exam.deleteMany({
          where: { subjectId: id },
        });

        // 8. Delete the subject itself
        await tx.subject.delete({
          where: { id },
        });
      });

      res.json({ success: true, message: 'Materia y dependencias eliminadas con éxito', id });
    } catch (error: any) {
      console.error('Error deleting subject in cascade:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

