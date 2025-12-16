import { Router } from 'express';
import { getAccountBalances, transferFunds, getProfitStats } from '../controllers/financeController';
import { getAccounts, createAccount, deleteAccount } from '../controllers/accountController';

const router = Router();

// Account Management
router.get('/', getAccounts);
router.post('/', createAccount);
router.delete('/:id', deleteAccount);

// Financials
router.get('/balances', getAccountBalances);
router.get('/profit', getProfitStats);
router.post('/transfer', transferFunds);

export default router;
