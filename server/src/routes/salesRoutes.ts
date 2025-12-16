import { Router } from 'express';
import { createInvoice, getDailySales, getInvoices } from '../controllers/salesController';

const router = Router();

router.get('/daily', getDailySales);
router.get('/invoices', getInvoices);
router.post('/invoice', createInvoice);

export default router;
