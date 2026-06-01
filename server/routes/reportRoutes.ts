import { Router } from 'express';
import {
  getClientReport,
  getPendingFeeReport,
  exportClientReportExcel,
  exportClientReportPDF,
  exportFeeReportExcel,
  exportFeeReportPDF,
} from '../controllers/reportController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Report viewing endpoints
router.get('/clients', protect, restrictTo('Admin', 'Manager', 'Employee'), getClientReport);
router.get('/fees', protect, restrictTo('Admin', 'Manager', 'Employee'), getPendingFeeReport);

// Export endpoints
router.get('/export/clients/excel', protect, restrictTo('Admin', 'Manager', 'Employee'), exportClientReportExcel);
router.get('/export/clients/pdf', protect, restrictTo('Admin', 'Manager', 'Employee'), exportClientReportPDF);
router.get('/export/fees/excel', protect, restrictTo('Admin', 'Manager', 'Employee'), exportFeeReportExcel);
router.get('/export/fees/pdf', protect, restrictTo('Admin', 'Manager', 'Employee'), exportFeeReportPDF);

export default router;
