import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary } from '../controllers/expenseController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getExpenses);
router.post('/', protect, restrictTo('Admin', 'Manager'), createExpense);
router.patch('/:id', protect, restrictTo('Admin', 'Manager'), updateExpense);
router.delete('/:id', protect, restrictTo('Admin', 'Manager'), deleteExpense);
router.get('/summary', protect, getExpenseSummary);

export default router;
