import mongoose from 'mongoose';
import { mockDb } from '../config/mockDb';
import { logger } from '../utils/logger';
import ComplianceTemplate from '../models/ComplianceTemplate';
import Task from '../models/Task';
import Notification from '../models/Notification';
import User from '../models/User';
import Client from '../models/Client';

const ComplianceTemplateModel = ComplianceTemplate as any;
const TaskModel = Task as any;
const NotificationModel = Notification as any;
const UserModel = User as any;
const ClientModel = Client as any;

function isMongoActive(): boolean {
  return mongoose.connection.readyState === 1;
}

export class ComplianceService {
  /**
   * Helper to map client's constitution matching strings to template's applicable types enum
   */
  public static mapConstitutionToClientType(constitution: string): 'Pvt Ltd' | 'Public Ltd' | 'LLP' | 'OPC' | 'Partnership' | 'Proprietorship' | null {
    switch (constitution) {
      case 'Private Limited':
        return 'Pvt Ltd';
      case 'Public Limited':
        return 'Public Ltd';
      case 'LLP':
        return 'LLP';
      case 'Partnership':
        return 'Partnership';
      case 'Proprietorship':
        return 'Proprietorship';
      case 'OPC':
        return 'OPC';
      default:
        return null;
    }
  }

  /**
   * Automatically generate tasks for a newly created client based on applicable compliance templates.
   */
  public static async generateAutoTasksForClient(clientObj: any): Promise<any[]> {
    try {
      const { _id, name, constitution, assignedTo } = clientObj;
      logger.info(`Auto-generating compliance tasks for client: ${name} (${constitution})`);

      const clientType = this.mapConstitutionToClientType(constitution);
      logger.info(`Mapped client constitution "${constitution}" to template clientType: "${clientType}"`);

      let templates: any[] = [];

      if (isMongoActive()) {
        // Query templates from database
        const query: any = {};
        if (clientType) {
          query.applicableClientTypes = clientType;
        } else {
          // If constitution doesn't map directly (e.g., Trust or Individual), we may skip or return empty
          return [];
        }
        templates = await ComplianceTemplateModel.find(query);
        logger.info(`Found ${templates.length} database templates for ${clientType}`);
      } else {
        // Query templates from sandbox mockDb
        if (clientType) {
          templates = mockDb.templates.filter(t => t.applicableClientTypes?.includes(clientType));
        } else {
          return [];
        }
        logger.info(`Found ${templates.length} mock templates for ${clientType}`);
      }

      const generatedTasks: any[] = [];
      const currentYear = new Date().getFullYear();

      for (const template of templates) {
        // Calculate due date based on the templates' due date rule
        const ruleType = template.dueDateRule?.ruleType || 'DayOfMonth';
        const offset = template.dueDateRule?.daysOffset || 0;
        let dueDate = new Date();

        if (ruleType === 'DaysAfterYearEnd') {
          const fyEnd = new Date(currentYear, 2, 31); // March 31st (0-indexed 2 is March)
          dueDate = new Date(fyEnd.getTime() + offset * 24 * 3600 * 1000);
        } else if (ruleType === 'DaysAfterMonthEnd') {
          const monthEnd = new Date(currentYear, new Date().getMonth() + 1, 0);
          dueDate = new Date(monthEnd.getTime() + offset * 24 * 3600 * 1000);
        } else if (ruleType === 'DaysAfterQuarterEnd') {
          const currentMonth = new Date().getMonth();
          const q = Math.floor(currentMonth / 3);
          const qEndMonth = (q + 1) * 3 - 1;
          const qEnd = new Date(currentYear, qEndMonth + 1, 0);
          dueDate = new Date(qEnd.getTime() + offset * 24 * 3600 * 1000);
        } else if (ruleType === 'SpecificDate' && template.dueDateRule?.specificDate) {
          dueDate = new Date(template.dueDateRule.specificDate);
        } else {
          // DayOfMonth fallback or custom day offsets
          dueDate = new Date(currentYear, new Date().getMonth(), offset || 15);
        }

        const taskData = {
          title: `Compliance: ${template.title}`,
          description: template.description || `Compliance filing task automatically generated from ${template.title} for ${constitution} clients.`,
          clientId: _id,
          assignedTo: assignedTo || undefined,
          templateId: template._id,
          status: 'Pending' as const,
          priority: (template.category === 'GST' || template.category === 'Income Tax') ? 'High' as const : 'Medium' as const,
          dueDate,
          notes: `Checklist Milestones: ${template.checklistItems?.map((ci: any) => `[${ci.isMandatory ? 'Mandatory' : 'Optional'}] ${ci.itemText}`).join('; ') || ''}`,
          attachments: [] as string[]
        };

        if (isMongoActive()) {
          const newTask = new TaskModel(taskData);
          await newTask.save();
          
          // Sync with mockDb too for visual consistency in UI dashboard lists
          const mockTaskObj = {
            ...newTask.toObject(),
            _id: newTask._id.toString(),
            clientId: _id.toString(),
            assignedTo: assignedTo ? assignedTo.toString() : undefined,
            templateId: template._id.toString()
          };
          mockDb.tasks.push(mockTaskObj);
          generatedTasks.push(newTask);
        } else {
          // Sandbox Mode
          const mockTask: any = {
            _id: `tsk_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            ...taskData,
            clientId: _id.toString(),
            assignedTo: assignedTo ? assignedTo.toString() : undefined,
            templateId: template._id.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockDb.tasks.push(mockTask);
          generatedTasks.push(mockTask);
        }
      }

      logger.info(`Auto-generated and synchronized ${generatedTasks.length} compliance tasks for client ID: ${_id}`);
      return generatedTasks;
    } catch (err) {
      logger.error(`Error during automatic compliance generation: ${err}`);
      return [];
    }
  }

  /**
   * Cron Job simulation / Background compliance scheduler.
   * Scans all incomplete tasks, assesses deadlines:
   * - If task is past due (dueDate < now) and status != 'Completed' -> marks priority as Critical (escalation), logs warning, throws notification alert.
   * - If task is within 5 days of dueDate -> creates a 'deadline_approaching' alert notification.
   */
  public static async runComplianceCron(): Promise<{ escalatedCount: number; notificationCount: number; logs: string[] }> {
    const logs: string[] = [];
    let escalatedCount = 0;
    let notificationCount = 0;
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 3600 * 1000);

    logger.info('[CRON] Running scheduled compliance evaluation job...');
    logs.push(`Cron execution started at ${now.toISOString()}`);

    if (isMongoActive()) {
      try {
        // Query unresolved tasks
        const incompleteTasks = await TaskModel.find({ status: { $ne: 'Completed' } });
        logs.push(`Found ${incompleteTasks.length} unresolved tasks in MongoDB.`);

        for (const task of incompleteTasks) {
          const client = await ClientModel.findById(task.clientId);
          const clientName = client ? client.name : 'Unknown Client';
          const dueDate = new Date(task.dueDate);

          // Get the user to notify: task.assignedTo or first Admin/User
          let targetUserId = task.assignedTo;
          if (!targetUserId) {
            const firstAdmin = await UserModel.findOne({ role: 'Admin' });
            targetUserId = firstAdmin ? firstAdmin._id : null;
          }

          if (dueDate < now) {
            // Overdue Escalation
            let escalated = false;
            if (task.priority !== 'Critical') {
              task.priority = 'Critical';
              escalated = true;
              escalatedCount++;
            }
            if (escalated) {
              await task.save();
              // Sync mockDb task priority
              const idx = mockDb.tasks.findIndex((t: any) => t._id === task._id.toString());
              if (idx !== -1) {
                mockDb.tasks[idx].priority = 'Critical';
              }
            }

            // Create Notification
            if (targetUserId) {
              const notifTitle = `CRITICAL: Overdue Compliance - ${task.title}`;
              const notifMsg = `The compliance task "${task.title}" for client "${clientName}" has MISSED its regulatory due date of ${dueDate.toLocaleDateString()}. Escalated priority to Critical.`;
              
              // Check if notification already exists to avoid duplication
              const existingNotif = await NotificationModel.findOne({
                userId: targetUserId,
                title: notifTitle
              });

              if (!existingNotif) {
                const newNotif = new NotificationModel({
                  userId: targetUserId,
                  title: notifTitle,
                  message: notifMsg,
                  type: 'deadline_approaching',
                  read: false
                });
                await newNotif.save();
                notificationCount++;
                logs.push(`Created overdue critical alert for task "${task.title}" assigned to user ${targetUserId}`);

                // Sync to mockDb
                mockDb.notifications.push({
                  ...newNotif.toObject(),
                  _id: newNotif._id.toString(),
                  userId: targetUserId.toString()
                });
              }
            }
          } else if (dueDate <= fiveDaysFromNow) {
            // Deadline approaching
            if (targetUserId) {
              const notifTitle = `Upcoming Deadline: ${task.title}`;
              const notifMsg = `The compliance task "${task.title}" for client "${clientName}" is due soon on ${dueDate.toLocaleDateString()}. Please complete all checklist items prior to submission.`;

              const existingNotif = await NotificationModel.findOne({
                userId: targetUserId,
                title: notifTitle
              });

              if (!existingNotif) {
                const newNotif = new NotificationModel({
                  userId: targetUserId,
                  title: notifTitle,
                  message: notifMsg,
                  type: 'deadline_approaching',
                  read: false
                });
                await newNotif.save();
                notificationCount++;
                logs.push(`Created upcoming deadline reminder for task "${task.title}" (Due: ${dueDate.toLocaleDateString()})`);

                // Sync to mockDb
                mockDb.notifications.push({
                  ...newNotif.toObject(),
                  _id: newNotif._id.toString(),
                  userId: targetUserId.toString()
                });
              }
            }
          }
        }
      } catch (err: any) {
        logger.error(`[CRON] Mongo execution failure: ${err}`);
        logs.push(`Mongo Error: ${err.message || err}`);
      }
    } else {
      // Memory Sandbox fallback cron
      logs.push(`Running cron evaluation in Memory Sandbox Fallback.`);
      const incompleteTasks = mockDb.tasks.filter(t => t.status !== 'Completed');
      logs.push(`Found ${incompleteTasks.length} unresolved tasks in memory database.`);

      for (const task of incompleteTasks) {
        const client = mockDb.clients.find(c => c._id === task.clientId);
        const clientName = client ? client.name : 'Unknown Client';
        const dueDate = new Date(task.dueDate);

        let targetUserId = task.assignedTo || 'usr_admin';

        if (dueDate < now) {
          if (task.priority !== 'Critical') {
            task.priority = 'Critical';
            escalatedCount++;
          }

          const notifTitle = `CRITICAL: Overdue Compliance - ${task.title}`;
          const notifMsg = `The compliance task "${task.title}" for client "${clientName}" has MISSED its regulatory due date of ${dueDate.toLocaleDateString()}. Escalated priority to Critical.`;

          const exists = mockDb.notifications.some(n => n.userId === targetUserId && n.title === notifTitle);
          if (!exists) {
            const newNotif = {
              _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: targetUserId,
              title: notifTitle,
              message: notifMsg,
              type: 'deadline_approaching' as const,
              read: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            mockDb.notifications.push(newNotif);
            notificationCount++;
            logs.push(`[Sandbox] Created overdue critical alert for task "${task.title}"`);
          }
        } else if (dueDate <= fiveDaysFromNow) {
          const notifTitle = `Upcoming Deadline: ${task.title}`;
          const notifMsg = `The compliance task "${task.title}" for client "${clientName}" is due soon on ${dueDate.toLocaleDateString()}. Please complete all checklist items prior to submission.`;

          const exists = mockDb.notifications.some(n => n.userId === targetUserId && n.title === notifTitle);
          if (!exists) {
            const newNotif = {
              _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: targetUserId,
              title: notifTitle,
              message: notifMsg,
              type: 'deadline_approaching' as const,
              read: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            mockDb.notifications.push(newNotif);
            notificationCount++;
            logs.push(`[Sandbox] Created upcoming deadline warning for task "${task.title}"`);
          }
        }
      }
    }

    logs.push(`Cron execution completed. Escalated: ${escalatedCount}, Notifications thrown: ${notificationCount}`);
    logger.info(`[CRON] Compliance cron finished successfully. Escalated: ${escalatedCount}, Notifications: ${notificationCount}`);
    return { escalatedCount, notificationCount, logs };
  }

  /**
   * Preloads any dynamic templates into Mongo upon initialization.
   */
  public static async ensureDefaultTemplates(): Promise<void> {
    if (!isMongoActive()) return;
    try {
      logger.info('Verifying baseline compliance templates in Mongo...');
      for (const seed of mockDb.templates) {
        const found = await ComplianceTemplateModel.findOne({ title: seed.title });
        if (!found) {
          logger.info(`Seeding missing compliance template: "${seed.title}"`);
          const document = new ComplianceTemplateModel({
            ...seed,
            _id: undefined // Let Mongo generate id
          });
          await document.save();
        }
      }
    } catch (err) {
      logger.error(`Error seeding missing default compliance templates: ${err}`);
    }
  }
}

