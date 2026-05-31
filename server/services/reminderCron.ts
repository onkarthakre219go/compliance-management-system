import cron from 'node-cron';
import { logger } from '../utils/logger';
import { isDbConnected } from '../config/db';
import { mockDb } from '../config/mockDb';
import TaskModel from '../models/Task';
import { createReminderNotificationForTask } from './notificationService';

function daysDiff(from: Date, to: Date) {
  const diffMs = from.setHours(0,0,0,0) - to.setHours(0,0,0,0);
  return Math.round(diffMs / (24 * 3600 * 1000));
}

async function scanAndCreateReminders() {
  try {
    logger.info('Reminder cron: scanning for due tasks...');
    const now = new Date();

    let tasks: any[] = [];
    if (isDbConnected) {
      tasks = await TaskModel.find({ dueDate: { $exists: true }, status: { $ne: 'Completed' } }).lean();
    } else {
      tasks = mockDb.tasks;
    }

    for (const t of tasks) {
      if (!t.dueDate) continue;
      const due = new Date(t.dueDate);
      const days = daysDiff(due, now);

      // daysDiff returns positive if due > now (future days)
      // we want reminders when tasks are due in 7,3,1 days
      const targets = [7, 3, 1];
      if (targets.includes(days)) {
        // Create a reminder notification (deduped inside service)
        await createReminderNotificationForTask(t, days);
      }
    }
  } catch (err: any) {
    logger.error('Error during reminder cron scan: ' + (err.message || err));
  }
}

export function startReminderCron() {
  // Run daily at 08:00 server time
  const schedule = '0 8 * * *';
  logger.info(`Starting reminder cron with schedule: ${schedule}`);
  // immediate first-run then schedule
  scanAndCreateReminders();
  cron.schedule(schedule, () => {
    scanAndCreateReminders();
  });
}
