import { Request, Response, NextFunction } from 'express';
import { mockDb } from '../config/mockDb';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.query;
    
    let filtered = [...mockDb.notifications];
    if (userId) {
      filtered = filtered.filter(n => n.userId === userId);
    }

    // Sort with unread first, then chronologically backwards
    filtered.sort((a, b) => {
      if (a.read === b.read) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return a.read ? 1 : -1;
    });

    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { notifications: filtered }
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const notification = mockDb.notifications.find(n => n._id === id);
    if (!notification) {
      throw new NotFoundError('Notification record could not be resolved.');
    }

    notification.read = true;
    logger.info(`Notification marked read: ${notification.title}`);

    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;

    let affected = 0;
    mockDb.notifications.forEach(n => {
      if (!n.read && (!userId || n.userId === userId)) {
        n.read = true;
        affected++;
      }
    });

    logger.info(`Cleared ${affected} unread notifications.`);

    res.status(200).json({
      status: 'success',
      message: `Successfully cleared ${affected} active notification markers.`
    });
  } catch (err) {
    next(err);
  }
}
