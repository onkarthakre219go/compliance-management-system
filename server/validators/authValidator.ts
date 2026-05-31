import { ValidatorFunction } from '../middleware/validationMiddleware';

export const validateRegister: ValidatorFunction = (body: any) => {
  if (!body.username || typeof body.username !== 'string' || body.username.trim().length < 3) {
    return 'Username is required and must be at least 3 characters long.';
  }
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required.';
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    return 'Password is required and must be at least 6 characters long.';
  }
  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    return 'Full Name is required.';
  }
  return null;
};

export const validateLogin: ValidatorFunction = (body: any) => {
  if (!body.emailOrUsername || typeof body.emailOrUsername !== 'string' || body.emailOrUsername.trim().length === 0) {
    return 'Email or Username is required to authenticate.';
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    return 'Password parameter is missing.';
  }
  return null;
};

export const validateRefreshToken: ValidatorFunction = (body: any) => {
  if (!body.refreshToken || typeof body.refreshToken !== 'string' || body.refreshToken.trim().length === 0) {
    return 'Refresh token is required.';
  }
  return null;
};

export const validateForgotPassword: ValidatorFunction = (body: any) => {
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return 'A valid email address is required to initiate password recovery.';
  }
  return null;
};

export const validateResetPassword: ValidatorFunction = (body: any) => {
  if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
    return 'Security reset token is required.';
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    return 'A new password of at least 6 characters is required.';
  }
  return null;
};
