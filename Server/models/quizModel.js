import { getDatabase } from '../config/database.js';
import { randomUUID } from 'crypto';

const db = () => getDatabase();

/**
 * Save AI-generated quiz questions
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Difficulty level
 * @param {Array} questions - Generated questions
 * @returns {Promise<string>} Quiz ID
 */
export async function saveAIQuizQuestions(topic, difficulty, questions) {
  const quizId = randomUUID();

  try {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db().run(
        `INSERT INTO ai_quiz_questions 
        (quizId, topic, difficulty, question, option1, option2, option3, option4, correctAnswer, questionOrder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          topic,
          difficulty,
          q.question,
          q.options[0],
          q.options[1],
          q.options[2],
          q.options[3],
          q.correctAnswer,
          i + 1,
        ]
      );
    }

    console.log(`✓ Saved quiz ${quizId} with ${questions.length} questions`);
    return quizId;
  } catch (error) {
    console.error('Error saving quiz questions:', error);
    throw error;
  }
}

/**
 * Get quiz questions by quiz ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Array>} Quiz questions
 */
export async function getQuizQuestions(quizId) {
  try {
    const questions = await db().all(
      `SELECT id, question, option1, option2, option3, option4, questionOrder
       FROM ai_quiz_questions
       WHERE quizId = ?
       ORDER BY questionOrder ASC`,
      [quizId]
    );

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      questionOrder: q.questionOrder,
    }));
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
}

/**
 * Save user quiz attempt
 * @param {number} userId - User ID
 * @param {string} quizId - Quiz ID
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Difficulty level
 * @param {number} totalQuestions - Total questions in quiz
 * @param {number} correctAnswers - Number of correct answers
 * @param {number} score - Total score
 * @param {number} percentage - Percentage score
 * @param {number} timeTaken - Time taken in seconds
 * @param {Array} answers - User's answers
 * @returns {Promise<object>} Attempt record
 */
export async function saveQuizAttempt(
  userId,
  quizId,
  topic,
  difficulty,
  totalQuestions,
  correctAnswers,
  score,
  percentage,
  timeTaken,
  answers
) {
  try {
    const result = await db().run(
      `INSERT INTO quiz_attempts
      (userId, quizId, topic, difficulty, totalQuestions, correctAnswers, score, percentage, timeTaken, answers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        quizId,
        topic,
        difficulty,
        totalQuestions,
        correctAnswers,
        score,
        percentage,
        timeTaken,
        JSON.stringify(answers),
        'completed',
      ]
    );

    // Update leaderboard cache
    await updateLeaderboardCache(userId);

    return {
      id: result.lastID,
      userId,
      quizId,
      topic,
      difficulty,
      totalQuestions,
      correctAnswers,
      score,
      percentage,
      timeTaken,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
}

/**
 * Get user's quiz history
 * @param {number} userId - User ID
 * @param {object} filters - Optional filters (topic, difficulty, limit, offset)
 * @returns {Promise<Array>} User's quiz attempts
 */
export async function getUserQuizHistory(userId, filters = {}) {
  try {
    let query = 'SELECT * FROM quiz_attempts WHERE userId = ?';
    const params = [userId];

    if (filters.topic) {
      query += ' AND topic = ?';
      params.push(filters.topic);
    }

    if (filters.difficulty) {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }

    query += ' ORDER BY createdAt DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const attempts = await db().all(query, params);

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      topic: a.topic,
      difficulty: a.difficulty,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      score: a.score,
      percentage: a.percentage,
      timeTaken: a.timeTaken,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    throw error;
  }
}

/**
 * Calculate quiz score
 * @param {string} quizId - Quiz ID
 * @param {Array} userAnswers - User's answers [{questionId, selectedAnswer}]
 * @returns {Promise<object>} Score calculation result
 */
export async function calculateQuizScore(quizId, userAnswers) {
  try {
    const questions = await db().all(
      `SELECT id, correctAnswer FROM ai_quiz_questions WHERE quizId = ?`,
      [quizId]
    );

    let correctCount = 0;
    const detailedResults = [];

    for (const answer of userAnswers) {
      const question = questions.find((q) => q.id === answer.questionId);

      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        detailedResults.push({
          questionId: answer.questionId,
          userAnswer: answer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
        });
      }
    }

    const totalQuestions = questions.length;
    const score = correctCount;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      correctAnswers: correctCount,
      score,
      percentage: Math.round(percentage * 100) / 100,
      detailedResults,
    };
  } catch (error) {
    console.error('Error calculating score:', error);
    throw error;
  }
}

