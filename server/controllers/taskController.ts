import { Request, Response, NextFunction } from 'express';
import { mockDb } from '../config/mockDb';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, priority, assignedTo, clientId, search } = req.query;

    let filtered = [...mockDb.tasks];

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }

    if (assignedTo) {
      filtered = filtered.filter(t => t.assignedTo === assignedTo);
    }

    if (clientId) {
      filtered = filtered.filter(t => t.clientId === clientId);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    // Populate associations
    const results = filtered.map(t => {
      const client = mockDb.clients.find(c => c._id === t.clientId);
      const user = mockDb.users.find(u => u._id === t.assignedTo);
      const template = mockDb.templates.find(temp => temp._id === t.templateId);

      return {
        ...t,
        clientName: client ? client.name : 'Unknown Client',
        clientPan: client ? client.pan : '',
        assignedToUser: user ? {
          id: user._id,
          fullName: user.fullName,
          role: user.role
        } : null,
        templateName: template ? template.title : null,
        templateCategory: template ? template.category : null
      };
    });

    res.status(200).json({
      status: 'success',
      results: results.length,
      data: { tasks: results }
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const task = mockDb.tasks.find(t => t._id === id);

    if (!task) {
      throw new NotFoundError('Task entity does not exist.');
    }

    const client = mockDb.clients.find(c => c._id === task.clientId);
    const user = mockDb.users.find(u => u._id === task.assignedTo);
    const template = mockDb.templates.find(temp => temp._id === task.templateId);

    res.status(200).json({
      status: 'success',
      data: {
        task: {
          ...task,
          client: client || null,
          assignedToUser: user ? {
            id: user._id,
            fullName: user.fullName,
            role: user.role,
            email: user.email
          } : null,
          template: template || null,
          templateCategory: template ? template.category : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, clientId, assignedTo, templateId, priority, dueDate, notes } = req.body;

    logger.info(`Creating a new compliance tracking task: ${title}`);

    // Verify client exists
    const client = mockDb.clients.find(c => c._id === clientId);
    if (!client) {
      throw new BadRequestError('Cannot construct a task without a valid registered Client ID.');
    }

    const newTask = {
      _id: `tsk_${Date.now()}`,
      title,
      description,
      clientId,
      assignedTo: assignedTo || undefined,
      templateId: templateId || undefined,
      status: 'Pending' as const,
      priority: priority || 'Medium',
      dueDate: new Date(dueDate),
      notes,
      attachments: [],
      createdAt: new Date()
    };

    mockDb.tasks.push(newTask);
    logger.info(`Task created successfully: ${newTask.title} has been seeded under client ${client.name}`);

    // Create Notification if assigned staff is present
    if (assignedTo) {
      mockDb.notifications.push({
        _id: `ntf_${Date.now()}`,
        userId: assignedTo,
        title: 'New Task Assignment',
        message: `Task: ${newTask.title} has been assigned to you. Complete by ${newTask.dueDate.toLocaleDateString()}.`,
        type: 'task_assigned',
        read: false,
        createdAt: new Date()
      });
    }

    res.status(201).json({
      status: 'success',
      data: { task: newTask }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const taskIndex = mockDb.tasks.findIndex(t => t._id === id);

    if (taskIndex === -1) {
      throw new NotFoundError('Task entity does not exist.');
    }

    const prevTask = mockDb.tasks[taskIndex];
    const updates = req.body;

    // Check if task completed to log completion times
    let actualCompletionDate = prevTask.actualCompletionDate;
    if (updates.status === 'Completed' && prevTask.status !== 'Completed') {
      actualCompletionDate = new Date();
      logger.info(`Task [${prevTask.title}] marked as COMPLETED.`);
    } else if (updates.status && updates.status !== 'Completed') {
      actualCompletionDate = undefined;
    }

    const updatedTask = {
      ...prevTask,
      ...updates,
      actualCompletionDate,
      updatedAt: new Date()
    };

    mockDb.tasks[taskIndex] = updatedTask;
    logger.info(`Task updated: ${updatedTask.title} (Status: ${updatedTask.status})`);

    // Alert assigned staff on status checks if reassigned
    if (updates.assignedTo && updates.assignedTo !== prevTask.assignedTo) {
      mockDb.notifications.push({
        _id: `ntf_${Date.now()}`,
        userId: updates.assignedTo,
        title: 'Task Reassignment',
        message: `Task: "${updatedTask.title}" has been transferred to your active queue. Check compliance logs.`,
        type: 'task_assigned',
        read: false,
        createdAt: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      data: { task: updatedTask }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const taskIndex = mockDb.tasks.findIndex(t => t._id === id);

    if (taskIndex === -1) {
      throw new NotFoundError('Task record not found.');
    }

    mockDb.tasks.splice(taskIndex, 1);
    logger.info(`Task with ID ${id} deleted.`);
    res.status(200).json({
      status: 'success',
      message: 'Task removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { authorId, text } = req.body;

    const task = mockDb.tasks.find(t => t._id === id);
    if (!task) throw new NotFoundError('Task entity does not exist.');

    const comment = { _id: `c_${Date.now()}`, authorId, text, createdAt: new Date() };
    task.comments = task.comments || [];
    task.comments.push(comment);

    // notify assignee if different
    if (task.assignedTo && task.assignedTo !== authorId) {
      mockDb.notifications.push({
        _id: `ntf_${Date.now()}`,
        userId: task.assignedTo,
        title: 'New Comment on Task',
        message: `A new comment was added to task: ${task.title}`,
        type: 'task_assigned',
        read: false,
        createdAt: new Date()
      });
    }

    res.status(201).json({ status: 'success', data: { comment } });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, commentId } = req.params;
    const task = mockDb.tasks.find(t => t._id === id);
    if (!task) throw new NotFoundError('Task entity does not exist.');

    if (!task.comments) task.comments = [];
    const idx = task.comments.findIndex(c => c._id === commentId);
    if (idx === -1) throw new NotFoundError('Comment not found');

    task.comments.splice(idx, 1);
    res.status(200).json({ status: 'success', message: 'Comment removed' });
  } catch (err) {
    next(err);
  }
}

export async function addAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { filename, url, mimeType, uploadedBy } = req.body;

    const task = mockDb.tasks.find(t => t._id === id);
    if (!task) throw new NotFoundError('Task entity does not exist.');

    const attachment = { _id: `att_${Date.now()}`, filename, url, mimeType, uploadedBy, uploadedAt: new Date() };
    task.attachments = task.attachments || [];
    task.attachments.push(attachment as any);

    res.status(201).json({ status: 'success', data: { attachment } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, attachmentId } = req.params;
    const task = mockDb.tasks.find(t => t._id === id);
    if (!task) throw new NotFoundError('Task entity does not exist.');

    if (!task.attachments) task.attachments = [];
    const idx = task.attachments.findIndex(a => a._id === attachmentId);
    if (idx === -1) throw new NotFoundError('Attachment not found');

    task.attachments.splice(idx, 1);
    res.status(200).json({ status: 'success', message: 'Attachment removed' });
  } catch (err) {
    next(err);
  }
}
