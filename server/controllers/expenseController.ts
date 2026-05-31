import { Request, Response, NextFunction } from 'express';
import { mockDb } from '../config/mockDb';
import ExpenseModel from '../models/Expense';
import { isDbConnected } from '../config/db';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, spentBy, page = 1, limit = 50, year, month } = req.query as any;

    let items: any[] = [];
    if (isDbConnected) {
      const q: any = {};
      if (category) q.category = category;
      if (spentBy) q.spentBy = spentBy;
      if (year && month) {
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 1);
        q.spentDate = { $gte: start, $lt: end };
      }
      items = await ExpenseModel.find(q).sort({ spentDate: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean();
    } else {
      items = [...mockDb.expenses];
      if (category) items = items.filter(e => e.category === category);
      if (spentBy) items = items.filter(e => e.spentBy === spentBy);
      if (year && month) {
        items = items.filter(e => new Date(e.spentDate).getFullYear() === Number(year) && (new Date(e.spentDate).getMonth() + 1) === Number(month));
      }
    }

    res.status(200).json({ status: 'success', results: items.length, data: { expenses: items } });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, category, amount, spentDate, spentBy, taskId, paymentStatus, receiptUrl, description } = req.body;

    if (!title || !amount || !spentDate || !spentBy) {
      throw new BadRequestError('Missing required fields: title, amount, spentDate, spentBy');
    }

    if (isDbConnected) {
      const doc = await ExpenseModel.create({ title, category, amount: Number(amount), spentDate: new Date(spentDate), spentBy, taskId, paymentStatus, receiptUrl, description });
      res.status(201).json({ status: 'success', data: { expense: doc } });
    } else {
      const newExp = { _id: `exp_${Date.now()}`, title, category, amount: Number(amount), spentDate: new Date(spentDate), spentBy, taskId, paymentStatus: paymentStatus || 'Paid', receiptUrl, description, createdAt: new Date() };
      mockDb.expenses.push(newExp);
      logger.info(`Expense recorded: ${newExp.title} | INR ${newExp.amount}`);
      res.status(201).json({ status: 'success', data: { expense: newExp } });
    }
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected) {
      const doc = await ExpenseModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (!doc) throw new NotFoundError('Expense not found');
      res.status(200).json({ status: 'success', data: { expense: doc } });
    } else {
      const idx = mockDb.expenses.findIndex(e => e._id === id);
      if (idx === -1) throw new NotFoundError('Expense not found');
      mockDb.expenses[idx] = { ...mockDb.expenses[idx], ...updates, updatedAt: new Date() };
      res.status(200).json({ status: 'success', data: { expense: mockDb.expenses[idx] } });
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      const doc = await ExpenseModel.findByIdAndDelete(id).lean();
      if (!doc) throw new NotFoundError('Expense not found');
      res.status(200).json({ status: 'success', message: 'Expense removed' });
    } else {
      const idx = mockDb.expenses.findIndex(e => e._id === id);
      if (idx === -1) throw new NotFoundError('Expense not found');
      mockDb.expenses.splice(idx, 1);
      res.status(200).json({ status: 'success', message: 'Expense removed' });
    }
  } catch (err) {
    next(err);
  }
}

export async function getExpenseSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { period = 'monthly', year, month } = req.query as any;
    const y = Number(year) || new Date().getFullYear();

    if (period === 'monthly') {
      const m = Number(month) || (new Date().getMonth() + 1);
      // calculate sum by category for the given month
      let items: any[] = [];
      if (isDbConnected) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        items = await ExpenseModel.find({ spentDate: { $gte: start, $lt: end } }).lean();
      } else {
        items = mockDb.expenses.filter(e => {
          const d = new Date(e.spentDate);
          return d.getFullYear() === y && (d.getMonth() + 1) === m;
        });
      }

      const byCategory: any = {};
      items.forEach(it => {
        byCategory[it.category] = (byCategory[it.category] || 0) + Number(it.amount || 0);
      });

      res.status(200).json({ status: 'success', data: { period: 'monthly', year: y, month: m, totals: byCategory, total: items.reduce((s, i) => s + Number(i.amount || 0), 0) } });
      return;
    }

    if (period === 'yearly') {
      let items: any[] = [];
      if (isDbConnected) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        items = await ExpenseModel.find({ spentDate: { $gte: start, $lt: end } }).lean();
      } else {
        items = mockDb.expenses.filter(e => new Date(e.spentDate).getFullYear() === y);
      }

      const byMonth: any = {};
      items.forEach(it => {
        const m = new Date(it.spentDate).getMonth() + 1;
        byMonth[m] = (byMonth[m] || 0) + Number(it.amount || 0);
      });

      res.status(200).json({ status: 'success', data: { period: 'yearly', year: y, totalsByMonth: byMonth, total: items.reduce((s, i) => s + Number(i.amount || 0), 0) } });
      return;
    }

    res.status(400).json({ status: 'error', message: 'Invalid period' });
  } catch (err) {
    next(err);
  }
}
