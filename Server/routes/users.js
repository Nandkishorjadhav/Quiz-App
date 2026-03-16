import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @middleware authenticate
 */
router.get('/profile', authenticate, userController.getCurrentUser);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @middleware authenticate
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 * @middleware authenticate
 */
router.get('/stats', authenticate, userController.getUserStats);

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @middleware authenticate, authorize
 */
router.get('/', authenticate, authorize(['admin']), userController.getAllUsers);

/**
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @middleware authenticate
 */
router.delete('/account', authenticate, userController.deleteAccount);

export default router;
