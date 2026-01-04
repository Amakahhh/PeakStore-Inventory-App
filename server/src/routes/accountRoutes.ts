import { Router } from 'express';
import { getAccountBalances, transferFunds, getProfitStats, getShopWorth } from '../controllers/financeController';
import { getAccounts, createAccount, deleteAccount } from '../controllers/accountController';

const router = Router();

// Account Management
router.get('/', getAccounts);
router.post('/', createAccount);
router.delete('/:id', deleteAccount);

// Financials
router.get('/balances', getAccountBalances);
router.get('/profit', getProfitStats);
router.get('/worth', getShopWorth);
router.post('/transfer', transferFunds);

export default router;
