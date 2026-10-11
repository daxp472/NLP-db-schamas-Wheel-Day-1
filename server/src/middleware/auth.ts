import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { DataStore } from '../db/mongo';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  sessionId?: string;
  isEmailVerified?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to access this resource.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      sessionId?: string;
    };

    // Check if session was explicitly revoked on the backend
    if (decoded.sessionId) {
      const session = await DataStore.findOne('sessions', {
        _id: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_REVOKED',
            message: 'Your session has been signed out or revoked. Please sign in again.',
          },
        });
        return;
      }
    }

    // Verify user account exists and is active
    const user = await DataStore.findOne('users', { _id: decoded.id });
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this session no longer exists.',
        },
      });
      return;
    }

    req.user = {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      sessionId: decoded.sessionId,
      isEmailVerified: Boolean(user.isEmailVerified),
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: err.name === 'TokenExpiredError' 
          ? 'Session token expired. Please sign in again.' 
          : 'Invalid authentication token.',
      },
    });
  }
}
