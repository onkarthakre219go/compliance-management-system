import nodemailer from 'nodemailer';
import { generateInvoicePdfBuffer } from './pdfInvoiceService';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string[];
  subject: string;
  html?: string;
  invoiceId?: string;
}

function loadTemplate(name: string, context: any) {
  // Very small template engine: load HTML file and replace {{key}} occurrences
  const tplPath = path.join(process.cwd(), 'server', 'templates', `${name}.html`);
  if (!fs.existsSync(tplPath)) return context.plain || '';
  let content = fs.readFileSync(tplPath, 'utf8');
  Object.keys(context).forEach(k => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    content = content.replace(re, context[k]);
  });
  return content;
}

export async function sendInvoiceEmail(options: EmailOptions) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn('SMTP credentials not configured; email will not be sent.');
    return { success: false, message: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  // Prepare HTML template
  let html = options.html || '';
  if (options.invoiceId) {
    // minimal template context
    html = loadTemplate('invoiceEmail', { invoiceNumber: options.invoiceId, companyName: 'Your Company Name', plain: html });
  }

  // Prepare attachments (invoice PDF)
  const attachments: any[] = [];
  if (options.invoiceId) {
    try {
      const pdfBuffer = await generateInvoicePdfBuffer(options.invoiceId);
      attachments.push({ filename: `${options.invoiceId}.pdf`, content: pdfBuffer });
    } catch (err: any) {
      logger.error('Failed to generate PDF for email attachment: ' + (err.message || err));
      return { success: false, message: 'Failed to generate PDF' };
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || smtpUser,
    to: options.to.join(','),
    subject: options.subject,
    html,
    attachments
  };

  const result = await transporter.sendMail(mailOptions);
  return { success: true, info: result };
}
