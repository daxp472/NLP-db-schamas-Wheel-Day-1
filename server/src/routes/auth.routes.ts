import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Strict rate limiters to protect authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMIT',
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    },
  },
});

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RECOVERY_RATE_LIMIT',
      message: 'Too many password recovery requests. Please wait before retrying.',
    },
  },
});

// Public Authentication Endpoints
router.post('/register', authLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/forgot-password', recoveryLimiter, AuthController.forgotPassword);
router.post('/reset-password', recoveryLimiter, AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);

// Protected Authentication Endpoints
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/resend-verification', requireAuth, recoveryLimiter, AuthController.resendVerification);
router.patch('/profile', requireAuth, AuthController.updateProfile);
router.post('/change-password', requireAuth, AuthController.changePassword);
router.get('/sessions', requireAuth, AuthController.listSessions);
router.delete('/sessions/:id', requireAuth, AuthController.revokeSession);
router.delete('/account', requireAuth, AuthController.deleteAccount);

export default router;
