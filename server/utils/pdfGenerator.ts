import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
}

export class PDFGenerator {
  /**
   * Generate PDF buffer from client report data
   */
  static generateClientReport(
    data: any[],
    reportType: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Client Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`Report Type: ${reportType}`, { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

        // Summary
        const activeCount = data.filter((c) => c.status === 'active').length;
        const inactiveCount = data.filter((c) => c.status === 'inactive').length;

        doc.fontSize(11).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Clients: ${data.length}`);
        doc.text(`Active Clients: ${activeCount}`);
        doc.text(`Inactive Clients: ${inactiveCount}`);
        doc.moveDown(1);

        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 180;
        const col3 = 280;
        const col4 = 380;
        const col5 = 480;

        // Draw header background
        doc.rect(col1 - 10, tableTop, 550, 25).fill('#4472C4');

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Client Name', col1, tableTop + 5, { width: 130, height: 20 });
        doc.text('PAN', col2, tableTop + 5, { width: 100, height: 20 });
        doc.text('Status', col3, tableTop + 5, { width: 100, height: 20 });
        doc.text('Grade', col4, tableTop + 5, { width: 100, height: 20 });
        doc.text('Assigned To', col5, tableTop + 5, { width: 100, height: 20 });

        doc.moveDown(1.5);
        doc.fontSize(9).font('Helvetica').fillColor('#000000');

        // Table rows
        let rowCount = 0;
        data.forEach((client) => {
          const y = doc.y;

          // Alternate row colors
          if (rowCount % 2 === 0) {
            doc.rect(col1 - 10, y - 2, 550, 20).fill('#F0F0F0');
          }

          doc.fillColor('#000000');
          doc.text(client.name, col1, y, { width: 130, height: 20, ellipsis: true });
          doc.text(client.pan, col2, y, { width: 100, height: 20 });
          doc.text(client.status?.toUpperCase() || 'N/A', col3, y, { width: 100, height: 20 });
          doc.text(client.grade || 'N/A', col4, y, { width: 100, height: 20 });
          doc.text(client.assignedToUser?.fullName || 'Unassigned', col5, y, { width: 100, height: 20, ellipsis: true });

          doc.moveDown();
          rowCount++;

          // Add page break if needed
          if (doc.y > 750) {
            doc.addPage();
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
            doc.rect(col1 - 10, doc.y, 550, 25).fill('#4472C4');
            doc.text('Client Name', col1, doc.y + 5, { width: 130, height: 20 });
            doc.text('PAN', col2, doc.y + 5, { width: 100, height: 20 });
            doc.text('Status', col3, doc.y + 5, { width: 100, height: 20 });
            doc.text('Grade', col4, doc.y + 5, { width: 100, height: 20 });
            doc.text('Assigned To', col5, doc.y + 5, { width: 100, height: 20 });
            doc.moveDown(1.5);
            doc.fontSize(9).font('Helvetica').fillColor('#000000');
            rowCount = 0;
          }
        });

        // Footer
        doc.fontSize(8).fillColor('#666666');
        const pageCount = (doc as any).bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.text(`Page ${i + 1} of ${pageCount}`, 50, 750, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF buffer from fee report data
   */
  static generateFeeReport(
    data: any[],
    feeType: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Pending Fees Report', { align: 'center' });
        doc.moveDown(0.5);
        const feeTypeLabel = feeType
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        doc.fontSize(12).font('Helvetica').text(`Fee Type: ${feeTypeLabel}`, { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1);

        // Summary
        const totalDue = data.reduce((sum, item) => sum + Number(item.amountDue), 0);
        const totalAmount = data.reduce((sum, item) => sum + Number(item.totalAmount), 0);

        doc.fontSize(11).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total Invoices: ${data.length}`);
        doc.text(`Total Amount: ₹ ${totalAmount.toFixed(2)}`);
        doc.text(`Total Amount Due: ₹ ${totalDue.toFixed(2)}`);
        doc.moveDown(1);

        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 150;
        const col3 = 280;
        const col4 = 380;
        const col5 = 480;

        // Draw header background
        doc.rect(col1 - 10, tableTop, 550, 25).fill('#70AD47');

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Invoice No.', col1, tableTop + 5, { width: 100, height: 20 });
        doc.text('Client', col2, tableTop + 5, { width: 130, height: 20 });
        doc.text('Due Date', col3, tableTop + 5, { width: 100, height: 20 });
        doc.text('Amount Due', col4, tableTop + 5, { width: 100, height: 20 });
        doc.text('Status', col5, tableTop + 5, { width: 100, height: 20 });

        doc.moveDown(1.5);
        doc.fontSize(8).font('Helvetica').fillColor('#000000');

        // Table rows
        let rowCount = 0;
        data.forEach((item) => {
          const y = doc.y;

          // Alternate row colors
          if (rowCount % 2 === 0) {
            doc.rect(col1 - 10, y - 2, 550, 20).fill('#F9F9F9');
          }

          doc.fillColor('#000000');
          doc.text(item.invoiceNumber || 'N/A', col1, y, { width: 100, height: 20, ellipsis: true });
          doc.text(item.clientName, col2, y, { width: 130, height: 20, ellipsis: true });
          doc.text(
            item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A',
            col3,
            y,
            { width: 100, height: 20 }
          );
          doc.text(`₹ ${Number(item.amountDue).toFixed(2)}`, col4, y, { width: 100, height: 20 });
          doc.text(item.status?.toUpperCase() || 'PENDING', col5, y, { width: 100, height: 20 });

          doc.moveDown();
          rowCount++;

          // Add page break if needed
          if (doc.y > 750) {
            doc.addPage();
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
            doc.rect(col1 - 10, doc.y, 550, 25).fill('#70AD47');
            doc.text('Invoice No.', col1, doc.y + 5, { width: 100, height: 20 });
            doc.text('Client', col2, doc.y + 5, { width: 130, height: 20 });
            doc.text('Due Date', col3, doc.y + 5, { width: 100, height: 20 });
            doc.text('Amount Due', col4, doc.y + 5, { width: 100, height: 20 });
            doc.text('Status', col5, doc.y + 5, { width: 100, height: 20 });
            doc.moveDown(1.5);
            doc.fontSize(8).font('Helvetica').fillColor('#000000');
            rowCount = 0;
          }
        });

        // Footer
        doc.fontSize(8).fillColor('#666666');
        const pageCount = (doc as any).bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.text(`Page ${i + 1} of ${pageCount}`, 50, 750, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate combined summary PDF
   */
  static async generateSummaryReport(
    clientData: any[],
    feeData: any[],
    options: PDFOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Summary Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary statistics
        doc.fontSize(14).font('Helvetica-Bold').text('Key Metrics', { underline: true });
        doc.fontSize(11).font('Helvetica').moveDown(0.5);

        const totalDue = feeData.reduce((sum, item) => sum + Number(item.amountDue), 0);
        const activeClients = clientData.filter((c) => c.status === 'active').length;

        doc.text(`• Total Clients: ${clientData.length}`, { indent: 20 });
        doc.text(`• Active Clients: ${activeClients}`, { indent: 20 });
        doc.text(`• Total Pending Invoices: ${feeData.length}`, { indent: 20 });
        doc.text(`• Total Amount Due: ₹ ${totalDue.toFixed(2)}`, { indent: 20 });

        doc.moveDown(1.5);

        // Clients breakdown
        doc.fontSize(14).font('Helvetica-Bold').text('Clients by Grade', { underline: true });
        doc.fontSize(10).font('Helvetica').moveDown(0.5);

        const gradeBreakdown: { [key: string]: number } = {};
        clientData.forEach((client) => {
          const grade = client.grade || 'Ungraded';
          gradeBreakdown[grade] = (gradeBreakdown[grade] || 0) + 1;
        });

        Object.entries(gradeBreakdown).forEach(([grade, count]) => {
          doc.text(`  ${grade}: ${count}`, { indent: 20 });
        });

        doc.moveDown(1.5);

        // Fees by type
        doc.fontSize(14).font('Helvetica-Bold').text('Pending Fees by Type', { underline: true });
        doc.fontSize(10).font('Helvetica').moveDown(0.5);

        const feeTypeBreakdown: { [key: string]: { count: number; amount: number } } = {};
        feeData.forEach((item) => {
          const feeType = item.feeType || 'Professional';
          if (!feeTypeBreakdown[feeType]) {
            feeTypeBreakdown[feeType] = { count: 0, amount: 0 };
          }
          feeTypeBreakdown[feeType].count++;
          feeTypeBreakdown[feeType].amount += Number(item.amountDue);
        });

        Object.entries(feeTypeBreakdown).forEach(([type, data]) => {
          doc.text(`  ${type}: ${data.count} invoices, ₹ ${data.amount.toFixed(2)}`, { indent: 20 });
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
