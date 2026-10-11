import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { DataStore } from '../db/mongo';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/email.service';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.').transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must be at most 128 characters long.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]|[^A-Za-z0-9]/, 'Password must contain at least one number or special symbol.'),
  name: z.string().min(2, 'Name must be at least 2 characters long.').max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is missing or invalid.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]|[^A-Za-z0-9]/, 'Password must contain at least one number or special symbol.'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Verification token is required.'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.').max(100).trim(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long.')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]|[^A-Za-z0-9]/, 'Password must contain at least one number or special symbol.'),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm account deletion.'),
});

export class AuthController {
  /**
   * User Registration
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await DataStore.findOne('users', { email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const { insertedId: userId } = await DataStore.insertOne('users', {
      email,
      name,
      passwordHash,
      isEmailVerified: false,
      createdAt: new Date(),
    });

    // Create session record
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { insertedId: sessionId } = await DataStore.insertOne('sessions', {
      userId,
      userAgent,
      ipAddress,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: userId, email, name, sessionId },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate email verification token asynchronously
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    await DataStore.insertOne('email_verifications', {
      userId,
      email,
      tokenHash: hashToken(rawVerifyToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false,
      createdAt: new Date(),
    });
    void EmailService.sendVerificationEmail(email, rawVerifyToken);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          name,
          isEmailVerified: false,
        },
      },
      message: 'Account registered successfully.',
    });
  }

  /**
   * User Login
   */
  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = loginSchema.parse(req.body);

