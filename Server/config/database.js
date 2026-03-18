import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database configuration from environment
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'quiz_app.db');
const DB_ENABLE_FOREIGN_KEYS = process.env.DB_ENABLE_FOREIGN_KEYS === 'true';
const DB_LOG_QUERIES = process.env.DB_LOG_QUERIES === 'true';

let db = null;

export async function initializeDatabase() {
  try {
    // Log database initialization info
    console.log('🔧 Database Configuration:');
    console.log(`   Type: ${DB_TYPE}`);
    console.log(`   Path: ${DB_PATH}`);
    console.log(`   Foreign Keys: ${DB_ENABLE_FOREIGN_KEYS}`);

    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Enable foreign keys if configured
    if (DB_ENABLE_FOREIGN_KEYS) {
      await db.exec('PRAGMA foreign_keys = ON');
      console.log('✓ Foreign key constraints enabled');
    }

    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user profiles table for additional data
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE NOT NULL,
        bio TEXT,
        phone TEXT,
        country TEXT,
        state TEXT,
        city TEXT,
        institution TEXT,
        totalQuizzesAttempted INTEGER DEFAULT 0,
        totalQuizzesCompleted INTEGER DEFAULT 0,
        averageScore REAL DEFAULT 0,
        highestScore REAL DEFAULT 0,
        totalTimeSpent INTEGER DEFAULT 0,
        lastLoginAt DATETIME,
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create quiz results table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        score REAL NOT NULL,
        totalQuestions INTEGER NOT NULL,
        correctAnswers INTEGER NOT NULL,
        timeSpent INTEGER NOT NULL,
        attemptedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create sessions table for authentication
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Keep the demo admin account consistent even if it was created before role fixes.
    await db.run(`UPDATE users SET role = 'admin' WHERE LOWER(email) = LOWER(?)`, ['admin@demo.com']);

    console.log('✓ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('✗ Database initialization error:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}
