import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, config.BCRYPT_ROUNDS);
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
export async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Error comparing password: ' + error.message);
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with success and message
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!password.match(/[a-z]/)) {
    errors.push('Password must contain lowercase letters');
  }
  if (!password.match(/[A-Z]/)) {
    errors.push('Password must contain uppercase letters');
  }
  if (!password.match(/[0-9]/)) {
    errors.push('Password must contain numbers');
  }
  if (!password.match(/[!@#$%^&*]/)) {
    errors.push('Password must contain special characters (!@#$%^&*)');
  }

  return {
    success: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Password is strong' : errors.join('. '),
  };
}
