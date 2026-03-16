import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login user with email and password
 * @body {email, password}
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/signup
 * @desc Register new user
 * @body {name, email, password, confirmPassword, role}
 */
router.post('/signup', authController.signup);

/**
 * @route POST /api/auth/verify
 * @desc Verify JWT token and get user info
 * @middleware authenticate
 */
router.post('/verify', authenticate, authController.verifyAuth);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @middleware authenticate
 */
router.post('/logout', authenticate, authController.logout);

export default router;
