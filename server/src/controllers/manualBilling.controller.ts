import { Response } from 'express';
import { PrismaClient, PaymentMethod, PaymentStatus, PlanTier, Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// Configuración fija de cobros
const PAYMENT_CONFIG = {
  BANK_TRANSFER: {
    amountUsd: 5.0,
    cbu: '0000076500000005035812',
    currency: 'USD (o equivalente en ARS)',
    instructions: 'Transferir a la cuenta indicada e ingresar el número de operación del comprobante.'
  },
  CRYPTO_USDT_TRC20: {
    amountUsd: 3.0,
    discountNote: 'Precio con descuento promocional (-40%)',
    token: 'USDT',
    network: 'TRC20 (Tron Network)',
    walletAddress: 'TVQhQRQRwce1SyPkeagsCvEKTJtLN3TKXs',
    instructions: 'Enviar exactamente 3 USDT por la red TRC-20 (Tron) y pegar el Transaction Hash (TXID).'
  }
};

// 1. Obtener datos de pago para el usuario
export async function getPaymentConfig(req: AuthenticatedRequest, res: Response) {
  return res.status(200).json(PAYMENT_CONFIG);
}

// 2. El usuario envía su comprobante o TxID
export async function submitPaymentReceipt(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { method, reference } = req.body;

    if (!method || !reference) {
      return res.status(400).json({ error: 'Método y comprobante/TXID obligatorios' });
    }

    const amountUsd = method === PaymentMethod.CRYPTO_USDT_TRC20 ? 3.0 : 5.0;

    const payment = await prisma.manualPayment.create({
      data: {
        userId,
        method: method as PaymentMethod,
        amountUsd,
        reference: reference.trim(),
        status: PaymentStatus.PENDING
      }
    });

    return res.status(201).json({ success: true, payment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// 3. ADMIN: Listar todos los comprobantes y estados de usuarios
export async function getAdminPayments(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Acceso denegado: Se requiere rol ADMIN' });
    }

    const payments = await prisma.manualPayment.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, plan: true, proExpiresAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(payments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// 4. ADMIN: Aprobar pago (Asigna Plan PRO por 30 días)
export async function approvePayment(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { paymentId } = req.params;
    const payment = await prisma.manualPayment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.$transaction([
      prisma.manualPayment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.APPROVED, reviewedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { plan: PlanTier.PRO, proExpiresAt: expiresAt }
      })
    ]);

    return res.status(200).json({ success: true, message: 'Pago aprobado y Plan PRO activado' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// 5. ADMIN: Cancelar o Revocar Plan PRO manualmente a un usuario
export async function toggleUserPlan(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { userId } = req.params;
    const { action } = req.body;

    if (action === 'REVOKE') {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: PlanTier.FREE, proExpiresAt: null }
      });
      return res.status(200).json({ success: true, message: 'Plan PRO revocado al usuario' });
    } else {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await prisma.user.update({
        where: { id: userId },
        data: { plan: PlanTier.PRO, proExpiresAt: expiresAt }
      });
      return res.status(200).json({ success: true, message: 'Plan PRO concedido por 30 días' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
