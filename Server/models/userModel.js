import { getDatabase } from '../config/database.js';
import { randomUUID } from 'crypto';

const db = () => getDatabase();

/**
 * Create a new user
 * @param {object} userData - User data to create
 * @returns {Promise<object>} Created user object
 */
export async function createUser(userData) {
  const { name, email, password, role } = userData;
  const uuid = randomUUID();
  const safeRole = role === 'admin' ? 'admin' : 'student';

  try {
    const result = await db().run(
      `INSERT INTO users (uuid, name, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuid, name, email, password, safeRole]
    );

    // Create user profile
    await db().run(
      `INSERT INTO user_profiles (userId) VALUES (?)`,
      [result.lastID]
    );

    return {
      id: result.lastID,
      uuid,
      name,
      email,
      role: safeRole,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already registered');
    }
    throw error;
  }
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object or null
 */
export async function findUserByEmail(email) {
  return await db().get(`SELECT * FROM users WHERE email = ?`, [email]);
}

/**
 * Find user by UUID
 * @param {string} uuid - User UUID
 * @returns {Promise<object|null>} User object or null
 */
export async function findUserByUUID(uuid) {
  return await db().get(`SELECT * FROM users WHERE uuid = ?`, [uuid]);
}

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<object|null>} User object or null
 */
export async function findUserById(id) {
  return await db().get(`SELECT * FROM users WHERE id = ?`, [id]);
}

/**
 * Get user with full profile
 * @param {number} userId - User ID
 * @returns {Promise<object>} User with profile
 */
export async function getUserWithProfile(userId) {
  const user = await db().get(
    `SELECT u.*, p.* FROM users u 
     LEFT JOIN user_profiles p ON u.id = p.userId 
     WHERE u.id = ?`,
    [userId]
  );
  return user;
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserProfile(userId, profileData) {
  const { bio, phone, country, state, city, institution } = profileData;

  await db().run(
    `UPDATE user_profiles 
     SET bio = ?, phone = ?, country = ?, state = ?, city = ?, institution = ?
     WHERE userId = ?`,
    [bio || null, phone || null, country || null, state || null, city || null, institution || null, userId]
  );

  return true;
}

/**
 * Update last login time
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function updateLastLogin(userId) {
  await db().run(
    `UPDATE user_profiles SET lastLoginAt = CURRENT_TIMESTAMP WHERE userId = ?`,
    [userId]
  );
  return true;
}

/**
 * Get all users (admin only)
 * @returns {Promise<array>} Array of users
 */
export async function getAllUsers() {
  return await db().all(`SELECT id, uuid, name, email, role, createdAt FROM users`);
}

/**
 * Delete user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUser(userId) {
  await db().run(`DELETE FROM users WHERE id = ?`, [userId]);
  return true;
}

/**
 * Get user's quiz results (only this user's)
 * @param {number} userId - User ID
 * @returns {Promise<array>} Array of quiz results
 */
export async function getUserQuizResults(userId) {
  return await db().all(
    `SELECT * FROM quiz_results WHERE userId = ? ORDER BY attemptedAt DESC`,
    [userId]
  );
}

/**
 * Save quiz result (only for specific user)
 * @param {object} resultData - Quiz result data with userId
 * @returns {Promise<object>} Saved result
 */
export async function saveQuizResult(resultData) {
  const { userId, category, difficulty, score, totalQuestions, correctAnswers, timeSpent } = resultData;

  const result = await db().run(
    `INSERT INTO quiz_results (userId, category, difficulty, score, totalQuestions, correctAnswers, timeSpent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, category, difficulty, score, totalQuestions, correctAnswers, timeSpent]
  );

  return {
    id: result.lastID,
    userId,
    category,
    difficulty,
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    attemptedAt: new Date().toISOString(),
  };
}

/**
 * Get user's quiz statistics (only this user)
 * @param {number} userId - User ID
 * @returns {Promise<object>} Quiz statistics
 */
export async function getUserQuizStats(userId) {
  const results = await db().all(
    `SELECT * FROM quiz_results WHERE userId = ?`,
    [userId]
  );

  if (results.length === 0) {
    return {
      totalAttempts: 0,
      totalCompleted: 0,
      averageScore: 0,
      highestScore: 0,
      totalTimeSpent: 0,
      categoryStats: {},
    };
  }

  const totalAttempts = results.length;
  const totalTimeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0);
  const scores = results.map(r => r.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);

  // Group by category
  const categoryStats = {};
  results.forEach(result => {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = {
        attempts: 0,
        avgScore: 0,
        highScore: 0,
      };
    }
    categoryStats[result.category].attempts += 1;
    categoryStats[result.category].avgScore = 
      (categoryStats[result.category].avgScore * (categoryStats[result.category].attempts - 1) + result.score) / 
      categoryStats[result.category].attempts;
    categoryStats[result.category].highScore = Math.max(categoryStats[result.category].highScore, result.score);
  });

  return {
    totalAttempts,
    totalCompleted: totalAttempts,
    averageScore: parseFloat(averageScore.toFixed(2)),
    highestScore,
    totalTimeSpent,
    categoryStats,
  };
}

/**
 * Get global leaderboard - only users with quiz attempts
 * @param {object} options - Filter options {category, difficulty, limit}
 * @returns {Promise<array>} Ranked leaderboard entries
 */
export async function getLeaderboard(options = {}) {
  const { category = null, difficulty = null, limit = 50 } = options;

  let query = `
    SELECT 
      u.id as userId,
      u.uuid,
      u.name as userName,
      qr.category,
      qr.difficulty,
      COUNT(*) as attempts,
      AVG(qr.score) as averageScore,
      MAX(qr.score) as highestScore,
      SUM(qr.timeSpent) as totalTimeSpent,
      MAX(qr.attemptedAt) as lastAttemptedAt
    FROM users u
    INNER JOIN quiz_results qr ON u.id = qr.userId
    WHERE 1=1
  `;

  const params = [];

  // Add category filter if provided
  if (category) {
    query += ` AND qr.category = ?`;
    params.push(category);
  }

  // Add difficulty filter if provided
  if (difficulty) {
    query += ` AND qr.difficulty = ?`;
    params.push(difficulty);
  }

  query += `
    GROUP BY u.id, u.uuid, u.name, qr.category, qr.difficulty
    ORDER BY averageScore DESC, attempts DESC
    LIMIT ?
  `;
  params.push(limit);

  const results = await db().all(query, params);

  // Format results with rank
  const leaderboard = results.map((entry, index) => ({
    id: entry.userId,
    userId: entry.userId,
    uuid: entry.uuid,
    userName: entry.userName,
    rank: index + 1,
    category: entry.category,
    difficulty: entry.difficulty,
    score: Math.round(entry.averageScore),
    percentage: Math.round((entry.averageScore / 100) * 100),
    attempts: entry.attempts,
    highestScore: entry.highestScore,
    totalTimeSpent: entry.totalTimeSpent,
    lastAttemptedAt: entry.lastAttemptedAt,
  }));

  return leaderboard;
}
