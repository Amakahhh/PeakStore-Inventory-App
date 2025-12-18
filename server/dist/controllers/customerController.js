"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerHistory = exports.createCustomer = exports.getCustomers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all customers (with optional search)
const getCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        const customers = yield prisma.customer.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { invoices: true }
                }
            }
        });
        res.json(customers);
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});
exports.getCustomers = getCustomers;
// Create a new customer
const createCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Customer name is required' });
            return;
        }
        // Check for duplicate phone if provided
        if (phone) {
            const existing = yield prisma.customer.findUnique({ where: { phone } });
            if (existing) {
                res.status(400).json({ error: 'Customer with this phone number already exists' });
                return;
            }
        }
        const customer = yield prisma.customer.create({
            data: { name, phone, email, address }
        });
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});
exports.createCustomer = createCustomer;
// Get single customer history
const getCustomerHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const customer = yield prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sales: {
                            include: { item: true }
                        }
                    }
                }
            }
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json(customer);
    }
    catch (error) {
        console.error('Error fetching customer history:', error);
        res.status(500).json({ error: 'Error fetching history' });
    }
});
exports.getCustomerHistory = getCustomerHistory;
