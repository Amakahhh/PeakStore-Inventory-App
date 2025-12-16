"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController_1 = require("../controllers/financeController");
const accountController_1 = require("../controllers/accountController");
const router = (0, express_1.Router)();
// Account Management
router.get('/', accountController_1.getAccounts);
router.post('/', accountController_1.createAccount);
router.delete('/:id', accountController_1.deleteAccount);
// Financials
router.get('/balances', financeController_1.getAccountBalances);
router.post('/transfer', financeController_1.transferFunds);
exports.default = router;
