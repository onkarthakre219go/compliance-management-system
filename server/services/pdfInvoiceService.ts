import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { mockDb } from '../config/mockDb';
import { isDbConnected } from '../config/db';
import InvoiceModel from '../models/Invoice';

function formatINR(amount: number) {
  return `INR ${amount.toFixed(2)}`;
}

export async function streamInvoicePdf(invoiceId: string, res: any) {
  // Retrieve invoice either from Mongo or mock DB
  let invoice: any = null;
  if (isDbConnected) {
    invoice = await InvoiceModel.findById(invoiceId).lean();
  } else {
    invoice = mockDb.invoices.find((i: any) => i._id === invoiceId);
  }

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber || invoice._id}.pdf"`);

  doc.pipe(res);

  // Company Header
  const logoPath = path.join(process.cwd(), 'assets', 'company_logo.png');
  if (fs.existsSync(logoPath)) {
    try { doc.image(logoPath, 50, 45, { width: 120 }); } catch (e) {}
  }

  doc.fontSize(20).text('Your Company Name', 200, 50, { align: 'right' });
  doc.fontSize(10).text('123 Business Street', { align: 'right' });
  doc.text('City, State, PIN', { align: 'right' });
  doc.text('GSTIN: 12ABCDE3456F7Z8', { align: 'right' });

  // Invoice header
  doc.moveDown(2);
  doc.fontSize(16).text('TAX INVOICE', { align: 'center' });
  doc.moveDown(0.5);

  const leftTop = 150;
  // Client block
  const client = (invoice.clientName) ? { name: invoice.clientName, pan: invoice.clientPan } : null;
  doc.fontSize(10).text('Bill To:', 50, leftTop);
  if (client) {
    doc.font('Helvetica-Bold').text(client.name, 50, leftTop + 15);
    doc.font('Helvetica').text(`PAN: ${client.pan || ''}`, 50, leftTop + 30);
  } else if (invoice.clientId) {
    doc.font('Helvetica-Bold').text(invoice.clientId, 50, leftTop + 15);
  }

  // Invoice meta
  const metaX = 350;
  doc.font('Helvetica-Bold').text('Invoice #:', metaX, leftTop + 0);
  doc.font('Helvetica').text(invoice.invoiceNumber || invoice._id, metaX + 80, leftTop + 0);
  doc.font('Helvetica-Bold').text('Issue Date:', metaX, leftTop + 15);
  doc.font('Helvetica').text(new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString(), metaX + 80, leftTop + 15);
  doc.font('Helvetica-Bold').text('Due Date:', metaX, leftTop + 30);
  doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString(), metaX + 80, leftTop + 30);

  doc.moveDown(4);

  // Table headers
  const tableTop = 260;
  doc.fontSize(10);
  doc.text('Description', 50, tableTop);
  doc.text('Amount', 450, tableTop, { width: 90, align: 'right' });

  let y = tableTop + 20;
  const items = invoice.items || [];
  items.forEach((it: any, idx: number) => {
    doc.font('Helvetica').text(it.description || `Item ${idx+1}`, 50, y);
    doc.text(formatINR(Number(it.amount || 0)), 450, y, { width: 90, align: 'right' });
    y += 20;
  });

  // Totals
  y += 10;
  doc.font('Helvetica-Bold').text('Subtotal', 350, y);
  doc.font('Helvetica').text(formatINR(Number(invoice.subtotal || 0)), 450, y, { width: 90, align: 'right' });
  y += 18;
  doc.font('Helvetica-Bold').text(`GST (${invoice.items && invoice.items[0] ? invoice.items[0].gstRate : 18}%)`, 350, y);
  doc.font('Helvetica').text(formatINR(Number(invoice.gstAmount || 0)), 450, y, { width: 90, align: 'right' });
  y += 18;
  doc.font('Helvetica-Bold').text('Total', 350, y);
  doc.font('Helvetica').text(formatINR(Number(invoice.totalAmount || 0)), 450, y, { width: 90, align: 'right' });

  // Footer / Notes
  doc.moveDown(4);
  doc.fontSize(9).text(invoice.notes || '', 50, y + 40);

  doc.end();
}

