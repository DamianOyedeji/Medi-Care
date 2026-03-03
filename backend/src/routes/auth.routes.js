import express from 'express';
import { signup, login, logout, getProfile, updateProfile, changePassword, forgotPassword, verifyEmail, deleteAccount, refreshToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/verify-email', verifyEmail);
router.post('/refresh', refreshToken);

router.use(authenticate);

router.post('/logout', logout);
router.get('/me', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);
router.delete('/account', deleteAccount);

export default router;
