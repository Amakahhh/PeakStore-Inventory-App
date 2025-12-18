"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const router = (0, express_1.Router)();
router.get('/', customerController_1.getCustomers);
router.post('/', customerController_1.createCustomer);
router.get('/:id/history', customerController_1.getCustomerHistory);
exports.default = router;
