import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { mockDb } from '../config/mockDb';
import { logger } from '../utils/logger';
import { Role, isRoleAllowed, Permission, hasPermission } from '../utils/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: Role;
    fullName: string;
  };
}

export function protect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Please log in to gain access to compliance records.');
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      
      // Locate user in MockDb (or standard collection since we maintain symmetry)
      const user = mockDb.users.find(u => u._id === decoded.id);
      
      if (!user) {
        throw new UnauthorizedError('The user associated with this token is no longer registered.');
      }

      if (!user.active) {
        throw new UnauthorizedError('This account is currently deactivated. Connect with CA partners.');
      }

      // Attach user info to request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };

      next();
    } catch (err) {
      throw new UnauthorizedError('Invalid cryptographic token. Please log in again.');
    }
  } catch (err) {
    next(err);
  }
}

export function restrictTo(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authorization session missing.'));
    }

    if (!isRoleAllowed(req.user.role, roles)) {
      return next(new ForbiddenError('You do not possess security clearances for this operation.'));
    }

    next();
  };
}

export function requirePermissions(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authorization session missing.'));
    }

    const missing = permissions.filter((permission) => !hasPermission(req.user!.role, permission));
    if (missing.length > 0) {
      return next(new ForbiddenError('You do not possess the required permissions to complete this action.'));
    }

    next();
  };
}
