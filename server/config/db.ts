import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export let isDbConnected = false;

export async function connectDB(): Promise<boolean> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    logger.warn('MONGODB_URI environment variable is missing.');
    logger.info('Database layer running in: Dev Sandbox memory Mode (all changes persist temporarily in server memory).');
    isDbConnected = false;
    return false;
  }

  try {
    logger.info(`Attempting connection to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isDbConnected = true;
    logger.info('Connected to MongoDB successfully!');
    return true;
  } catch (err: any) {
    logger.error(`MongoDB connection error: ${err.message || err}`);
    logger.info('Falling back to: Dev Sandbox Memory DB Mode.');
    isDbConnected = false;
    return false;
  }
}
