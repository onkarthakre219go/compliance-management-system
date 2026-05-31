import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
const UserModel = User as any;
import { mockDb } from '../config/mockDb';
import { logger } from '../utils/logger';
import { NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-replace-in-production';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  role: string;
}

export class AuthService {
  /**
   * Helper to inspect if we are connected to Mongoose DB
   */
  private static isMongoActive(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Generates a standard JWT Access Token
   */
  public static generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generates a standard JWT Refresh Token
   */
  public static generateRefreshToken(userId: string, role: string): string {
    return jwt.sign({ id: userId, role }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Verifies standard Access Token
   */
  public static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired access token.');
    }
  }

  /**
   * Verifies standard Refresh Token
   */
  public static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }
  }

  /**
   * Registers a new user with password hashing and saves to both live MongoDB and MockDb (for symmetry).
   */
  public static async registerUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    designation?: string;
    role?: 'Admin' | 'Manager' | 'Employee' | 'Trainee';
  }) {
    const { username, email, password, fullName, phone, designation, role } = userData;
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // 1. Check if user already exists
    let userExists = false;

    if (this.isMongoActive()) {
      const existing = await UserModel.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }]
      });
      if (existing) userExists = true;
    } else {
      userExists = mockDb.users.some(
        u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
      );
    }

    if (userExists) {
      throw new ConflictError('A user with this email or username has already registered.');
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const generatedId = `usr_${Date.now()}`;
    const userRole = role || 'Employee';

    // 3. Save User
    let savedUser: any = null;

    if (this.isMongoActive()) {
      const newUser = new UserModel({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        fullName,
        phone,
        designation,
        role: userRole,
        active: true
      });
      const dbSaved = await newUser.save();
      savedUser = {
        id: dbSaved._id.toString(),
        username: dbSaved.username,
        email: dbSaved.email,
        fullName: dbSaved.fullName,
        role: dbSaved.role,
        designation: dbSaved.designation,
        active: dbSaved.active,
        createdAt: dbSaved.createdAt
      };
    }

    // Always synchronize/write to mockDb so existing services (protect, lists) work seamlessly
    const mockUser = {
      _id: savedUser ? savedUser.id : generatedId,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      fullName,
      phone,
      designation,
      role: userRole,
      active: true,
      createdAt: new Date()
    };
    mockDb.users.push(mockUser);

    if (!savedUser) {
      savedUser = {
        id: mockUser._id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        designation: mockUser.designation,
        active: mockUser.active,
        createdAt: mockUser.createdAt
      };
    }

    logger.info(`Successfully registered user via AuthService: ${savedUser.fullName}`);
    return savedUser;
  }

  /**
   * Verifies user credentials and returns user details
   */
  public static async authenticateUser(emailOrUsername: string, password: string) {
    const cleanCredential = emailOrUsername.toLowerCase().trim();
    let user: any = null;

    // Retrieve from MongoDB or MockDb
    if (this.isMongoActive()) {
      user = await UserModel.findOne({
        $or: [
          { email: cleanCredential },
          { username: { $regex: new RegExp(`^${cleanCredential}$`, 'i') } }
        ]
      });
    } else {
      user = mockDb.users.find(
        u => u.email.toLowerCase() === cleanCredential || u.username.toLowerCase() === cleanCredential
      );
    }

    if (!user) {
      throw new UnauthorizedError('Incorrect credentials or unregistered user.');
    }

    if (!user.active) {
      throw new UnauthorizedError('Your account is currently inactive. Contact your CA Administrator.');
    }

    // Verify password
    const isMatched = await bcrypt.compare(password, user.passwordHash);
    if (!isMatched) {
      throw new UnauthorizedError('Incorrect credentials or failed password coordinate.');
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      designation: user.designation,
      active: user.active
    };
  }

  /**
   * Saves the active refresh token on the user document
   */
  public static async registerRefreshToken(userId: string, token: string) {
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(userId, { refreshToken: token });
    }

    // Sync mockDb
    const mockUser = mockDb.users.find(u => u._id === userId);
    if (mockUser) {
      mockUser.refreshToken = token;
    }
  }

  /**
   * Revokes the active refresh token by clearing it
   */
  public static async revokeRefreshToken(userId: string) {
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }

    // Sync mockDb
    const mockUser = mockDb.users.find(u => u._id === userId);
    if (mockUser) {
      delete mockUser.refreshToken;
    }
    logger.info(`Revoked refresh token for session user: ${userId}`);
  }

  /**
   * Checks if refresh token matches and belongs to an active user, returns User payload
   */
  public static async verifyAndRefresh(token: string) {
    // 1. Validate JWT structure and signature
    const payload = this.verifyRefreshToken(token);

    // 2. Fetch User and check token matches
    let user: any = null;

    if (this.isMongoActive()) {
      user = await UserModel.findById(payload.id);
    } else {
      user = mockDb.users.find(u => u._id === payload.id);
    }

    if (!user) {
      throw new UnauthorizedError('User session bearer is no longer registered.');
    }

    if (!user.active) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    // check if refresh token matches
    if (user.refreshToken !== token) {
      throw new UnauthorizedError('Compromised refresh token. Please sign in again.');
    }

    // Generate new Access Token and optionally a new Refresh Token
    const newAccessToken = this.generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = this.generateRefreshToken(user._id.toString(), user.role);

    // Persist new refresh token
    await this.registerRefreshToken(user._id.toString(), newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        designation: user.designation
      }
    };
  }

  /**
   * Generates a hex code token for password resets and persists it
   */
  public static async generatePasswordReset(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    let user: any = null;

    if (this.isMongoActive()) {
      user = await UserModel.findOne({ email: cleanEmail });
    } else {
      user = mockDb.users.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      throw new NotFoundError('No registered teammate found with this email.');
    }

    // Generate token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });
    }

    const mockUser = mockDb.users.find(u => u._id === user._id.toString());
    if (mockUser) {
      mockUser.resetPasswordToken = resetToken;
      mockUser.resetPasswordExpires = resetExpires;
    }

    logger.info(`[PASSWORD RECOVERY]: Token generated for ${user.email} -> ${resetToken}`);
    return {
      resetToken,
      email: user.email,
      fullName: user.fullName
    };
  }

  /**
   * Validates the token and updates the password
   */
  public static async completePasswordReset(token: string, newPassword: string) {
    let user: any = null;

    if (this.isMongoActive()) {
      user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    } else {
      const now = new Date();
      user = mockDb.users.find(
        u => u.resetPasswordToken === token && u.resetPasswordExpires && u.resetPasswordExpires > now
      );
    }

    if (!user) {
      throw new UnauthorizedError('Password reset link is invalid or has expired.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Save and clear token parameters
    if (this.isMongoActive()) {
      await UserModel.findByIdAndUpdate(user._id, {
        passwordHash,
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
      });
    }

    const mockUser = mockDb.users.find(u => u._id === user._id.toString());
    if (mockUser) {
      mockUser.passwordHash = passwordHash;
      delete mockUser.resetPasswordToken;
      delete mockUser.resetPasswordExpires;
    }

    logger.info(`Success: Password successfully reset for teammate: ${user.fullName}`);
    return {
      email: user.email,
      fullName: user.fullName
    };
  }
}
