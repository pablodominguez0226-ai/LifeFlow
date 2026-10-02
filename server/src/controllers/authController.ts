import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { AuthenticatedRequest, generateToken } from '../middlewares/authMiddleware';

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail.includes('@')) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      if (String(password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'El email ya se encuentra registrado' });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);

      const user = await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email!,
      });

      res.status(201).json({
        token,
        user,
      });
    } catch (error: any) {
      console.error('Error en register:', error);
      res.status(500).json({ error: error.message || 'Error al registrar usuario' });
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // If user has a password hash, compare using bcrypt
      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(String(password), user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }
      } else {
        // Legacy seed user without password: set password on first login
        const newHash = await bcrypt.hash(String(password), 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email!,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          name: true,
          targetWakeTime: true,
          maxBedTime: true,
          targetSleepHours: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user });
    } catch (error: any) {
      console.error('Error en me:', error);
      res.status(500).json({ error: error.message || 'Error al obtener perfil' });
    }
  }
}
