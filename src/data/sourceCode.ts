export interface SourceFile {
  name: string;
  path: string;
  category: 'Entry' | 'Config' | 'Model' | 'Controller' | 'Middleware' | 'Validator';
  code: string;
}

export const sourceFiles: SourceFile[] = [
  {
    name: 'server.ts',
    path: '/server.ts',
    category: 'Entry',
    code: `import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import { logger } from './server/utils/logger';
import { requestLogger } from './server/middleware/loggerMiddleware';
import { errorHandler } from './server/middleware/errorMiddleware';

import authRoutes from './server/routes/authRoutes';
import clientRoutes from './server/routes/clientRoutes';
import taskRoutes from './server/routes/taskRoutes';
import complianceRoutes from './server/routes/complianceRoutes';
import invoiceRoutes from './server/routes/invoiceRoutes';
import notificationRoutes from './server/routes/notificationRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  logger.info('Initializing Compliance Management System Backend...');
  await connectDB();

  app.use(express.json());
  app.use(requestLogger);

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/compliance', complianceRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Live log diagnostic endpoint
  app.get('/api/logs', (req, res) => {
    res.json({ status: 'success', data: { logs: logger.getLogs() } });
  });

  // Hot SPA Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(\`Server bound to http://0.0.0.0:\${PORT}\`);
  });
}

startServer();`
  },
  {
    name: 'db.ts',
    path: '/server/config/db.ts',
    category: 'Config',
    code: `import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export let isDbConnected = false;

export async function connectDB(): Promise<boolean> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    logger.warn('MONGODB_URI environment variable is missing.');
    logger.info('Database layer running in: Dev Sandbox Mode.');
    return false;
  }

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
    isDbConnected = true;
    logger.info('Connected to MongoDB successfully!');
    return true;
  } catch (err: any) {
    logger.error(\`MongoDB connection error: \${err.message}\`);
    logger.info('Falling back to Sandbox Memory DB Mode.');
    return false;
  }
}`
  },
  {
    name: 'User.ts',
    path: '/server/models/User.ts',
    category: 'Model',
    code: `import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'partner' | 'associate' | 'client';
  phone?: string;
  designation?: string;
  active: boolean;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'partner', 'associate', 'client'], default: 'associate', index: true },
  phone: { type: String },
  designation: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.index({ role: 1, active: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);`
  },
  {
    name: 'Client.ts',
    path: '/server/models/Client.ts',
    category: 'Model',
    code: `import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClient extends Document {
  name: string;
  tradeName?: string;
  constitution: 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited' | 'Public Limited' | 'Trust' | 'Individual';
  pan: string;
  gstType: 'Regular' | 'Composition' | 'Unregistered' | 'None';
  filingFrequency: 'Monthly' | 'Quarterly' | 'None';
  assignedTo?: Types.ObjectId;
  tags: string[];
  status: 'active' | 'inactive';
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  tradeName: { type: String },
  constitution: { type: String, required: true, enum: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Individual'] },
  pan: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    index: true,
    validate: {
      validator: (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v),
      message: 'Not a valid PAN structure'
    }
  },
  gstType: { type: String, enum: ['Regular', 'Composition', 'Unregistered', 'None'], default: 'None' },
  filingFrequency: { type: String, enum: ['Monthly', 'Quarterly', 'None'], default: 'None' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
}, { timestamps: true });

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);`
  },
  {
    name: 'Task.ts',
    path: '/server/models/Task.ts',
    category: 'Model',
    code: `import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  clientId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  templateId?: Types.ObjectId;
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: Date;
  attachments: string[];
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'ComplianceTemplate' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Under Review', 'Completed', 'On Hold'], default: 'Pending', index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium', index: true },
  dueDate: { type: Date, required: true, index: true },
  attachments: [{ type: String }]
}, { timestamps: true });

TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);`
  },
  {
    name: 'authController.ts',
    path: '/server/controllers/authController.ts',
    category: 'Controller',
    code: `import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockDb } from '../config/mockDb';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername, password } = req.body;
    logger.info(\`Login attempt for: \${emailOrUsername}\`);

    const user = mockDb.users.find(u => 
      u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
      u.username.toLowerCase() === emailOrUsername.toLowerCase()
    );

    if (!user || !user.active) {
      throw new UnauthorizedError('Incorrect registration profile or deactivated user.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Incorrect security credentials.');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    logger.info(\`User authenticated: \${user.fullName} (\${user.role})\`);

    res.status(200).json({
      status: 'success',
      token,
      data: { user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } }
    });
  } catch (err) {
    next(err);
  }
}`
  },
  {
    name: 'authMiddleware.ts',
    path: '/server/middleware/authMiddleware.ts',
    category: 'Middleware',
    code: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { mockDb } from '../config/mockDb';

export function protect(req: any, res: Response, next: NextFunction) {
  let token = '';
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new UnauthorizedError('Please authenticate with cryptographic keys.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key') as { id: string };
    const user = mockDb.users.find(u => u._id === decoded.id);

    if (!user || !user.active) {
      return next(new UnauthorizedError('The session key holder is no longer verified.'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError('Compromised login sessions. Log in again.'));
  }
}

export function restrictTo(...roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not carry designated clearances for operations.'));
    }
    next();
  };
}`
  },
  {
    name: 'errorMiddleware.ts',
    path: '/server/middleware/errorMiddleware.ts',
    category: 'Middleware',
    code: `import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (!(err instanceof AppError)) {
    logger.error(\`[CRITICAL ERROR]: \${err.message} | Stack: \${err.stack}\`);
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected system fault has occurred.';
    }
  } else {
    logger.warn(\`[OPERATIONAL EXCEPTION]: \${statusCode} | \${message}\`);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}`
  },
  {
    name: 'clientValidator.ts',
    path: '/server/validators/clientValidator.ts',
    category: 'Validator',
    code: `import { ValidatorFunction } from '../middleware/validationMiddleware';

export const validateClient: ValidatorFunction = (body: any) => {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return 'Client Name represents standard business identity and cannot be blank.';
  }
  
  if (!body.constitution || !['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Trust', 'Individual'].includes(body.constitution)) {
    return 'Constitution must be a valid legal entity structure.';
  }

  if (!body.pan || typeof body.pan !== 'string') {
    return 'Permanent Account Number (PAN) is mandatory.';
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(body.pan.toUpperCase())) {
    return 'Invalid PAN format! Must match Indian tax regulations (e.g., AAACA1234F).';
  }

  return null;
};`
  }
];
