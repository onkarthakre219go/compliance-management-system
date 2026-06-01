import * as XLSX from 'xlsx';
import { Readable } from 'stream';

interface ExportOptions {
  sheetName?: string;
  filename?: string;
}

export class ExcelGenerator {
  /**
   * Generate Excel buffer from client report data
   */
  static generateClientReport(
    data: any[],
    reportType: string,
    options: ExportOptions = {}
  ): Buffer {
    const sheetName = options.sheetName || 'Clients';

    // Transform data for better Excel display
    const transformedData = data.map((client) => ({
      'Client Name': client.name,
      'Trade Name': client.tradeName || 'N/A',
      'PAN': client.pan,
      'Status': client.status?.toUpperCase() || 'N/A',
      'Grade': client.grade || 'N/A',
      'Client Type': client.clientType || 'N/A',
      'Assigned To': client.assignedToUser?.fullName || 'Unassigned',
      'Created Date': client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A',
      'Tags': client.tags?.join(', ') || 'None',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Client Name
      { wch: 20 }, // Trade Name
      { wch: 15 }, // PAN
      { wch: 12 }, // Status
      { wch: 8 },  // Grade
      { wch: 15 }, // Client Type
      { wch: 20 }, // Assigned To
      { wch: 15 }, // Created Date
      { wch: 25 }, // Tags
    ];
    worksheet['!cols'] = columnWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_col(col) + '1';
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate Excel buffer from fee report data
   */
  static generateFeeReport(
    data: any[],
    feeType: string,
    options: ExportOptions = {}
  ): Buffer {
    const sheetName = options.sheetName || 'Pending Fees';

    // Transform data for better Excel display
    const transformedData = data.map((item) => ({
      'Invoice Number': item.invoiceNumber || 'N/A',
      'Client Name': item.clientName,
      'Fee Type': feeType.charAt(0).toUpperCase() + feeType.slice(1).replace('-', ' '),
      'Due Date': item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A',
      'Total Amount': `₹ ${Number(item.totalAmount).toFixed(2)}`,
      'Amount Due': `₹ ${Number(item.amountDue).toFixed(2)}`,
      'Status': item.status?.toUpperCase() || 'PENDING',
      'Item Description': item.items?.map((i: any) => i.description).join('; ') || 'N/A',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths
    const columnWidths = [
      { wch: 18 }, // Invoice Number
      { wch: 25 }, // Client Name
      { wch: 18 }, // Fee Type
      { wch: 15 }, // Due Date
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Amount Due
      { wch: 12 }, // Status
      { wch: 35 }, // Item Description
    ];
    worksheet['!cols'] = columnWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_col(col) + '1';
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '70AD47' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate combined summary Excel
   */
  static generateSummaryReport(
    clientData: any[],
    feeData: any[],
    options: ExportOptions = {}
  ): Buffer {
    const workbook = XLSX.utils.book_new();

    // Clients sheet
    const clientsTransformed = clientData.map((client) => ({
      'Name': client.name,
      'PAN': client.pan,
      'Status': client.status?.toUpperCase() || 'N/A',
      'Grade': client.grade || 'N/A',
      'Type': client.clientType || 'N/A',
    }));
    const clientSheet = XLSX.utils.json_to_sheet(clientsTransformed);
    clientSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clients');

    // Fees sheet
    const feesTransformed = feeData.map((item) => ({
      'Invoice': item.invoiceNumber,
      'Client': item.clientName,
      'Due Date': item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A',
      'Amount Due': `₹ ${Number(item.amountDue).toFixed(2)}`,
      'Status': item.status?.toUpperCase() || 'PENDING',
    }));
    const feeSheet = XLSX.utils.json_to_sheet(feesTransformed);
    feeSheet['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, feeSheet, 'Pending Fees');

    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Clients', 'Count': clientData.length },
      { 'Metric': 'Total Pending Fees', 'Count': feeData.length },
      { 'Metric': 'Total Amount Due', 'Count': `₹ ${feeData.reduce((sum, f) => sum + Number(f.amountDue), 0).toFixed(2)}` },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
