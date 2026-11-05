import { Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe instance if key exists
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia' as any,
    })
  : null;

export class BillingController {
  /**
   * POST /api/billing/checkout
   * Crea una Checkout Session de Stripe para LifeFlow PRO ($3 USD/mes)
   */
  public static async createCheckout(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Check origin from headers or env
      const origin =
        req.headers.origin ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host')}` ||
        'http://localhost:3000';

      // If Stripe is not configured with a valid secret key, provide a seamless test-mode activation URL
      if (!stripe || !stripeSecretKey || stripeSecretKey.startsWith('tu_') || stripeSecretKey.includes('placeholder')) {
        console.warn('[Billing] Stripe Secret Key no configurada. Generando URL de prueba de simulación de Checkout.');
        
        // Simular éxito directamente o devolver URL de retorno simulada
        const devCheckoutUrl = `${origin}/suscripcion?dev_checkout=true&userId=${user.id}`;
        return res.json({
          checkoutUrl: devCheckoutUrl,
          sessionId: `dev_sess_${Date.now()}`,
          isDevMode: true,
          message: 'Modo de desarrollo activo. Usa esta URL para simular la activación de PRO.',
        });
      }

      // Ensure Stripe Customer
      let customerId = user.subscription?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: { stripeCustomerId: customerId },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
            status: SubscriptionStatus.INACTIVE,
          },
        });
      }

      // Create Stripe Subscription Checkout Session for $3 USD / month
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'LifeFlow PRO',
                description: 'Acceso total, Asistente Telegram 24/7, Briefings matutinos, Google Calendar Sync en vivo, Heatmap ilimitado',
              },
              unit_amount: 300, // $3.00 USD
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/suscripcion?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/suscripcion?canceled=true`,
      });

      return res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error('Error en createCheckout:', error);
      return res.status(500).json({ error: error.message || 'Error al crear sesión de pago' });
    }
  }

  /**
   * POST /api/billing/webhook
   * Maneja activaciones, renovaciones y cancelaciones enviadas por Stripe
   */
  public static async handleWebhook(req: any, res: Response) {
    let event: Stripe.Event;

    try {
      if (stripe && stripeWebhookSecret && req.headers['stripe-signature']) {
        const sig = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
      } else {
        // If webhook secret is not set, parse payload directly
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log(`[Billing Webhook] Evento recibido: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = (session.metadata?.userId || session.client_reference_id) as string;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId) {
            await prisma.subscription.upsert({
              where: { userId },
              update: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: SubscriptionStatus.ACTIVE,
              },
              create: {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: SubscriptionStatus.ACTIVE,
              },
            });

            await prisma.user.update({
              where: { id: userId },
              data: { plan: PlanTier.PRO },
            });

            console.log(`[Billing Webhook] Usuario ${userId} ascendido exitosamente a PRO.`);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const subscriptionId = (invoice as any).subscription as string;

          const sub = await prisma.subscription.findFirst({
            where: {
              OR: [
                { stripeCustomerId: customerId },
                ...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []),
              ],
            },
          });

          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: SubscriptionStatus.ACTIVE },
            });
            await prisma.user.update({
              where: { id: sub.userId },
              data: { plan: PlanTier.PRO },
            });
          }
          break;
        }

        case 'customer.subscription.deleted':
        case 'customer.subscription.paused': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const sub = await prisma.subscription.findFirst({
            where: {
              OR: [
                { stripeSubscriptionId: subscription.id },
                { stripeCustomerId: customerId },
              ],
            },
          });

          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: SubscriptionStatus.CANCELLED },
            });

            await prisma.user.update({
              where: { id: sub.userId },
              data: { plan: PlanTier.FREE },
            });

            console.log(`[Billing Webhook] Suscripción cancelada para usuario ${sub.userId}. Degradado a FREE.`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const status = subscription.status; // active, past_due, canceled, etc.
          const customerId = subscription.customer as string;

          const sub = await prisma.subscription.findFirst({
            where: {
              OR: [
                { stripeSubscriptionId: subscription.id },
                { stripeCustomerId: customerId },
              ],
            },
          });

          if (sub) {
            let subStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;
            let planTier: PlanTier = PlanTier.PRO;

            if (status === 'canceled' || status === 'unpaid') {
              subStatus = SubscriptionStatus.CANCELLED;
              planTier = PlanTier.FREE;
            } else if (status === 'past_due') {
              subStatus = SubscriptionStatus.PAST_DUE;
            }

            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: subStatus },
            });

            await prisma.user.update({
              where: { id: sub.userId },
              data: { plan: planTier },
            });
          }
          break;
        }

        default:
          console.log(`[Billing Webhook] Evento sin handler específico: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error: any) {
      console.error('Error procesando webhook de Stripe:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/billing/dev-activate (Helper para desarrollo/testing)
   */
  public static async devActivate(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { plan: PlanTier.PRO },
      });

      await prisma.subscription.upsert({
        where: { userId },
        update: { status: SubscriptionStatus.ACTIVE },
        create: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: `cus_mock_${Date.now()}`,
          stripeSubscriptionId: `sub_mock_${Date.now()}`,
        },
      });

      return res.json({
        success: true,
        message: 'Plan PRO activado con éxito.',
        user: updatedUser,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/billing/status
   */
  public static async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.json({
        plan: user.plan,
        subscription: user.subscription,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
