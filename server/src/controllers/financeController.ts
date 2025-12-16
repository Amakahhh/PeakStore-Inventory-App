import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';


// Get Account Balances
export const getAccountBalances = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.paymentAccount.findMany({
            include: {
                invoices: { select: { totalAmount: true } }, // Money In (Sales)
                purchases: { select: { totalCost: true } },  // Money Out (Restock)
                outgoingTransactions: { select: { amount: true } }, // Money Out (Transfer/Withdrawal)
                incomingTransactions: { select: { amount: true } }  // Money In (Transfer)
            }
        });

        // Calculate balances
        const accountStats = accounts.map(acc => {
            const totalSales = acc.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            const totalPurchases = acc.purchases.reduce((sum, pur) => sum + Number(pur.totalCost), 0);
            
            const totalOutgoing = acc.outgoingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const totalIncoming = acc.incomingTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
            
            const netBalance = (totalSales + totalIncoming) - (totalPurchases + totalOutgoing);

            return {
                ...acc,
                stats: {
                    totalSales,
                    totalPurchases,
                    totalOutgoing,
                    totalIncoming,
                    netBalance
                }
            };
        });

        res.json(accountStats);
    } catch (error) {
        console.error("Balance Error:", error);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
};

// Transfer Funds (Internal or External/Withdrawal)
export const transferFunds = async (req: Request, res: Response) => {
    try {
        const { userId, fromAccountId, toAccountId, amount, notes, isWithdrawal } = req.body;
        const amountDec = new Prisma.Decimal(amount);

        // Validation
        if (!fromAccountId) return res.status(400).json({ error: "Source account required" });
        if (amountDec.lessThanOrEqualTo(0)) return res.status(400).json({ error: "Invalid amount" });

        if (isWithdrawal && toAccountId) {
            // Ambiguous
        }

        const transaction = await prisma.transaction.create({
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
    } catch (error) {
        console.error("Transfer Error:", error);
        res.status(500).json({ error: 'Transfer failed' });
    }
};
// Get Profit Stats
export const getProfitStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        const sales = await prisma.sale.findMany({
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

    } catch (error) {
        console.error("Profit Stats Error:", error);
        res.status(500).json({ error: 'Failed to calculate profit' });
    }
};
