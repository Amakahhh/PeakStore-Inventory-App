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
exports.restockItem = exports.updatePrice = exports.updateItem = exports.createItem = exports.getItems = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const getItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield prisma_1.default.item.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(items);
    }
    catch (error) {
        console.error("Failed to fetch items:", error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});
exports.getItems = getItems;
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, wholesalePrice, retailPrice, rollPrice, wholesaleQuantity, rollsPerCarton, unitsPerRoll, retailPerCarton, // Configuration
        currentStockCartons, currentStockRolls, currentStockUnits } = req.body;
        // Auto-calculate retailPerCarton if possible (for consistency)
        const calcRetailPerCarton = (Number(rollsPerCarton) || 0) * (Number(unitsPerRoll) || 0);
        const finalRetailPerCarton = calcRetailPerCarton > 0 ? calcRetailPerCarton : Number(retailPerCarton || 1);
        const item = yield prisma_1.default.item.create({
            data: {
                name,
                category,
                wholesalePrice: new client_1.Prisma.Decimal(wholesalePrice),
                retailPrice: new client_1.Prisma.Decimal(retailPrice),
                rollPrice: new client_1.Prisma.Decimal(rollPrice || 0),
                wholesaleQuantity: Number(wholesaleQuantity || 1),
                rollsPerCarton: Number(rollsPerCarton || 0),
                unitsPerRoll: Number(unitsPerRoll || 0),
                retailPerCarton: finalRetailPerCarton,
                currentStockCartons: Number(currentStockCartons || 0),
                currentStockRolls: Number(currentStockRolls || 0),
                currentStockUnits: Number(currentStockUnits || 0),
            },
        });
        res.json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});
exports.createItem = createItem;
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        // Handle decimal conversions
        if (data.wholesalePrice)
            data.wholesalePrice = new client_1.Prisma.Decimal(data.wholesalePrice);
        if (data.retailPrice)
            data.retailPrice = new client_1.Prisma.Decimal(data.retailPrice);
        if (data.rollPrice)
            data.rollPrice = new client_1.Prisma.Decimal(data.rollPrice);
        const item = yield prisma_1.default.item.update({
            where: { id },
            data,
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});
exports.updateItem = updateItem;
const updatePrice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { newWholesale, newRetail, userId } = req.body;
        const item = yield prisma_1.default.item.findUnique({ where: { id } });
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        // Transaction: Update Item + Create History Log
        const result = yield prisma_1.default.$transaction([
            prisma_1.default.item.update({
                where: { id },
                data: {
                    wholesalePrice: new client_1.Prisma.Decimal(newWholesale),
                    retailPrice: new client_1.Prisma.Decimal(newRetail)
                }
            }),
            prisma_1.default.priceHistory.create({
                data: {
                    itemId: id,
                    oldWholesale: item.wholesalePrice,
                    newWholesale: new client_1.Prisma.Decimal(newWholesale),
                    oldRetail: item.retailPrice,
                    newRetail: new client_1.Prisma.Decimal(newRetail),
                    changedBy: userId || 'system'
                }
            })
        ]);
        res.json(result[0]); // Return updated item
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update price' });
    }
});
exports.updatePrice = updatePrice;
const restockItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { itemId, userId, quantity, unitType, costPrice, paymentAccountId, notes } = req.body;
        // unitType: WHOLESALE (Carton) | ROLL
        const qty = Number(quantity);
        const cost = new client_1.Prisma.Decimal(costPrice);
        const totalCost = cost.mul(qty);
        // Transaction: Create Purchase & Update Stock
        const result = yield prisma_1.default.$transaction([
            prisma_1.default.purchase.create({
                data: {
                    itemId, userId, quantity: qty, unitType, costPrice: cost, totalCost,
                    paymentAccountId: paymentAccountId || null,
                    notes
                }
            }),
            prisma_1.default.item.update({
                where: { id: itemId },
                data: {
                    // Update appropriate stock level
                    currentStockCartons: unitType === 'WHOLESALE' ? { increment: qty } : undefined,
                    currentStockRolls: unitType === 'ROLL' ? { increment: qty } : undefined
                }
            })
        ]);
        res.json(result);
    }
    catch (error) {
        console.error("Restock Error:", error);
        res.status(500).json({ error: 'Failed to restock item' });
    }
});
exports.restockItem = restockItem;
