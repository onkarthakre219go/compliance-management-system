import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { mockDb } from '../config/mockDb';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import ComplianceTemplate from '../models/ComplianceTemplate';
import ComplianceCalendar from '../models/ComplianceCalendar';
import Client from '../models/Client';
import { ComplianceService } from '../services/complianceService';

const ComplianceTemplateModel = ComplianceTemplate as any;
const ComplianceCalendarModel = ComplianceCalendar as any;
const ClientModel = Client as any;

/**
 * Returns true if the live MongoDB database layer is connected and ready.
 */
function isMongoActive(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get all defined compliance templates
 */
export async function getComplianceTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query;
    
    if (isMongoActive()) {
      const queryObj: any = {};
      if (category) queryObj.category = category;
      const templates = await ComplianceTemplateModel.find(queryObj);
      
      // Seed fallback in Mongo if none exists so the interface isn't bare metal
      if (templates.length === 0 && mockDb.templates.length > 0 && queryObj.category === undefined) {
        logger.info('Mongo templates collection is vacant. Importing mock seeds...');
        for (const seed of mockDb.templates) {
          const document = new ComplianceTemplateModel({
            ...seed,
            _id: seed._id.startsWith('tmp_') ? undefined : seed._id
          });
          await document.save();
        }
        const updatedTemplates = await ComplianceTemplateModel.find({});
        return res.status(200).json({
          status: 'success',
          results: updatedTemplates.length,
          data: { templates: updatedTemplates }
        });
      }

      return res.status(200).json({
        status: 'success',
        results: templates.length,
        data: { templates }
      });
    }

    // Memory Sandbox Mode fallback
    let filtered = [...mockDb.templates];
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { templates: filtered }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Define and create a brand-new Compliance Template containing rules
 */
export async function createComplianceTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { 
      title, 
      description, 
      category, 
      frequency, 
      checklistItems, 
      averageMinutesToComplete,
      applicableClientTypes,
      dueDateRule,
      reminderRules
    } = req.body;

    if (!title || !category || !frequency) {
      throw new BadRequestError('Fields "title", "category", and "frequency" are required to define a template.');
    }

    const templateData = {
      title,
      description,
      category,
      frequency,
      checklistItems: checklistItems || [],
      averageMinutesToComplete: averageMinutesToComplete || 30,
      applicableClientTypes: applicableClientTypes || [],
      dueDateRule: dueDateRule || { ruleType: 'DayOfMonth', daysOffset: 15 },
      reminderRules: reminderRules || { daysBefore: [5, 2, 1], channel: 'Email & App' }
    };

    if (isMongoActive()) {
      // Check existing title
      const existing = await ComplianceTemplateModel.findOne({ title });
      if (existing) {
        throw new BadRequestError(`A compliance template named "${title}" already exists.`);
      }

      const template = new ComplianceTemplateModel(templateData);
      await template.save();

      // Ensure mockDb remains consistent
      const mockCopy = { ...template.toObject(), _id: template._id.toString() };
      mockDb.templates.push(mockCopy);

      return res.status(201).json({
        status: 'success',
        data: { template }
      });
    }

    // Memory Sandbox Mode
    const titleClash = mockDb.templates.some(t => t.title.toLowerCase() === title.trim().toLowerCase());
    if (titleClash) {
      throw new BadRequestError(`A compliance template named "${title}" already exists in Sandbox.`);
    }

    const mockTemplate: any = {
      _id: `tmp_${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockDb.templates.push(mockTemplate);

    res.status(201).json({
      status: 'success',
      data: { template: mockTemplate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing compliance template details and rules
 */
export async function updateComplianceTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updateBody = req.body;

    if (isMongoActive()) {
      const template = await ComplianceTemplateModel.findByIdAndUpdate(id, updateBody, { new: true, runValidators: true });
      if (!template) {
        throw new NotFoundError('Compliance template requested for update was not found.');
      }

      // Sync mockDb template copy
      const idx = mockDb.templates.findIndex(t => t._id === id);
      if (idx !== -1) {
        mockDb.templates[idx] = { ...mockDb.templates[idx], ...template.toObject() };
      }

      return res.status(200).json({
        status: 'success',
        data: { template }
      });
    }

    // Memory Sandbox
    const idx = mockDb.templates.findIndex(t => t._id === id);
    if (idx === -1) {
      throw new NotFoundError('Compliance template was not found in Sandbox.');
    }

    const updatedTemplate = {
      ...mockDb.templates[idx],
      ...updateBody,
      updatedAt: new Date()
    };

    mockDb.templates[idx] = updatedTemplate;

    res.status(200).json({
      status: 'success',
      data: { template: updatedTemplate }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove a compliance template
 */
export async function deleteComplianceTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (isMongoActive()) {
      const deleted = await ComplianceTemplateModel.findByIdAndDelete(id);
      if (!deleted) {
        throw new NotFoundError('Compliance template was not found for deletion.');
      }
    }

    const idx = mockDb.templates.findIndex(t => t._id === id);
    if (idx !== -1) {
      mockDb.templates.splice(idx, 1);
    } else if (!isMongoActive()) {
      throw new NotFoundError('Compliance template was not found in Sandbox.');
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Automatically generate compliance calendar events based on dynamic template rules
 */
export async function generateEventsFromTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { year, targetMonth } = req.body; // targetMonth 0-indexed (0 = January)

    if (year === undefined || targetMonth === undefined) {
      throw new BadRequestError('Both "year" (e.g. 2026) and "targetMonth" (0-11) are required parameters.');
    }

    let template: any = null;

    if (isMongoActive()) {
      template = await ComplianceTemplateModel.findById(id);
    } else {
      template = mockDb.templates.find(t => t._id === id);
    }

    if (!template) {
      throw new NotFoundError('Underlying compliance template was not found.');
    }

    // Due Date Math Rule Engine
    const ruleType = template.dueDateRule?.ruleType || 'DayOfMonth';
    const offset = template.dueDateRule?.daysOffset || 0;
    let computedDueDate = new Date();

    if (ruleType === 'DayOfMonth') {
      computedDueDate = new Date(year, targetMonth, offset || 1);
    } else if (ruleType === 'DaysAfterMonthEnd') {
      // Month end of selected month
      const monthEnd = new Date(year, targetMonth + 1, 0);
      computedDueDate = new Date(monthEnd.getTime() + offset * 24 * 3600 * 1000);
    } else if (ruleType === 'DaysAfterQuarterEnd') {
      // Identify quarter of the selected month
      // Q1 = Jan-Mar (end March 31), Q2 = Apr-Jun (end June 30), Q3 = Jul-Sep (end Sept 30), Q4 = Oct-Dec (end Dec 31)
      const q = Math.floor(targetMonth / 3);
      const qEndMonth = (q + 1) * 3 - 1; // 2, 5, 8, 11
      const qEnd = new Date(year, qEndMonth + 1, 0);
      computedDueDate = new Date(qEnd.getTime() + offset * 24 * 3600 * 1000);
    } else if (ruleType === 'DaysAfterYearEnd') {
      // Financial Year in India ends March 31 of specified year
      const fyEnd = new Date(year, 2, 31); // 2 = March (0-indexed)
      computedDueDate = new Date(fyEnd.getTime() + offset * 24 * 3600 * 1000);
    } else if (ruleType === 'SpecificDate' && template.dueDateRule?.specificDate) {
      computedDueDate = new Date(template.dueDateRule.specificDate);
    } else {
      computedDueDate = new Date(year, targetMonth, 15);
    }

    // Formulate automated title
    const monthsNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthLabel = monthsNames[targetMonth];
    const eventTitle = `${template.title} - ${monthLabel} ${year}`;
    const description = `Automated regulatory filing checkpoint generated from template. Covers: ${template.applicableClientTypes?.join(', ') || 'General Clients'}.`;

    // Estimate penalty configurations
    let penalty = 100; // Rs. 100 default penalty multiplier per day
    if (template.category === 'GST') penalty = 50;
    if (template.category === 'Income Tax') penalty = 200;

    const calendarEventData = {
      templateId: template._id,
      title: eventTitle,
      description,
      category: template.category,
      dueDate: computedDueDate,
      extDueDate: new Date(computedDueDate.getTime() + 4 * 24 * 3600 * 1000), // Standard grace period extension
      penaltyAmountMultiplier: penalty,
      frequency: template.frequency,
      status: 'Upcoming' as const,
      notes: `Targeting: ${template.applicableClientTypes?.join('/') || 'All Clients'}. Reminders configured: ${template.reminderRules?.daysBefore?.join(', ') || '5,2,1'} days before via ${template.reminderRules?.channel || 'App'}.`
    };

    if (isMongoActive()) {
      const calendarEvent = new ComplianceCalendarModel(calendarEventData);
      await calendarEvent.save();

      // Ensure mockDb is updated so it reflects on the interactive page dashboard
      const mockEvent = { ...calendarEvent.toObject(), _id: calendarEvent._id.toString() };
      mockDb.calendar.push(mockEvent);

      return res.status(201).json({
        status: 'success',
        data: { calendarEvent }
      });
    }

    // Sandbox
    const mockEvent: any = {
      _id: `cal_${Date.now()}`,
      ...calendarEventData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockDb.calendar.push(mockEvent);

    res.status(201).json({
      status: 'success',
      data: { calendarEvent: mockEvent }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all calendar benchmarks sorted chronologically
 */
export async function getComplianceCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, status } = req.query;

    if (isMongoActive()) {
      const queryObj: any = {};
      if (category) queryObj.category = category;
      if (status) queryObj.status = status;

      const calendar = await ComplianceCalendarModel.find(queryObj).sort({ dueDate: 1 });
      
      // Fallback
      if (calendar.length === 0 && mockDb.calendar.length > 0 && category === undefined && status === undefined) {
        logger.info('Mongo calendar vacant. Importing pre-seeded benchmarks...');
        for (const item of mockDb.calendar) {
          const document = new ComplianceCalendarModel({
            ...item,
            _id: item._id.startsWith('cal_') ? undefined : item._id
          });
          await document.save();
        }
        const updated = await ComplianceCalendarModel.find({}).sort({ dueDate: 1 });
        return res.status(200).json({
          status: 'success',
          results: updated.length,
          data: { calendar: updated }
        });
      }

      return res.status(200).json({
        status: 'success',
        results: calendar.length,
        data: { calendar }
      });
    }

    let filtered = [...mockDb.calendar];

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    // Sort calendar events chronologically by due date
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { calendar: filtered }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Custom single calendar event creation overrides
 */
export async function addComplianceCalendarEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, category, dueDate, extDueDate, penaltyAmountMultiplier, frequency, notes } = req.body;

    logger.info(`Adding compliance calendar benchmark event: ${title}`);

    const newEventData = {
      title,
      description,
      category,
      dueDate: new Date(dueDate),
      extDueDate: extDueDate ? new Date(extDueDate) : undefined,
      penaltyAmountMultiplier: penaltyAmountMultiplier || 0,
      frequency,
      status: 'Upcoming' as const,
      notes
    };

    if (isMongoActive()) {
      const calendarEvent = new ComplianceCalendarModel(newEventData);
      await calendarEvent.save();

      // Sync mock Db
      const mockEvent = { ...calendarEvent.toObject(), _id: calendarEvent._id.toString() };
      mockDb.calendar.push(mockEvent);

      return res.status(201).json({
        status: 'success',
        data: { calendarEvent }
      });
    }

    const mockEvent = {
      _id: `cal_${Date.now()}`,
      ...newEventData
    };

    mockDb.calendar.push(mockEvent);
    logger.info(`Universal filing benchmark added to Sandbox: ${mockEvent.title}`);

    res.status(201).json({
      status: 'success',
      data: { calendarEvent: mockEvent }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Trigger manual action to compute and generate compliance tasks for any given client ID
 */
export async function triggerAutoGenerateComplianceTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    let clientObj: any = null;

    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new BadRequestError('Invalid client identifier format.');
      }
      clientObj = await ClientModel.findById(clientId);
    } else {
      clientObj = mockDb.clients.find(c => c._id === clientId);
    }

    if (!clientObj) {
      throw new NotFoundError('Client structure was not found.');
    }

    const tasks = await ComplianceService.generateAutoTasksForClient(clientObj);

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      message: `Successfully computed and auto-generated ${tasks.length} compliance tasks for client "${clientObj.name}".`,
      data: { tasks }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Trigger simulation of daily compliance scheduler engine
 */
export async function simulateComplianceCron(req: Request, res: Response, next: NextFunction) {
  try {
    const results = await ComplianceService.runComplianceCron();

    res.status(200).json({
      status: 'success',
      message: 'Compliance cron evaluation successfully executed.',
      data: results
    });
  } catch (err) {
    next(err);
  }
}

