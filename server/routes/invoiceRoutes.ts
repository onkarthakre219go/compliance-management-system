import { Router } from 'express';
import { getInvoices, createInvoice, addPayment, getExpenses, createExpense } from '../controllers/invoiceController';
import { getInvoicePdf } from '../controllers/invoicePdfController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { sendInvoice } from '../controllers/invoiceSendController';

const router = Router();

router.get('/', protect, getInvoices);
router.post('/', protect, restrictTo('Admin', 'Manager'), createInvoice);
router.post('/:id/payments', protect, restrictTo('Admin', 'Manager'), addPayment);
router.get('/:id/pdf', protect, getInvoicePdf);
router.post('/:id/send', protect, restrictTo('Admin', 'Manager'), sendInvoice);

router.get('/expenses', protect, getExpenses);
router.post('/expenses', protect, createExpense);

export default router;
