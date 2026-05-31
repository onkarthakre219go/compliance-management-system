import NotificationModel from '../models/Notification';
import { mockDb } from '../config/mockDb';
import { isDbConnected } from '../config/db';
import { logger } from '../utils/logger';

export async function createReminderNotificationForTask(task: any, daysBefore: number) {
  const eventType = 'compliance_due';
  const dedupeKey = `task:${task._id}:due_in_${daysBefore}`;

  const title = `Reminder: ${task.title} due in ${daysBefore} day(s)`;

  const payload = {
    taskId: task._id,
    clientId: task.clientId,
    dueDate: task.dueDate,
    daysBefore
  };

  // If DB is connected, persist with Mongoose and dedupe
  if (isDbConnected) {
    const exists = await NotificationModel.findOne({ dedupeKey, eventType }).lean();
    if (exists) {
      logger.info(`Skipped duplicate reminder for ${dedupeKey}`);
      return exists;
    }

    const doc = await NotificationModel.create({
      eventType,
      channels: ['email', 'sms', 'whatsapp'],
      to: [],
      payload,
      dedupeKey,
      status: 'pending',
      sendAt: new Date()
    });

    logger.info(`Created reminder notification ${doc._id} for ${dedupeKey}`);
    return doc;
  }

  // Fallback: use in-memory mockDb.notifications with simple dedupe
  const found = mockDb.notifications.find((n: any) => n.type === 'deadline_approaching' && n.message && n.message.includes(dedupeKey));
  if (found) {
    logger.info(`Skipped duplicate mock reminder for ${dedupeKey}`);
    return found;
  }

  const ntf = {
    _id: `ntf_${Date.now()}`,
    userId: task.assignedTo || null,
    title,
    message: `${title} (${dedupeKey})`,
    type: 'deadline_approaching',
    read: false,
    createdAt: new Date()
  };
  mockDb.notifications.push(ntf);
  logger.info(`Mock notification queued: ${ntf._id}`);
  return ntf;
}