    const user = await DataStore.findOne('users', { email });
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
      return;
    }

    // Register active session
    const userId = user._id || user.id;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { insertedId: sessionId } = await DataStore.insertOne('sessions', {
      userId,
      userAgent,
      ipAddress,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: userId, email: user.email, name: user.name, sessionId },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email: user.email,
          name: user.name,
          isEmailVerified: Boolean(user.isEmailVerified),
        },
      },
      message: 'Signed in successfully.',
    });
  }

  /**
   * Sign out (Revoke current session)
   */
  public static async logout(req: AuthRequest, res: Response): Promise<void> {
    if (req.user?.sessionId) {
      await DataStore.updateOne(
        'sessions',
        { _id: req.user.sessionId },
        { $set: { isActive: false, revokedAt: new Date() } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  }

  /**
   * Get Current Authenticated Profile
   */
  public static async me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
      });
      return;
    }

    const user = await DataStore.findOne('users', { _id: req.user.id });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: Boolean(user.isEmailVerified),
          createdAt: user.createdAt,
        },
      },
    });
  }

  /**
   * Request Password Reset
   */
  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await DataStore.findOne('users', { email });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);

      await DataStore.insertOne('password_resets', {
        userId: user._id || user.id,
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
        used: false,
        createdAt: new Date(),
      });

      await EmailService.sendPasswordResetEmail(email, rawToken);
    }

    // Always respond with identical message to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    });
  }

  /**
   * Reset Password with Token
   */
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(token);

    const resetRecord = await DataStore.findOne('password_resets', {
      tokenHash,
      used: false,
    });

    if (!resetRecord || new Date(resetRecord.expiresAt) < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'The password reset link is invalid or has expired.',
        },
      });
      return;
    }

    // Invalidate reset token
    await DataStore.updateOne(
      'password_resets',
      { _id: resetRecord._id || resetRecord.id },
      { $set: { used: true, usedAt: new Date() } }
    );

    // Hash new password and update user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await DataStore.updateOne(
      'users',
      { _id: resetRecord.userId },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    // Invalidate all existing active sessions for security
    const sessions = await DataStore.find('sessions', { userId: resetRecord.userId, isActive: true });
    for (const session of sessions) {
      await DataStore.updateOne('sessions', { _id: session._id || session.id }, { $set: { isActive: false } });
    }

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. Please sign in with your new password.',
    });
  }

  /**
   * Verify Email Address
   */
  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = verifyEmailSchema.parse(req.body);
    const tokenHash = hashToken(token);

    const record = await DataStore.findOne('email_verifications', {
      tokenHash,
      used: false,
    });

    if (!record || new Date(record.expiresAt) < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Verification token is invalid or has expired.',
        },
      });
      return;
    }

    await DataStore.updateOne(
      'email_verifications',
      { _id: record._id || record.id },
      { $set: { used: true, verifiedAt: new Date() } }
    );

    await DataStore.updateOne(
      'users',
      { _id: record.userId },
      { $set: { isEmailVerified: true, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'Your email address has been successfully verified.',
    });
  }

  /**
   * Resend Verification Email
   */
  public static async resendVerification(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const user = await DataStore.findOne('users', { _id: req.user.id });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: 'Email address is already verified.' },
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await DataStore.insertOne('email_verifications', {
      userId: user._id || user.id,
      email: user.email,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
      createdAt: new Date(),
    });

    await EmailService.sendVerificationEmail(user.email, rawToken);

    res.status(200).json({
      success: true,
      message: 'A verification link has been sent to your email address.',
    });
  }

  /**
   * Update User Profile Name
   */
  public static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { name } = updateProfileSchema.parse(req.body);

    await DataStore.updateOne(
      'users',
      { _id: req.user.id },
      { $set: { name, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name,
          isEmailVerified: req.user.isEmailVerified,
        },
      },
      message: 'Profile updated successfully.',
    });
  }

  /**
   * Change Password
   */
  public static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await DataStore.findOne('users', { _id: req.user.id });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: { code: 'INCORRECT_PASSWORD', message: 'Current password does not match.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await DataStore.updateOne(
      'users',
      { _id: req.user.id },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    // Invalidate all sessions except current one
    const sessions = await DataStore.find('sessions', { userId: req.user.id, isActive: true });
    for (const session of sessions) {
      if ((session._id || session.id) !== req.user.sessionId) {
        await DataStore.updateOne('sessions', { _id: session._id || session.id }, { $set: { isActive: false } });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  }

  /**
   * List Active Sessions
   */
  public static async listSessions(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const sessions = await DataStore.find('sessions', { userId: req.user.id, isActive: true });

    res.status(200).json({
      success: true,
      data: sessions.map((s) => ({
        id: s._id || s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        isCurrentSession: (s._id || s.id) === req.user?.sessionId,
      })),
    });
  }

  /**
   * Revoke Specific Session
   */
  public static async revokeSession(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { id } = req.params;
    const session = await DataStore.findOne('sessions', { _id: id, userId: req.user.id });

    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found.' } });
      return;
    }

    await DataStore.updateOne('sessions', { _id: id }, { $set: { isActive: false, revokedAt: new Date() } });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully.',
    });
  }

  /**
   * Delete Account & Cascade Projects
   */
  public static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { password } = deleteAccountSchema.parse(req.body);

    const user = await DataStore.findOne('users', { _id: req.user.id });
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: { code: 'INCORRECT_PASSWORD', message: 'Incorrect password.' },
      });
      return;
    }

    // Cascade delete: projects, schema_versions, sessions, and user record
    const userProjects = await DataStore.find('projects', { userId: req.user.id });
    for (const project of userProjects) {
      const projId = project._id || project.id;
      const versions = await DataStore.find('schema_versions', { projectId: projId });
      for (const ver of versions) {
        await DataStore.deleteOne('schema_versions', { _id: ver._id || ver.id });
      }
      await DataStore.deleteOne('projects', { _id: projId });
    }

    const sessions = await DataStore.find('sessions', { userId: req.user.id });
    for (const session of sessions) {
      await DataStore.deleteOne('sessions', { _id: session._id || session.id });
    }

    await DataStore.deleteOne('users', { _id: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Account and associated project records permanently deleted.',
    });
  }
}
