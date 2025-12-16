import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';


export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { 
        name, category, 
        wholesalePrice, retailPrice, rollPrice,
        wholesaleQuantity, 
        rollsPerCarton, unitsPerRoll, retailPerCarton, // Configuration
        currentStockCartons, currentStockRolls, currentStockUnits 
    } = req.body;
    
    // Auto-calculate retailPerCarton if possible (for consistency)
    const calcRetailPerCarton = (Number(rollsPerCarton) || 0) * (Number(unitsPerRoll) || 0);
    const finalRetailPerCarton = calcRetailPerCarton > 0 ? calcRetailPerCarton : Number(retailPerCarton || 1);

    const item = await prisma.item.create({
      data: {
        name,
        category,
        wholesalePrice: new Prisma.Decimal(wholesalePrice),
        retailPrice: new Prisma.Decimal(retailPrice),
        rollPrice: new Prisma.Decimal(rollPrice || 0),
        costPrice: new Prisma.Decimal(req.body.costPrice || 0),
        
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Handle decimal conversions
        if (data.wholesalePrice) data.wholesalePrice = new Prisma.Decimal(data.wholesalePrice);
        if (data.retailPrice) data.retailPrice = new Prisma.Decimal(data.retailPrice);
        if (data.rollPrice) data.rollPrice = new Prisma.Decimal(data.rollPrice);
        if (data.costPrice) data.costPrice = new Prisma.Decimal(data.costPrice);
        
        const item = await prisma.item.update({
            where: { id },
            data,
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const updatePrice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newWholesale, newRetail, userId } = req.body;
        
        const item = await prisma.item.findUnique({ where: { id } });
        if (!item) {
             res.status(404).json({ error: 'Item not found' });
             return;
        }

        // Transaction: Update Item + Create History Log
        const result = await prisma.$transaction([
            prisma.item.update({
                where: { id },
                data: {
                    wholesalePrice: new Prisma.Decimal(newWholesale),
                    retailPrice: new Prisma.Decimal(newRetail)
                }
            }),
            prisma.priceHistory.create({
                data: {
                    itemId: id,
                    oldWholesale: item.wholesalePrice,
                    newWholesale: new Prisma.Decimal(newWholesale),
                    oldRetail: item.retailPrice,
                    newRetail: new Prisma.Decimal(newRetail),
                    changedBy: userId || 'system'
                }
            })
        ]);

        res.json(result[0]); // Return updated item
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update price' });
    }
};

export const restockItem = async (req: Request, res: Response) => {
    try {
        const { itemId, userId, quantity, unitType, costPrice, paymentAccountId, notes } = req.body;
        // unitType: WHOLESALE (Carton) | ROLL
        
        const item = await prisma.item.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const qty = Number(quantity);
        const inputCost = new Prisma.Decimal(costPrice);
        const totalCost = inputCost.mul(qty);

        // Normalize Cost Price (Update Master Cost to be Cost Per Retail Unit)
        let normalizedUnitCost = item.costPrice; // Fallback to existing
        
        if (unitType === 'WHOLESALE') {
             const unitsInCarton = item.rollsPerCarton > 0 
                                     ? (item.rollsPerCarton * item.unitsPerRoll) 
                                     : item.retailPerCarton;
             if (unitsInCarton > 0) normalizedUnitCost = inputCost.div(unitsInCarton);
        } else if (unitType === 'ROLL') {
             if (item.unitsPerRoll > 0) normalizedUnitCost = inputCost.div(item.unitsPerRoll);
        } else {
             normalizedUnitCost = inputCost;
        }

        // Transaction: Create Purchase & Update Stock
        const result = await prisma.$transaction([
            prisma.purchase.create({
                data: {
                    itemId, userId, quantity: qty, unitType, costPrice: inputCost, totalCost,
                    paymentAccountId: paymentAccountId || null,
                    notes
                }
            }),
            prisma.item.update({
                where: { id: itemId },
                data: {
                    // Update appropriate stock level
                    currentStockCartons: unitType === 'WHOLESALE' ? { increment: qty } : undefined,
                    currentStockRolls: unitType === 'ROLL' ? { increment: qty } : undefined,
                    costPrice: normalizedUnitCost // Update master cost price
                }
            })
        ]);

        res.json(result);
    } catch (error) {
        console.error("Restock Error:", error);
        res.status(500).json({ error: 'Failed to restock item' });
    }
};
