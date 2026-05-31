import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.post('/read-all', protect, markAllAsRead);

export default router;
