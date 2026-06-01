import { Request, Response, NextFunction } from 'express';
import { sendInvoiceEmail } from '../services/emailService';
import { mockDb } from '../config/mockDb';
import { isDbConnected } from '../config/db';
import InvoiceModel from '../models/Invoice';

export async function sendInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { to } = req.body; // array of emails

    // Resolve invoice existence
    let invoice: any = null;
    if (isDbConnected) {
      invoice = await InvoiceModel.findById(id).lean();
    } else {
      invoice = mockDb.invoices.find((i: any) => i._id === id);
    }

    if (!invoice) {
      return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const subject = `Invoice: ${invoice.invoiceNumber || invoice._id}`;

    const result = await sendInvoiceEmail({ to: recipients, subject, invoiceId: id });

    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.message || 'Failed to send email' });
    }

    // Update invoice status to Sent and save reminder rules if provided
    const updateFields: any = { status: 'Sent' };
    if (req.body.reminderRules) {
      updateFields.reminderRules = req.body.reminderRules;
    }
    if (isDbConnected) {
      await InvoiceModel.findByIdAndUpdate(id, updateFields);
    } else {
      const inv = mockDb.invoices.find((i: any) => i._id === id);
      if (inv) {
        inv.status = 'Sent';
        if (req.body.reminderRules) {
          inv.reminderRules = req.body.reminderRules;
        }
      }
    }

    res.status(200).json({ status: 'success', message: 'Invoice sent', info: result.info || null });
  } catch (err) {
    next(err);
  }
}
