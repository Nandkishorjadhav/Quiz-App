import {
  saveAIQuizQuestions,
  getQuizQuestions,
  saveQuizAttempt,
  calculateQuizScore,
  getUserQuizHistory,
  getGlobalLeaderboard,
  saveManualQuizQuestions,
  getUserQuizStatistics,
} from '../models/quizModel.js';
import { generateQuestionsWithAI, areQuestionsUnique } from '../services/geminiService.js';

/**
 * Generate quiz using AI
 * POST /api/quiz/generate
 */
export async function generateQuiz(req, res) {
  try {
    const { topic, difficulty, numberOfQuestions } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required',
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level. Use: easy, medium, hard',
      });
    }

    if (!Number.isInteger(numberOfQuestions) || numberOfQuestions < 1 || numberOfQuestions > 50) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 50',
      });
    }

    console.log(`📚 Generating quiz: ${topic} (${difficulty}), ${numberOfQuestions} questions, User: ${userId}`);

    // Generate questions using AI
    const questions = await generateQuestionsWithAI(topic, difficulty, numberOfQuestions);

    // Verify uniqueness
    if (!areQuestionsUnique(questions)) {
      console.warn('⚠️  Generated questions may have duplicates');
    }

    // Save questions to database
    const quizId = await saveAIQuizQuestions(topic, difficulty, questions);

    // Prepare response (without correct answers)
    const quizResponse = questions.map((q) => ({
      question: q.question,
      options: q.options,
    }));

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      data: {
        quizId,
        topic,
        difficulty,
        totalQuestions: questions.length,
        questions: quizResponse,
      },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz',
      error: error.message,
    });
  }
}

/**
 * Get quiz questions (for review/retake)
 * GET /api/quiz/:quizId
 */
export async function getQuiz(req, res) {
  try {
    const { quizId } = req.params;

    const questions = await getQuizQuestions(quizId);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        quizId,
        totalQuestions: questions.length,
        questions,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message,
    });
  }
}

/**
 * Submit quiz answers
 * POST /api/quiz/submit
 */
export async function submitQuiz(req, res) {
  try {
    const { quizId, topic, difficulty, answers, timeTaken } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate input
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array',
      });
    }

    if (!Number.isInteger(timeTaken) || timeTaken < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid time taken is required',
      });
    }

    console.log(`📝 Submitting quiz: ${quizId}, User: ${userId}, Answers: ${answers.length}, Time: ${timeTaken}s`);

    // Calculate score
    const scoreData = await calculateQuizScore(quizId, answers);

    // Save attempt to database
    const attempt = await saveQuizAttempt(
      userId,
      quizId,
      topic,
      difficulty,
      scoreData.totalQuestions,
      scoreData.correctAnswers,
      scoreData.score,
      scoreData.percentage,
      timeTaken,
      answers
    );

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attemptId: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers,
        timeTaken: attempt.timeTaken,
        createdAt: attempt.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message,
    });
  }
}

/**
 * Get user quiz history
 * GET /api/quiz/history/:userId
 */
export async function getQuizHistory(req, res) {
  try {
    const { userId } = req.params;
    const { topic, difficulty, limit } = req.query;

    const filters = {
      topic,
      difficulty,
      limit: parseInt(limit) || 20,
    };

    const history = await getUserQuizHistory(parseInt(userId), filters);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history',
      error: error.message,
    });
  }
}

/**
 * Get global leaderboard
 * GET /api/quiz/leaderboard
 */
export async function getLeaderboard(req, res) {
  try {
    const { limit, topic, difficulty } = req.query;

    const filters = {
      limit: parseInt(limit) || 100,
      topic,
      difficulty,
    };

    const leaderboard = await getGlobalLeaderboard(filters);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
}

/**
 * Get user statistics
 * GET /api/quiz/stats/:userId
 */
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;

    const stats = await getUserQuizStatistics(parseInt(userId));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
}

/**
 * Create manual quiz (faculty only)
 * POST /api/quiz/manual/create
 */
export async function createManualQuiz(req, res) {
  try {
    const { topic, difficulty, questions } = req.body;
    const creatorId = req.user?.id;
    const role = req.user?.role;

    // Only admins/faculty can create manual quizzes
    if (role !== 'admin' && role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty/admins can create quizzes',
      });
    }

    // Validate input
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required',
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level',
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required',
      });
    }

    // Validate question structure
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
        return res.status(400).json({
          success: false,
          message: 'Each question must have question text, 4 options, and correct answer',
        });
      }
    }

    console.log(`📚 Creating manual quiz: ${topic} by user ${creatorId}`);

    const quizId = await saveManualQuizQuestions(creatorId, topic, difficulty, questions);

    res.status(201).json({
      success: true,
      message: 'Manual quiz created successfully',
      data: {
        quizId,
        topic,
        difficulty,
        totalQuestions: questions.length,
      },
    });
  } catch (error) {
    console.error('Error creating manual quiz:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message,
    });
  }
}

export default {
  generateQuiz,
  getQuiz,
  submitQuiz,
  getQuizHistory,
  getLeaderboard,
  getUserStats,
  createManualQuiz,
};
