import { Request, Response, NextFunction } from 'express';
import { mockDb } from '../config/mockDb';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, clientId } = req.query;

    let filtered = [...mockDb.invoices];

    if (status) {
      filtered = filtered.filter(inv => inv.status === status);
    }

    if (clientId) {
      filtered = filtered.filter(inv => inv.clientId === clientId);
    }

    // Populate client metadata
    const results = filtered.map(inv => {
      const client = mockDb.clients.find(c => c._id === inv.clientId);
      return {
        ...inv,
        clientName: client ? client.name : 'Unknown Client',
        clientPan: client ? client.pan : ''
      };
    });

    res.status(200).json({
      status: 'success',
      results: results.length,
      data: { invoices: results }
    });
  } catch (err) {
    next(err);
  }
}

function inferInvoiceFeeType(item: any) {
  const description = String(item?.description || '').toLowerCase();
  if (/government|gst|tds|roc|cess|stamp|registration|license|duty/.test(description)) {
    return 'Government';
  }
  if (item?.feeType) {
    return String(item.feeType).charAt(0).toUpperCase() + String(item.feeType).slice(1).toLowerCase();
  }
  return 'Professional';
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId, issueDate, dueDate, items, notes } = req.body;

    logger.info(`Drafting invoice schedule for client ID: ${clientId}`);

    // Verify client exists
    const client = mockDb.clients.find(c => c._id === clientId);
    if (!client) {
      throw new BadRequestError('An invoice must be attached to an active client account.');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('An invoice requires at least one billing item description.');
    }

    // Calculate subtotal, gstAmount, and totalAmount
    let subtotal = 0;
    let gstAmount = 0;

    const validatedItems = items.map((item: any) => {
      const amt = Number(item.amount) || 0;
      const rate = Number(item.gstRate) !== undefined ? Number(item.gstRate) : 18;
      const feeType = inferInvoiceFeeType(item);

      subtotal += amt;
      gstAmount += (amt * rate) / 100;

      return {
        description: item.description || 'Professional Consultation Services',
        amount: amt,
        gstRate: rate,
        sacCode: item.sacCode || '9982',
        feeType
      };
    });

    const totalAmount = subtotal + gstAmount;
    const issueDateValue = issueDate ? new Date(issueDate) : new Date();
    const validIssueDate = Number.isNaN(issueDateValue.getTime()) ? new Date() : issueDateValue;
    const dueDateValue = dueDate ? new Date(dueDate) : new Date();
    const validDueDate = Number.isNaN(dueDateValue.getTime()) ? new Date() : dueDateValue;

    const invoiceYear = validIssueDate.getFullYear();
    const yearPattern = new RegExp(`^CA-${invoiceYear}-(\\d{4})$`);
    const highestSequence = mockDb.invoices.reduce((max, invoice) => {
      const match = String(invoice.invoiceNumber || '').match(yearPattern);
      if (match) {
        return Math.max(max, Number(match[1]));
      }
      return max;
    }, 0);
    const invoiceNumber = `CA-${invoiceYear}-${String(highestSequence + 1).padStart(4, '0')}`;

    const newInvoice = {
      _id: `inv_${Date.now()}`,
      invoiceNumber,
      clientId,
      issueDate: validIssueDate,
      dueDate: validDueDate,
      items: validatedItems,
      subtotal,
      gstAmount,
      totalAmount,
      status: 'Draft' as const,
      notes,
      createdAt: new Date()
    };

    mockDb.invoices.push(newInvoice);
    logger.info(`Invoice drafted: ${newInvoice.invoiceNumber} | Total: INR ${newInvoice.totalAmount}`);

    res.status(201).json({
      status: 'success',
      data: { invoice: newInvoice }
    });
  } catch (err) {
    next(err);
  }
}

export async function addPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Invoice ID
    const { amount, paymentMethod, transactionId, reference, notes } = req.body;

    const invoice = mockDb.invoices.find(inv => inv._id === id);
    if (!invoice) {
      throw new NotFoundError('Invoice matching credentials not found.');
    }

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      throw new BadRequestError('Payment value must be greater than zero.');
    }

    // Capture payment receipt in payment journals
    const newPayment = {
      _id: `pay_${Date.now()}`,
      invoiceId: id,
      paymentDate: new Date(),
      amount: payAmt,
      paymentMethod: paymentMethod || 'Bank Transfer',
      transactionId,
      reference,
      notes
    };

    mockDb.payments.push(newPayment);
    logger.info(`Transaction log created on invoice ${invoice.invoiceNumber}: INR ${payAmt} via ${newPayment.paymentMethod}`);

    // Update invoice status based on cumulative payments
    const previousPayments = mockDb.payments
      .filter(p => p.invoiceId === id)
      .reduce((sum, p) => sum + p.amount, 0);

    if (previousPayments >= invoice.totalAmount) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    res.status(201).json({
      status: 'success',
      data: { 
        payment: newPayment,
        invoiceStatus: invoice.status
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, paymentStatus } = req.query;

    let filtered = [...mockDb.expenses];

    if (category) {
      filtered = filtered.filter(exp => exp.category === category);
    }

    if (paymentStatus) {
      filtered = filtered.filter(exp => exp.paymentStatus === paymentStatus);
    }

    const results = filtered.map(exp => {
      const user = mockDb.users.find(u => u._id === exp.spentBy);
      const task = mockDb.tasks.find(t => t._id === exp.taskId);
      
      return {
        ...exp,
        spentByName: user ? user.fullName : 'Associate',
        associatedTaskName: task ? task.title : null
      };
    });

    res.status(200).json({
      status: 'success',
      results: results.length,
      data: { expenses: results }
    });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, category, amount, spentBy, taskId, paymentStatus, description } = req.body;

    logger.info(`Filing expenditure receipt: ${title}`);

    const newExpense = {
      _id: `exp_${Date.now()}`,
      title,
      category,
      amount: Number(amount) || 0,
      spentDate: new Date(),
      spentBy: spentBy || 'usr_associate',
      taskId: taskId || undefined,
      paymentStatus: paymentStatus || 'Paid',
      description,
      createdAt: new Date()
    };

    mockDb.expenses.push(newExpense);
    logger.info(`Expense registered! Category: ${newExpense.category} | Amount: INR ${newExpense.amount}`);

    res.status(201).json({
      status: 'success',
      data: { expense: newExpense }
    });
  } catch (err) {
    next(err);
  }
}