/**
 * Update leaderboard cache for a user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLeaderboardCache(userId) {
  try {
    const user = await db().get(`SELECT name FROM users WHERE id = ?`, [userId]);

    if (!user) return;

    const stats = await db().get(
      `SELECT 
        COUNT(*) as totalAttempts,
        MAX(percentage) as bestPercentage,
        AVG(percentage) as averageScore,
        SUM(timeTaken) as totalTimeSpent,
        MAX(createdAt) as lastAttemptAt
       FROM quiz_attempts
       WHERE userId = ?`,
      [userId]
    );

    const bestScore = stats?.bestPercentage || 0;

    await db().run(
      `INSERT INTO leaderboard_cache (userId, userName, totalAttempts, bestScore, averageScore, bestPercentage, totalTimeSpent, lastAttemptAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET
       totalAttempts = excluded.totalAttempts,
       bestScore = excluded.bestScore,
       averageScore = excluded.averageScore,
       bestPercentage = excluded.bestPercentage,
       totalTimeSpent = excluded.totalTimeSpent,
       lastAttemptAt = excluded.lastAttemptAt,
       updatedAt = CURRENT_TIMESTAMP`,
      [
        userId,
        user.name,
        stats?.totalAttempts || 0,
        bestScore,
        stats?.averageScore || 0,
        bestScore,
        stats?.totalTimeSpent || 0,
        stats?.lastAttemptAt || null,
      ]
    );
  } catch (error) {
    console.error('Error updating leaderboard cache:', error);
  }
}

/**
 * Get global leaderboard
 * @param {object} filters - Optional filters (topic, difficulty, limit)
 * @returns {Promise<Array>} Leaderboard entries
 */
export async function getGlobalLeaderboard(filters = {}) {
  try {
    let query = `SELECT 
      userId, 
      userName, 
      totalAttempts, 
      bestScore, 
      averageScore, 
      bestPercentage, 
      totalTimeSpent,
      lastAttemptAt
     FROM leaderboard_cache
     ORDER BY bestPercentage DESC, totalTimeSpent ASC
     LIMIT ?`;

    const limit = filters.limit || 100;
    const leaderboard = await db().all(query, [limit]);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      userName: entry.userName,
      bestScore: entry.bestScore,
      averageScore: Math.round(entry.averageScore * 100) / 100,
      totalAttempts: entry.totalAttempts,
      totalTimeSpent: entry.totalTimeSpent,
      lastAttemptAt: entry.lastAttemptAt,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

/**
 * Save manual quiz questions (created by faculty)
 * @param {number} creatorId - Faculty/Admin ID
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Difficulty level
 * @param {Array} questions - Manual questions
 * @returns {Promise<string>} Quiz ID
 */
export async function saveManualQuizQuestions(creatorId, topic, difficulty, questions) {
  const quizId = randomUUID();

  try {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db().run(
        `INSERT INTO manual_quiz_questions
        (quizId, creatorId, topic, difficulty, question, option1, option2, option3, option4, correctAnswer, questionOrder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          creatorId,
          topic,
          difficulty,
          q.question,
          q.options[0],
          q.options[1],
          q.options[2],
          q.options[3],
          q.correctAnswer,
          i + 1,
        ]
      );
    }

    return quizId;
  } catch (error) {
    console.error('Error saving manual quiz:', error);
    throw error;
  }
}

/**
 * Get user quiz statistics
 * @param {number} userId - User ID
 * @returns {Promise<object>} User statistics
 */
export async function getUserQuizStatistics(userId) {
  try {
    const stats = await db().get(
      `SELECT 
        COUNT(*) as totalAttempts,
        COUNT(DISTINCT topic) as uniqueTopics,
        COUNT(DISTINCT difficulty) as uniqueDifficulties,
        MAX(percentage) as highestScore,
        AVG(percentage) as averageScore,
        SUM(timeTaken) as totalTimeSpent,
        SUM(correctAnswers) as totalCorrectAnswers,
        SUM(totalQuestions) as totalQuestionsAttempted
       FROM quiz_attempts
       WHERE userId = ?`,
      [userId]
    );

    return {
      totalAttempts: stats?.totalAttempts || 0,
      uniqueTopics: stats?.uniqueTopics || 0,
      highestScore: Math.round((stats?.highestScore || 0) * 100) / 100,
      averageScore: Math.round((stats?.averageScore || 0) * 100) / 100,
      totalTimeSpent: stats?.totalTimeSpent || 0,
      totalCorrectAnswers: stats?.totalCorrectAnswers || 0,
      totalQuestionsAttempted: stats?.totalQuestionsAttempted || 0,
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
}

export default {
  saveAIQuizQuestions,
  getQuizQuestions,
  saveQuizAttempt,
  getUserQuizHistory,
  calculateQuizScore,
  updateLeaderboardCache,
  getGlobalLeaderboard,
  saveManualQuizQuestions,
  getUserQuizStatistics,
};
