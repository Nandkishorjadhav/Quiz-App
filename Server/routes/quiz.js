import express from 'express';
import {
  generateQuiz,
  getQuiz,
  submitQuiz,
  getQuizHistory,
  getLeaderboard,
  getUserStats,
  createManualQuiz,
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protect all quiz routes with authentication
router.use(authenticate);

/**
 * @route   POST /api/quiz/generate
 * @desc    Generate AI quiz
 * @access  Private
 * @body    { topic, difficulty, numberOfQuestions }
 */
router.post('/generate', generateQuiz);

/**
 * @route   GET /api/quiz/:quizId
 * @desc    Get quiz questions
 * @access  Private
 */
router.get('/:quizId', getQuiz);

/**
 * @route   POST /api/quiz/submit
 * @desc    Submit quiz answers and get score
 * @access  Private
 * @body    { quizId, topic, difficulty, answers, timeTaken }
 */
router.post('/submit', submitQuiz);

/**
 * @route   GET /api/quiz/history/:userId
 * @desc    Get user quiz history
 * @access  Private
 */
router.get('/history/:userId', getQuizHistory);

/**
 * @route   GET /api/quiz/leaderboard
 * @desc    Get global leaderboard
 * @access  Private
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/quiz/stats/:userId
 * @desc    Get user quiz statistics
 * @access  Private
 */
router.get('/stats/:userId', getUserStats);

/**
 * @route   POST /api/quiz/manual/create
 * @desc    Create manual quiz (faculty only)
 * @access  Private (Admin/Faculty)
 * @body    { topic, difficulty, questions }
 */
router.post('/manual/create', createManualQuiz);

export default router;
