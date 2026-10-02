import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'lifeflow_jwt_secret_dev_2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string | null;
    name: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Authentication middleware that extracts JWT from Authorization header.
 * If token is present and valid, attaches authenticated userId.
 * If no token is provided, falls back to the default account (Pablo)
 * to maintain local backwards compatibility and uninterrupted dashboard operation.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    let token: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (queryToken) {
      token = queryToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        req.userId = user.id;
        req.user = user;
        return next();
      } catch (err: any) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }

    // Fallback: If no token provided, resolve or create default account
    let defaultUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true },
    });

    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: 'Pablo',
          email: 'pablo@lifeflow.local',
          passwordHash: '',
        },
        select: { id: true, email: true, name: true },
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
 * Strict authentication middleware: requires a valid JWT token.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticación requerida. Token no suministrado.' });
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
