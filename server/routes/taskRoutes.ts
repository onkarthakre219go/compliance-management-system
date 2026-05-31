import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, addComment, deleteComment, addAttachment, deleteAttachment } from '../controllers/taskController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getTasks);
router.post('/', protect, restrictTo('Admin', 'Manager'), createTask);

router.get('/:id', protect, getTaskById);
router.patch('/:id', protect, updateTask);
router.delete('/:id', protect, restrictTo('Admin', 'Manager'), deleteTask);

// Comments
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// Attachments (mock upload)
router.post('/:id/attachments', protect, addAttachment);
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

export default router;
