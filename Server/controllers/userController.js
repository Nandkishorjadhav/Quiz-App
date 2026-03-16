import * as userModel from '../models/userModel.js';

/**
 * Get current user profile
 * @route GET /api/users/profile
 * @middleware authenticate
 */
export async function getCurrentUser(req, res, next) {
  try {
    const user = await userModel.getUserWithProfile(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Format response
    const response = {
      id: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      profile: {
        bio: user.bio,
        phone: user.phone,
        country: user.country,
        state: user.state,
        city: user.city,
        institution: user.institution,
        totalQuizzesAttempted: user.totalQuizzesAttempted,
        totalQuizzesCompleted: user.totalQuizzesCompleted,
        averageScore: user.averageScore,
        highestScore: user.highestScore,
        totalTimeSpent: user.totalTimeSpent,
        lastLoginAt: user.lastLoginAt,
      },
    };

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @middleware authenticate
 * @body {bio, phone, country, state, city, institution}
 */
export async function updateProfile(req, res, next) {
  try {
    const { bio, phone, country, state, city, institution } = req.body;

    // Update profile in database
    await userModel.updateUserProfile(req.user.id, {
      bio,
      phone,
      country,
      state,
      city,
      institution,
    });

    // Fetch updated user
    const updatedUser = await userModel.getUserWithProfile(req.user.id);

    const response = {
      id: updatedUser.uuid,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      profile: {
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        institution: updatedUser.institution,
        totalQuizzesAttempted: updatedUser.totalQuizzesAttempted,
        totalQuizzesCompleted: updatedUser.totalQuizzesCompleted,
        averageScore: updatedUser.averageScore,
        highestScore: updatedUser.highestScore,
        totalTimeSpent: updatedUser.totalTimeSpent,
        lastLoginAt: updatedUser.lastLoginAt,
      },
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @middleware authenticate
 */
export async function getUserStats(req, res, next) {
  try {
    const user = await userModel.getUserWithProfile(req.user.id);

    const stats = {
      totalQuizzesAttempted: user.totalQuizzesAttempted,
      totalQuizzesCompleted: user.totalQuizzesCompleted,
      averageScore: user.averageScore.toFixed(2),
      highestScore: user.highestScore.toFixed(2),
      totalTimeSpent: user.totalTimeSpent,
      joinedOn: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @middleware authenticate, authorize
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await userModel.getAllUsers();

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user account
 * @route DELETE /api/users/account
 * @middleware authenticate
 */
export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account',
      });
    }

    // Verify password before deletion
    const user = await userModel.findUserById(req.user.id);
    const { comparePassword } = await import('../utils/passwordUtil.js');
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Delete user
    await userModel.deleteUser(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
