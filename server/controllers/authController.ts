import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { mockDb } from '../config/mockDb';
import mongoose from 'mongoose';
import User from '../models/User';
import { AppError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const UserModel = User as any;

/**
 * Register a new firm teammate and issue session tokens.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, fullName, phone, designation, role } = req.body;
    logger.info(`Processing registration for username: ${username}, email: ${email}`);

    // Register user details
    const savedUser = await AuthService.registerUser({
      username,
      email,
      password,
      fullName,
      phone,
      designation,
      role
    });

    // Sign session tokens
    const accessToken = AuthService.generateAccessToken(savedUser.id, savedUser.role);
    const refreshToken = AuthService.generateRefreshToken(savedUser.id, savedUser.role);

    // Register/Persist refresh token
    await AuthService.registerRefreshToken(savedUser.id, refreshToken);

    logger.info(`Session initiated. New user registered successfully: ${savedUser.fullName}`);

    res.status(201).json({
      status: 'success',
      token: accessToken,
      refreshToken: refreshToken,
      data: {
        user: savedUser
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login handler. Verifies credentials and generates session tokens.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername, password } = req.body;
    logger.info(`Processing login attempt for identifier/email: ${emailOrUsername}`);

    // Validate credentials
    const userDetails = await AuthService.authenticateUser(emailOrUsername, password);

    // Sign session tokens
    const accessToken = AuthService.generateAccessToken(userDetails.id, userDetails.role);
    const refreshToken = AuthService.generateRefreshToken(userDetails.id, userDetails.role);

    // Register active refresh token on document
    await AuthService.registerRefreshToken(userDetails.id, refreshToken);

    logger.info(`Authentication successful. Session generated for user: ${userDetails.fullName}`);

    res.status(200).json({
      status: 'success',
      token: accessToken,
      refreshToken: refreshToken,
      data: {
        user: userDetails
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Refresh expired access tokens using the active session refresh token.
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: tokenInput } = req.body;
    logger.info(`Processing refresh token rotation request.`);

    const rotationResult = await AuthService.verifyAndRefresh(tokenInput);

    logger.info(`Refresh token rotated. New access token issued for: ${rotationResult.user.fullName}`);

    res.status(200).json({
      status: 'success',
      token: rotationResult.accessToken,
      refreshToken: rotationResult.refreshToken,
      data: {
        user: rotationResult.user
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Terminate user session. Invalidates refresh token.
 */
export async function logout(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('No active user session block found.');
    }

    await AuthService.revokeRefreshToken(req.user.id);
    logger.info(`Logout complete. Decoupled session for User ID: ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Token revoked and session logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Forgot password handler. Generates a secure recovery token and logs link.
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    logger.info(`Initiating password reset request for: ${email}`);

    const resetResult = await AuthService.generatePasswordReset(email);

    logger.info(`Password recovery link generated. Simulated dispatch to email channel successfully.`);

    res.status(200).json({
      status: 'success',
      message: 'Simulated password reset email sent. You can retrieve the recovery token below.',
      data: {
        email: resetResult.email,
        resetToken: resetResult.resetToken,
        resetExplanation: 'In local development, the reset token is returned in this JSON payload. In production, this token is sent via email.'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password handler. Overwrites previous credentials with verified reset token.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    logger.info(`Processing password reset submission.`);

    const resetResult = await AuthService.completePasswordReset(token, password);

    logger.info(`Password saved. Re-secured credential coordinates for: ${resetResult.fullName}`);

    res.status(200).json({
      status: 'success',
      message: 'Password has been changed successfully. You can now log in with your updated credentials.',
      data: {
        email: resetResult.email
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile details.
 */
export async function getProfile(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User session expired.');
    }

    let user: any = null;

    if (mongoose.connection.readyState === 1) {
      user = await UserModel.findById(req.user.id);
    } else {
      user = mockDb.users.find(u => u._id === req.user.id);
    }

    if (!user) {
      throw new NotFoundError('Registered user records not found.');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          designation: user.designation,
          active: user.active,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all firm teammates.
 */
export async function getAllTeammates(req: any, res: Response, next: NextFunction) {
  try {
    let teammates: any[] = [];

    if (mongoose.connection.readyState === 1) {
      const dbUsers = await User.find();
      teammates = dbUsers.map(u => ({
        id: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        designation: u.designation,
        active: u.active
      }));
    } else {
      teammates = mockDb.users.map(u => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        designation: u.designation,
        active: u.active
      }));
    }

    res.status(200).json({
      status: 'success',
      data: { teammates }
    });
  } catch (err) {
    next(err);
  }
}
