import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { PlanTier, Role } from '@prisma/client';

export const JWT_SECRET = process.env.JWT_SECRET || 'lifeflow_jwt_secret_dev_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  plan: PlanTier;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: AuthenticatedUser;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' });
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.query && typeof req.query.token === 'string') {
    return req.query.token.trim();
  }
  return undefined;
}

/**
 * Permissive authentication middleware:
 * If a valid token is provided, authenticates the user.
 * If no token is provided, falls back to the default account (Pablo) for backwards compatibility.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true, plan: true },
        });

        if (user) {
          req.userId = user.id;
          req.user = user;
          return next();
        }
      } catch (err: any) {
        // Token invalid or expired
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }

    // Fallback account
    let defaultUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true, role: true, plan: true },
    });

    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: 'Pablo Dominguez',
          email: 'pablo@lifeflow.local',
          passwordHash: '',
          role: Role.ADMIN,
          plan: PlanTier.PRO,
        },
        select: { id: true, email: true, name: true, role: true, plan: true },
      });
    }

    req.userId = defaultUser.id;
    req.user = defaultUser;
    next();
  } catch (error: any) {
    console.error('Error en authMiddleware:', error);
    next(error);
  }
}

/**
 * Strict authentication middleware:
 * Requires a valid JWT token via Authorization Bearer or query token.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Autenticación requerida. Token no suministrado.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, plan: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Subscription tier guard:
 * Verifies that the user has the required plan tier (or ADMIN role).
 */
export function requirePlan(tier: 'PRO') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Autenticación requerida' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, plan: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      if (user.role === Role.ADMIN) {
        return next();
      }

      if (tier === 'PRO' && user.plan !== PlanTier.PRO) {
        return res.status(403).json({
          error: 'Esta función requiere suscripción PRO ($3 USD/mes)',
          code: 'PRO_REQUIRED',
        });
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
}
