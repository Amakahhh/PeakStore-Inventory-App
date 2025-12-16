"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salesController_1 = require("../controllers/salesController");
const router = (0, express_1.Router)();
router.get('/daily', salesController_1.getDailySales);
router.get('/invoices', salesController_1.getInvoices);
router.post('/invoice', salesController_1.createInvoice);
exports.default = router;
