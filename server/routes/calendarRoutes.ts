import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/calendarController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getEvents);
router.post('/', protect, restrictTo('Admin', 'Manager'), createEvent);
router.patch('/:id', protect, restrictTo('Admin', 'Manager'), updateEvent);
router.delete('/:id', protect, restrictTo('Admin', 'Manager'), deleteEvent);

export default router;
