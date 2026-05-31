import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  logout, 
  getAllTeammates, 
  refreshToken, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { 
  validateRegister, 
  validateLogin, 
  validateRefreshToken, 
  validateForgotPassword, 
  validateResetPassword 
} from '../validators/authValidator';

const router = Router();

router.post('/register', validateBody(validateRegister), register);
router.post('/login', validateBody(validateLogin), login);
router.post('/refresh-token', validateBody(validateRefreshToken), refreshToken);
router.post('/forgot-password', validateBody(validateForgotPassword), forgotPassword);
router.post('/reset-password', validateBody(validateResetPassword), resetPassword);

router.get('/profile', protect, getProfile);
router.get('/teammates', protect, getAllTeammates);
router.post('/logout', protect, logout);

export default router;
