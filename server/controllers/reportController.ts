import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import { mockDb } from '../config/mockDb';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ExcelGenerator } from '../utils/excelGenerator';
import { PDFGenerator } from '../utils/pdfGenerator';

const ClientModel = Client as any;
const InvoiceModel = Invoice as any;
const PaymentModel = Payment as any;

function isMongoActive(): boolean {
  return mongoose.connection.readyState === 1;
}

function inferFeeType(item: any) {
  if (!item) return 'professional';
  if (item.feeType) return String(item.feeType).toLowerCase();
  const description = String(item.description || '').toLowerCase();
  if (/government|gst|tds|roc|cess|stamp|registration|license|license fee|duty/.test(description)) {
    return 'government';
  }
  return 'professional';
}

function normalizeClientForReport(client: any) {
  return {
    _id: client._id,
    name: client.name,
    tradeName: client.tradeName || '',
    pan: client.pan,
    status: client.status,
    grade: client.grade,
    clientType: client.clientType,
    assignedToUser: client.assignedToUser || null,
    tags: client.tags || [],
    createdAt: client.createdAt,
  };
}

function buildFeeReportItem(invoice: any, clientName: string, amountDue: number, feeType: string) {
  return {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    clientName,
    dueDate: invoice.dueDate,
    status: invoice.status,
    totalAmount: invoice.totalAmount,
    amountDue,
    feeType,
    items: invoice.items || []
  };
}

function calculateAmountDue(invoice: any, payments: any[]) {
  const paid = payments
    .filter((payment) => payment.invoiceId === invoice._id)
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

  return Math.max((Number(invoice.totalAmount) || 0) - paid, 0);
}

