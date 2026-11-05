import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/checkout', requireAuth, BillingController.createCheckout);
router.post('/webhook', BillingController.handleWebhook);
router.post('/dev-activate', requireAuth, BillingController.devActivate);
router.get('/status', requireAuth, BillingController.getStatus);

export default router;
