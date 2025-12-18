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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfitStats = exports.transferFunds = exports.getAccountBalances = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
// Get Account Balances
const getAccountBalances = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield prisma_1.default.paymentAccount.findMany({
            include: {
                invoices: { select: { totalAmount: true } }, // Money In (Sales)
                purchases: { select: { totalCost: true } }, // Money Out (Restock)
                outgoingTransactions: { select: { amount: true } }, // Money Out (Transfer/Withdrawal)
                incomingTransactions: { select: { amount: true } } // Money In (Transfer)
            }
        });
        // Calculate balances
        const accountStats = accounts.map(acc => {
            const totalSales = acc.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            const totalPurchases = acc.purchases.reduce((sum, pur) => sum + Number(pur.totalCost), 0);
            const totalOutgoing = acc.outgoingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const totalIncoming = acc.incomingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const netBalance = (totalSales + totalIncoming) - (totalPurchases + totalOutgoing);
            return Object.assign(Object.assign({}, acc), { stats: {
                    totalSales,
                    totalPurchases,
                    totalOutgoing,
                    totalIncoming,
                    netBalance
                } });
        });
        res.json(accountStats);
    }
    catch (error) {
        console.error("Balance Error:", error);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
});
exports.getAccountBalances = getAccountBalances;
// Transfer Funds (Internal or External/Withdrawal)
const transferFunds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, fromAccountId, toAccountId, amount, notes, isWithdrawal } = req.body;
        const amountDec = new client_1.Prisma.Decimal(amount);
        // Validation
        if (!fromAccountId)
            return res.status(400).json({ error: "Source account required" });
        if (amountDec.lessThanOrEqualTo(0))
            return res.status(400).json({ error: "Invalid amount" });
        if (isWithdrawal && toAccountId) {
            // Ambiguous
        }
        const transaction = yield prisma_1.default.transaction.create({
            data: {
                userId,
                fromAccountId,
                toAccountId: isWithdrawal ? null : toAccountId, // If withdrawal, no internal dest
                amount: amountDec,
                type: isWithdrawal ? 'WITHDRAWAL' : 'TRANSFER',
                description: notes
            }
        });
        res.json(transaction);
    }
    catch (error) {
        console.error("Transfer Error:", error);
        res.status(500).json({ error: 'Transfer failed' });
    }
});
exports.transferFunds = transferFunds;
// Get Profit Stats
const getProfitStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const sales = yield prisma_1.default.sale.findMany({
            where: dateFilter,
            select: {
                totalAmount: true,
                costPriceAtTime: true,
                quantity: true
            }
        });
        let totalRevenue = 0;
        let totalCost = 0;
        sales.forEach(sale => {
            totalRevenue += Number(sale.totalAmount);
            totalCost += (Number(sale.costPriceAtTime) * sale.quantity);
        });
        const totalProfit = totalRevenue - totalCost;
        res.json({
            totalRevenue,
            totalCost,
            totalProfit,
            margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
        });
    }
    catch (error) {
        console.error("Profit Stats Error:", error);
        res.status(500).json({ error: 'Failed to calculate profit' });
    }
});
exports.getProfitStats = getProfitStats;
