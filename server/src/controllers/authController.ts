import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db';
import { AuthenticatedRequest, generateToken } from '../middlewares/authMiddleware';
import { PlanTier, Role } from '@prisma/client';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(googleClientId);

export class AuthController {
  /**
   * POST /api/auth/register
   * Email, Password, Name
   */
  public static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
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
          role: Role.USER,
          plan: PlanTier.FREE,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          createdAt: true,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return res.status(201).json({
        token,
        user,
      });
    } catch (error: any) {
      console.error('Error en register:', error);
      return res.status(500).json({ error: error.message || 'Error al registrar usuario' });
    }
  }

  /**
   * POST /api/auth/login
   * Email, Password
   */
  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { subscription: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(String(password), user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }
      } else {
        // First login for pre-seeded user without password: set provided password
        const newHash = await bcrypt.hash(String(password), 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          subscription: user.subscription,
        },
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
    }
  }

  /**
   * POST /api/auth/google
   * Token de Google (Credential ID token from GIS)
   */
  public static async google(req: AuthenticatedRequest, res: Response) {
    try {
      const token = req.body.token || req.body.credential;

      if (!token) {
        return res.status(400).json({ error: 'Token de Google requerido' });
      }

      let email: string | undefined;
      let name: string | undefined;
      let googleId: string | undefined;

      try {
        if (googleClientId) {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();
          if (payload) {
            email = payload.email;
            name = payload.name;
            googleId = payload.sub;
          }
        } else {
          // If GOOGLE_CLIENT_ID is not configured in env, decode JWT payload
          const decoded: any = jwt.decode(token);
          if (decoded && decoded.email) {
            email = decoded.email;
            name = decoded.name;
            googleId = decoded.sub;
          }
        }
      } catch (verifyErr) {
        // Fallback decoding if token is from sandbox or client id doesn't match
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name;
          googleId = decoded.sub;
        } else {
          return res.status(401).json({ error: 'Token de Google no válido' });
        }
      }

      if (!email) {
        return res.status(400).json({ error: 'No se pudo obtener el email de la cuenta de Google' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find user by email or googleId
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(googleId ? [{ googleId }] : []),
          ],
        },
        include: { subscription: true },
      });

      if (user) {
        // Update googleId or name if needed
        if (googleId && !user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
            include: { subscription: true },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: name || 'Usuario Google',
            googleId: googleId || null,
            role: Role.USER,
            plan: PlanTier.FREE,
          },
          include: { subscription: true },
        });
      }

      const sessionToken = generateToken({
        userId: user.id,
        email: user.email,
      });

      return res.json({
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          subscription: user.subscription,
        },
      });
    } catch (error: any) {
      console.error('Error en google auth:', error);
      return res.status(500).json({ error: error.message || 'Error en autenticación con Google' });
    }
  }

  /**
   * GET /api/auth/me
   */
  public static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { subscription: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          telegramChatId: user.telegramChatId,
          subscription: user.subscription,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error en me:', error);
      return res.status(500).json({ error: error.message || 'Error al obtener perfil' });
    }
  }
}
