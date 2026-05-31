import { Request, Response, NextFunction } from 'express';
import { streamInvoicePdf } from '../services/pdfInvoiceService';

export async function getInvoicePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await streamInvoicePdf(id, res);
  } catch (err) {
    next(err);
  }
}