export async function generateInvoicePdfBuffer(invoiceId: string): Promise<Buffer> {
  // Retrieve invoice either from Mongo or mock DB
  let invoice: any = null;
  if (isDbConnected) {
    invoice = await InvoiceModel.findById(invoiceId).lean();
  } else {
    invoice = mockDb.invoices.find((i: any) => i._id === invoiceId);
  }

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Company Header
    const logoPath = path.join(process.cwd(), 'assets', 'company_logo.png');
    if (fs.existsSync(logoPath)) {
      try { doc.image(logoPath, 50, 45, { width: 120 }); } catch (e) {}
    }

    doc.fontSize(20).text('Your Company Name', 200, 50, { align: 'right' });
    doc.fontSize(10).text('123 Business Street', { align: 'right' });
    doc.text('City, State, PIN', { align: 'right' });
    doc.text('GSTIN: 12ABCDE3456F7Z8', { align: 'right' });

    // Invoice header
    doc.moveDown(2);
    doc.fontSize(16).text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    const leftTop = 150;
    // Client block
    const client = (invoice.clientName) ? { name: invoice.clientName, pan: invoice.clientPan } : null;
    doc.fontSize(10).text('Bill To:', 50, leftTop);
    if (client) {
      doc.font('Helvetica-Bold').text(client.name, 50, leftTop + 15);
      doc.font('Helvetica').text(`PAN: ${client.pan || ''}`, 50, leftTop + 30);
    } else if (invoice.clientId) {
      doc.font('Helvetica-Bold').text(invoice.clientId, 50, leftTop + 15);
    }

    // Invoice meta
    const metaX = 350;
    doc.font('Helvetica-Bold').text('Invoice #:', metaX, leftTop + 0);
    doc.font('Helvetica').text(invoice.invoiceNumber || invoice._id, metaX + 80, leftTop + 0);
    doc.font('Helvetica-Bold').text('Issue Date:', metaX, leftTop + 15);
    doc.font('Helvetica').text(new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString(), metaX + 80, leftTop + 15);
    doc.font('Helvetica-Bold').text('Due Date:', metaX, leftTop + 30);
    doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString(), metaX + 80, leftTop + 30);

    doc.moveDown(4);

    // Table headers
    const tableTop = 260;
    doc.fontSize(10);
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 450, tableTop, { width: 90, align: 'right' });

    let y = tableTop + 20;
    const items = invoice.items || [];
    items.forEach((it: any, idx: number) => {
      doc.font('Helvetica').text(it.description || `Item ${idx+1}`, 50, y);
      doc.text(formatINR(Number(it.amount || 0)), 450, y, { width: 90, align: 'right' });
      y += 20;
    });

    // Totals
    y += 10;
    doc.font('Helvetica-Bold').text('Subtotal', 350, y);
    doc.font('Helvetica').text(formatINR(Number(invoice.subtotal || 0)), 450, y, { width: 90, align: 'right' });
    y += 18;
    doc.font('Helvetica-Bold').text(`GST (${invoice.items && invoice.items[0] ? invoice.items[0].gstRate : 18}%)`, 350, y);
    doc.font('Helvetica').text(formatINR(Number(invoice.gstAmount || 0)), 450, y, { width: 90, align: 'right' });
    y += 18;
    doc.font('Helvetica-Bold').text('Total', 350, y);
    doc.font('Helvetica').text(formatINR(Number(invoice.totalAmount || 0)), 450, y, { width: 90, align: 'right' });

    // Footer / Notes
    doc.moveDown(4);
    doc.fontSize(9).text(invoice.notes || '', 50, y + 40);

    doc.end();
  });
}