export async function getClientReport(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    const grade = String(req.query.grade || '').trim().toUpperCase();

    if (!['active', 'inactive', 'grade'].includes(type)) {
      throw new BadRequestError('Report type must be one of active, inactive, or grade.');
    }

    if (isMongoActive()) {
      logger.info(`Generating client report from MongoDB: ${type}`);

      if (type === 'grade' && !grade) {
        const gradeSummary = await ClientModel.aggregate([
          { $group: { _id: '$grade', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);

        const summary = gradeSummary.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

        return res.status(200).json({
          status: 'success',
          data: { reportType: 'grade', totals: summary }
        });
      }

      const queryObj: any = {};
      if (type === 'active' || type === 'inactive') {
        queryObj.status = type;
      }
      if (type === 'grade' && grade) {
        queryObj.grade = grade;
      }

      const clients = await ClientModel.find(queryObj).sort({ createdAt: -1 });
      const results = clients.map(normalizeClientForReport);

      return res.status(200).json({
        status: 'success',
        results: results.length,
        data: {
          reportType: type,
          grade: grade || undefined,
          clients: results
        }
      });
    }

    logger.info(`Generating client report from memory sandbox: ${type}`);
    let items = [...mockDb.clients];
    if (type === 'active' || type === 'inactive') {
      items = items.filter((client) => client.status === type);
    }
    if (type === 'grade' && grade) {
      items = items.filter((client) => client.grade === grade);
    }

    if (type === 'grade' && !grade) {
      const summary = items.reduce((acc: any, client) => {
        acc[client.grade] = (acc[client.grade] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        status: 'success',
        data: { reportType: 'grade', totals: summary }
      });
    }

    const results = items.map(normalizeClientForReport);
    res.status(200).json({
      status: 'success',
      results: results.length,
      data: { reportType: type, grade: grade || undefined, clients: results }
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingFeeReport(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    if (!['government-pending', 'professional-pending'].includes(type)) {
      throw new BadRequestError('Fee report type must be government-pending or professional-pending.');
    }

    const expectedFeeType = type === 'government-pending' ? 'government' : 'professional';
    const pendingInvoices: any[] = [];

    if (isMongoActive()) {
      logger.info(`Generating pending fee report from MongoDB: ${type}`);
      const invoices = await InvoiceModel.find({ status: { $nin: ['Paid', 'Void'] } }).sort({ dueDate: 1 }).lean();
      const payments = await PaymentModel.find({}).lean();

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = await ClientModel.findById(invoice.clientId).select('name pan');
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    } else {
      logger.info(`Generating pending fee report from memory sandbox: ${type}`);
      const invoices = [...mockDb.invoices].filter(inv => inv.status !== 'Paid' && inv.status !== 'Void');

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = mockDb.clients.find(c => c._id === invoice.clientId);
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, mockDb.payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    }

    const totalOutstanding = pendingInvoices.reduce((sum, invoice) => sum + invoice.amountDue, 0);

    res.status(200).json({
      status: 'success',
      results: pendingInvoices.length,
      data: {
        feeType: expectedFeeType,
        totalOutstanding,
        invoices: pendingInvoices
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Export client report as Excel
 */
export async function exportClientReportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    const grade = String(req.query.grade || '').trim().toUpperCase();

    if (!['active', 'inactive', 'grade'].includes(type)) {
      throw new BadRequestError('Report type must be one of active, inactive, or grade.');
    }

    let clients: any[] = [];

    if (isMongoActive()) {
      logger.info(`Exporting client report to Excel from MongoDB: ${type}`);
      const queryObj: any = {};
      if (type === 'active' || type === 'inactive') {
        queryObj.status = type;
      }
      if (type === 'grade' && grade) {
        queryObj.grade = grade;
      }

      const results = await ClientModel.find(queryObj).sort({ createdAt: -1 });
      clients = results.map(normalizeClientForReport);
    } else {
      logger.info(`Exporting client report to Excel from memory sandbox: ${type}`);
      let items = [...mockDb.clients];
      if (type === 'active' || type === 'inactive') {
        items = items.filter((client) => client.status === type);
      }
      if (type === 'grade' && grade) {
        items = items.filter((client) => client.grade === grade);
      }
      clients = items.map(normalizeClientForReport);
    }

    const buffer = ExcelGenerator.generateClientReport(clients, type);
    const filename = `clients-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Export client report as PDF
 */
export async function exportClientReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    const grade = String(req.query.grade || '').trim().toUpperCase();

    if (!['active', 'inactive', 'grade'].includes(type)) {
      throw new BadRequestError('Report type must be one of active, inactive, or grade.');
    }

    let clients: any[] = [];

    if (isMongoActive()) {
      logger.info(`Exporting client report to PDF from MongoDB: ${type}`);
      const queryObj: any = {};
      if (type === 'active' || type === 'inactive') {
        queryObj.status = type;
      }
      if (type === 'grade' && grade) {
        queryObj.grade = grade;
      }

      const results = await ClientModel.find(queryObj).sort({ createdAt: -1 });
      clients = results.map(normalizeClientForReport);
    } else {
      logger.info(`Exporting client report to PDF from memory sandbox: ${type}`);
      let items = [...mockDb.clients];
      if (type === 'active' || type === 'inactive') {
        items = items.filter((client) => client.status === type);
      }
      if (type === 'grade' && grade) {
        items = items.filter((client) => client.grade === grade);
      }
      clients = items.map(normalizeClientForReport);
    }

    const buffer = await PDFGenerator.generateClientReport(clients, type);
    const filename = `clients-${type}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Export pending fees report as Excel
 */
export async function exportFeeReportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    if (!['government-pending', 'professional-pending'].includes(type)) {
      throw new BadRequestError('Fee report type must be government-pending or professional-pending.');
    }

    const expectedFeeType = type === 'government-pending' ? 'government' : 'professional';
    const pendingInvoices: any[] = [];

    if (isMongoActive()) {
      logger.info(`Exporting pending fee report to Excel from MongoDB: ${type}`);
      const invoices = await InvoiceModel.find({ status: { $nin: ['Paid', 'Void'] } }).sort({ dueDate: 1 }).lean();
      const payments = await PaymentModel.find({}).lean();

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = await ClientModel.findById(invoice.clientId).select('name pan');
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    } else {
      logger.info(`Exporting pending fee report to Excel from memory sandbox: ${type}`);
      const invoices = [...mockDb.invoices].filter(inv => inv.status !== 'Paid' && inv.status !== 'Void');

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = mockDb.clients.find(c => c._id === invoice.clientId);
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, mockDb.payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    }

    const buffer = ExcelGenerator.generateFeeReport(pendingInvoices, type);
    const filename = `pending-fees-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Export pending fees report as PDF
 */
export async function exportFeeReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const type = String(req.query.type || '').trim();
    if (!['government-pending', 'professional-pending'].includes(type)) {
      throw new BadRequestError('Fee report type must be government-pending or professional-pending.');
    }

    const expectedFeeType = type === 'government-pending' ? 'government' : 'professional';
    const pendingInvoices: any[] = [];

    if (isMongoActive()) {
      logger.info(`Exporting pending fee report to PDF from MongoDB: ${type}`);
      const invoices = await InvoiceModel.find({ status: { $nin: ['Paid', 'Void'] } }).sort({ dueDate: 1 }).lean();
      const payments = await PaymentModel.find({}).lean();

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = await ClientModel.findById(invoice.clientId).select('name pan');
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    } else {
      logger.info(`Exporting pending fee report to PDF from memory sandbox: ${type}`);
      const invoices = [...mockDb.invoices].filter(inv => inv.status !== 'Paid' && inv.status !== 'Void');

      for (const invoice of invoices) {
        const hasFeeType = (invoice.items || []).some((item: any) => inferFeeType(item) === expectedFeeType);
        if (!hasFeeType) continue;

        const client = mockDb.clients.find(c => c._id === invoice.clientId);
        const clientName = client ? client.name : 'Unknown Client';
        const amountDue = calculateAmountDue(invoice, mockDb.payments);

        if (amountDue <= 0) continue;
        pendingInvoices.push(buildFeeReportItem(invoice, clientName, amountDue, expectedFeeType));
      }
    }

    const buffer = await PDFGenerator.generateFeeReport(pendingInvoices, type);
    const filename = `pending-fees-${type}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
