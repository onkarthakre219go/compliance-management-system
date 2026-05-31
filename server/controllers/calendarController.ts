import { Request, Response, NextFunction } from 'express';
import { mockDb } from '../config/mockDb';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Aggregate events from compliance calendar and tasks (due dates)
export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = req.query;

    // gather calendar entries
    const calEvents = mockDb.calendar.map(c => ({
      id: c._id,
      title: c.title,
      start: c.dueDate,
      end: c.extDueDate || c.dueDate,
      allDay: false,
      type: 'calendar',
      meta: c
    }));

    // gather task due dates as events
    const taskEvents = mockDb.tasks.filter(t => t.dueDate).map(t => ({
      id: t._id,
      title: t.title,
      start: t.dueDate,
      end: t.dueDate,
      allDay: false,
      type: 'task',
      meta: t
    }));

    let events = [...calEvents, ...taskEvents];

    // optional date range filtering
    if (start || end) {
      const s = start ? new Date(start as string) : new Date('1970-01-01');
      const e = end ? new Date(end as string) : new Date('9999-12-31');
      events = events.filter(ev => {
        const evStart = new Date(ev.start);
        return evStart >= s && evStart <= e;
      });
    }

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, startDate, endDate, category } = req.body;
    if (!title || !startDate) throw new BadRequestError('Missing required fields: title or startDate');

    const newEvent = {
      _id: `cal_${Date.now()}`,
      templateId: undefined,
      title,
      description,
      category: category || 'Other',
      dueDate: new Date(startDate),
      extDueDate: endDate ? new Date(endDate) : undefined,
      frequency: 'One-Time',
      status: 'Upcoming',
      notes: '',
    } as any;

    mockDb.calendar.push(newEvent);
    res.status(201).json({ status: 'success', data: { event: newEvent } });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const idx = mockDb.calendar.findIndex(c => c._id === id);
    if (idx === -1) throw new NotFoundError('Calendar event not found');

    const updates = req.body;
    mockDb.calendar[idx] = { ...mockDb.calendar[idx], ...updates };
    res.status(200).json({ status: 'success', data: { event: mockDb.calendar[idx] } });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const idx = mockDb.calendar.findIndex(c => c._id === id);
    if (idx === -1) throw new NotFoundError('Calendar event not found');
    mockDb.calendar.splice(idx, 1);
    res.status(200).json({ status: 'success', message: 'Event removed' });
  } catch (err) {
    next(err);
  }
}
