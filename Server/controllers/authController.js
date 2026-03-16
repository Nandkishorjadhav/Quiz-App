import * as userModel from '../models/userModel.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/passwordUtil.js';
import { generateToken } from '../utils/jwtUtil.js';

/**
 * Login user with email and password
 * @route POST /api/auth/login
 * @body {email, password}
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await userModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login time
    await userModel.updateLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register/Signup new user
 * @route POST /api/auth/signup
 * @body {name, email, password, confirmPassword, role}
 */
export async function signup(req, res, next) {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Password is not strong enough',
        errors: passwordValidation.errors,
      });
    }

    // Check if email already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      uuid: newUser.uuid,
      email: newUser.email,
      role: newUser.role,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: newUser.uuid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify token
 * @route POST /api/auth/verify
 */
export async function verifyAuth(req, res) {
  try {
    const user = await userModel.findUserById(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        id: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token verification failed',
    });
  }
}

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    // In a stateless JWT approach, logout is handled on the client side
    // by removing the token from localStorage
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
}
