import { Router } from 'express';
import { getCustomers, createCustomer, getCustomerHistory } from '../controllers/customerController';

const router = Router();

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id/history', getCustomerHistory);

export default router;
