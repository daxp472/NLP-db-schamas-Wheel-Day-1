import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ContactController } from '../controllers/contact.controller';

const router = Router();

// Rate limiter for contact submissions: 10 per 15 minutes per IP
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many contact submissions. Please wait a few minutes before trying again.',
    },
  },
});

router.post('/', contactRateLimiter, ContactController.submit);

export default router;
