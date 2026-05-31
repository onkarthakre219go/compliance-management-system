import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient, deleteClient, addContact, bulkImportClients } from '../controllers/clientController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { validateClient } from '../validators/clientValidator';

const router = Router();

router.get('/', protect, restrictTo('Admin', 'Manager', 'Employee'), getClients);
router.post('/', protect, restrictTo('Admin', 'Manager'), validateBody(validateClient), createClient);
router.post('/bulk-import', protect, restrictTo('Admin', 'Manager'), bulkImportClients);

router.get('/:id', protect, restrictTo('Admin', 'Manager', 'Employee'), getClientById);
router.patch('/:id', protect, restrictTo('Admin', 'Manager'), updateClient);
router.delete('/:id', protect, restrictTo('Admin', 'Manager'), deleteClient);

router.post('/:clientId/contacts', protect, restrictTo('Admin', 'Manager', 'Employee'), addContact);

export default router;
