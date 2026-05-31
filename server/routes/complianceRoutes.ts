import { Router } from 'express';
import { 
  getComplianceTemplates, 
  createComplianceTemplate,
  updateComplianceTemplate,
  deleteComplianceTemplate,
  generateEventsFromTemplate,
  getComplianceCalendar, 
  addComplianceCalendarEvent,
  triggerAutoGenerateComplianceTasks,
  simulateComplianceCron
} from '../controllers/complianceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Templates Routing API
router.get('/templates', protect, getComplianceTemplates);
router.post('/templates', protect, restrictTo('Admin', 'Manager'), createComplianceTemplate);
router.patch('/templates/:id', protect, restrictTo('Admin', 'Manager'), updateComplianceTemplate);
router.delete('/templates/:id', protect, restrictTo('Admin', 'Manager'), deleteComplianceTemplate);
router.post('/templates/:id/generate-calendar', protect, restrictTo('Admin', 'Manager'), generateEventsFromTemplate);

// Calendar Routing API
router.get('/calendar', protect, getComplianceCalendar);
router.post('/calendar', protect, restrictTo('Admin', 'Manager'), addComplianceCalendarEvent);

// Automated Generation and Cron Simulation API
router.post('/clients/:clientId/auto-generate', protect, restrictTo('Admin', 'Manager'), triggerAutoGenerateComplianceTasks);
router.post('/cron/simulate', protect, restrictTo('Admin', 'Manager'), simulateComplianceCron);

export default router;
