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

/**
 * @route GET /api/users/quiz-results
 * @desc Get current user's quiz results only
 * @middleware authenticate
 */
router.get('/quiz-results', authenticate, userController.getUserQuizResults);

/**
 * @route POST /api/users/quiz-results
 * @desc Save quiz result for current user
 * @middleware authenticate
 */
router.post('/quiz-results', authenticate, userController.saveQuizResult);

/**
 * @route GET /api/users/quiz-stats
 * @desc Get current user's quiz statistics
 * @middleware authenticate
 */
router.get('/quiz-stats', authenticate, userController.getUserQuizStats);

/**
 * @route GET /api/users/leaderboard
 * @desc Get global leaderboard (only users with quiz attempts)
 * @query category - Optional category filter
 * @query difficulty - Optional difficulty filter
 * @query limit - Optional limit (default 50, max 100)
 * @public - No authentication required
 */
router.get('/leaderboard', userController.getLeaderboard);

export default router;
