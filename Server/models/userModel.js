import { getDatabase } from '../config/database.js';
import { randomUUID } from 'crypto';

const db = () => getDatabase();

/**
 * Create a new user
 * @param {object} userData - User data to create
 * @returns {Promise<object>} Created user object
 */
export async function createUser(userData) {
  const { name, email, password } = userData;
  const uuid = randomUUID();

  try {
    const result = await db().run(
      `INSERT INTO users (uuid, name, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuid, name, email, password, 'student']
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
      role: 'student',
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
