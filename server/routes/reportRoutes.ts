import { Router } from 'express';
import { getClientReport, getPendingFeeReport } from '../controllers/reportController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/clients', protect, restrictTo('Admin', 'Manager', 'Employee'), getClientReport);
router.get('/fees', protect, restrictTo('Admin', 'Manager', 'Employee'), getPendingFeeReport);

export default router;
