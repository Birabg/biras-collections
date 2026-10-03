import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';
import * as controller from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../validators/auth.schema';

/*
 * Auth routes.
 *
 * Throttling is applied per route rather than globally, because the risk profile
 * differs: login and password reset are credential-stuffing targets, whereas
 * reading one's own profile is not.
 */

const router = Router();

router.post('/register', authLimiter, validate('body', registerSchema), controller.register);
router.post('/login', authLimiter, validate('body', loginSchema), controller.login);

/*
 * Refresh and logout are not rate limited: refresh is a single-use rotation, so a
 * burst of legitimate calls happens on every page load in the background, and
 * both are already gated on the cookie being present and unrevoked.
 */
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

router.get('/me', requireAuth, controller.me);
router.patch('/me', requireAuth, validate('body', updateProfileSchema), controller.updateProfile);
router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate('body', changePasswordSchema),
  controller.changePassword,
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate('body', forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate('body', resetPasswordSchema),
  controller.resetPassword,
);
router.post('/verify-email', validate('body', verifyEmailSchema), controller.verifyEmail);

export default router;