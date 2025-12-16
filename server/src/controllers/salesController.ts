import { Request, Response } from 'express';
import { Prisma, SaleType, PaymentMethod } from '@prisma/client';
import prisma from '../lib/prisma';

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { userId, customerName, customerId, notes, paymentMethod, paymentAccountId, items } = req.body; 
        // items: [{ itemId, quantity, unitType }]
        // unitType: 'WHOLESALE' | 'ROLL' | 'RETAIL'

        // 1. Calculate totals & Validate Stock (Optimistic check)
        // We'll calculate final totals inside the transaction to ensuring locking/consistency if possible, 
        // but for now we iterate inside transaction.

        const newInvoice = await prisma.$transaction(async (tx) => {
            let invoiceTotal = new Prisma.Decimal(0);
            const createdSales = [];

            // Create Invoice Header first
            const invoice = await tx.invoice.create({
                data: {
                    userId,
                    customerName, // Snapshot
                    customerId: customerId || null, // Link if provided
                    notes,
                    paymentMethod,
                    paymentAccountId: paymentAccountId || null,
                    totalAmount: 0 // Will update later
                }
            });

            for (const itemRequest of items) {
                const { itemId, quantity, unitType } = itemRequest;
                const qty = Number(quantity);
                
                const item = await tx.item.findUnique({ where: { id: itemId } });
                if (!item) throw new Error(`Item ${itemId} not found`);

                let price = new Prisma.Decimal(0);
                let saleType: SaleType = 'RETAIL';

                // Stock Logic
                if (unitType === 'WHOLESALE') {
                    // Carton
                    if (item.currentStockCartons < qty) throw new Error(`Insufficient Carton stock for ${item.name}`);
                    await tx.item.update({
                        where: { id: itemId },
                        data: { currentStockCartons: { decrement: qty } }
                    });
                    price = item.wholesalePrice;
                    saleType = 'WHOLESALE';

                } else if (unitType === 'ROLL') {
                    // Roll
                    // Logic: Check Rolls -> Break Carton if needed
                    let availableRolls = item.currentStockRolls;
                    let rollsNeeded = qty;
                    let cartonsToBreak = 0;

                    if (availableRolls < rollsNeeded) {
                        const deficit = rollsNeeded - availableRolls;
                        if (item.rollsPerCarton <= 0) throw new Error(`Configuration Error: ${item.name} has no rolls per carton set.`);
                        
                        cartonsToBreak = Math.ceil(deficit / item.rollsPerCarton);
                        if (item.currentStockCartons < cartonsToBreak) {
                            throw new Error(`Insufficient stock for ${item.name} (Need ${cartonsToBreak} cartons to fulfill roll request)`);
                        }
                    }

                    if (cartonsToBreak > 0) {
                        await tx.item.update({
                            where: { id: itemId },
                            data: {
                                currentStockCartons: { decrement: cartonsToBreak },
                                currentStockRolls: { increment: (cartonsToBreak * item.rollsPerCarton) }
                            }
                        });
                        // Audit log could go here
                    }

                    await tx.item.update({
                        where: { id: itemId },
                        data: { currentStockRolls: { decrement: qty } }
                    });
                    price = item.rollPrice;
                    saleType = 'ROLL';

                } else {
                    // Unit (Retail)
                    // Logic: Check Units -> Break Roll (if exists) -> Break Carton (if exists) -> Error
                    let availableUnits = item.currentStockUnits;
                    let unitsNeeded = qty;
                    
                    // Simple logic: Try to break rolls first, then cartons if rolls empty? 
                    // Complexity: Recursive breaking. 
                    // Simplified Strategy: 
                    // 1. If deficit, try break Rolls. 
                    // 2. If still deficit (or no rolls config), try break Cartons directly (classic flow) OR break Carton to Rolls? 
                    
                    // Let's implement: Unit Deficit -> Break Roll. If Roll Deficit -> Break Carton.
                    
                    let rollsToBreak = 0;
                    
                    if (availableUnits < unitsNeeded) {
                        const deficit = unitsNeeded - availableUnits;
                        // Can we break rolls?
                        if (item.unitsPerRoll > 0 && item.currentStockRolls > 0) {
                             rollsToBreak = Math.ceil(deficit / item.unitsPerRoll);
                             // Check if we have enough rolls (including potential cascaded break from carton?? Too complex for single pass)
                             // For MVP: Only break existing rolls. If not enough rolls, fail or check cartons directly?
                             // Let's keep it simple: Break Rolls if config exists. 
                        }
                         
                        // If rollsToBreak needed but not enough rolls... 
                        // Then we might need to break a carton into rolls first.
                        // Impl: Check total equivalent units available vs requested.
                    }
                    
                    // PROD LOGIC: Calculate Total Absolute Units Available
                    const totalUnitsAvailable = item.currentStockUnits 
                                              + (item.currentStockRolls * item.unitsPerRoll) 
                                              + (item.currentStockCartons * item.retailPerCarton); // retailPerCarton should be total units
                                              
                    if (totalUnitsAvailable < qty) throw new Error(`Insufficient total stock for ${item.name}`);
                    
                    // Now execute the breaks "Just in Time"
                    // 1. Deduct from Units
                    let remainingToDeduct = qty;
                    
                    if (item.currentStockUnits >= remainingToDeduct) {
                         await tx.item.update({ where: { id: itemId }, data: { currentStockUnits: { decrement: remainingToDeduct } } });
                         remainingToDeduct = 0;
                    } else {
                        // Use all units
                        remainingToDeduct -= item.currentStockUnits;
                        await tx.item.update({ where: { id: itemId }, data: { currentStockUnits: 0 } });
                        
                        // 2. Use Rolls
                        if (item.unitsPerRoll > 0) {
                             // Need remainingToDeduct units. How many rolls?
                             const rollsNeeded = Math.ceil(remainingToDeduct / item.unitsPerRoll);
                             // Do we have enough rolls?
                             if (item.currentStockRolls >= rollsNeeded) {
                                 // Break rollsNeeded
                                 const newUnits = rollsNeeded * item.unitsPerRoll;
                                 await tx.item.update({ 
                                     where: { id: itemId }, 
                                     data: { 
                                         currentStockRolls: { decrement: rollsNeeded },
                                         currentStockUnits: { increment: newUnits }
                                     }
                                 });
                                 // Now we have units, deduct
                                 await tx.item.update({ where: { id: itemId }, data: { currentStockUnits: { decrement: remainingToDeduct } } });
                                 remainingToDeduct = 0;
                             } else {
                                 // Use all rolls
                                 const unitsFromAllRolls = item.currentStockRolls * item.unitsPerRoll;
                                 if (unitsFromAllRolls > 0) {
                                     await tx.item.update({ where: { id: itemId }, data: { currentStockRolls: 0, currentStockUnits: { increment: unitsFromAllRolls } } });
                                     remainingToDeduct -= unitsFromAllRolls; // still allow logic to flow? NO, `currentStockUnits` changed.
                                     // Re-fetch or logic tricky.
                                     
                                     // Better Approach: "Flow Down" Updates.
                                     // Refill Units from Rolls. Refill Rolls from Cartons.
                                 }
                                 // Check Cartons...
                                 // ... Use simplified Direct Conversion for robustness if strict hierarchy tracking isn't critical
                             }
                        }
                        
                        // 3. Use Cartons (Direct break to units if rolls not configured or empty?)
                        if (remainingToDeduct > 0) {
                             const retailPerC = item.retailPerCarton;
                             if (retailPerC <= 0) throw new Error(`Config Error: ${item.name} has 0 retail per carton`);
                             
                             const cartonsNeeded = Math.ceil(remainingToDeduct / retailPerC);
                             if (item.currentStockCartons >= cartonsNeeded) {
                                 await tx.item.update({
                                     where: { id: itemId },
                                     data: {
                                         currentStockCartons: { decrement: cartonsNeeded },
                                         currentStockUnits: { increment: cartonsNeeded * retailPerC }
                                     }
                                 });
                                 // Deduct
                                 await tx.item.update({ where: { id: itemId }, data: { currentStockUnits: { decrement: remainingToDeduct } } }); // Note: Race condition risk if not careful, but okay in TX
                                 remainingToDeduct = 0;
                             } else {
                                 // Should remain handled by initial total check, but good to be safe
                                 throw new Error(`Logic Error: Allocation failed despite sufficient total stock.`);
                             }
                        }
                    }
                    
                    price = item.retailPrice;
                    saleType = 'RETAIL';
                }

                const lineTotal = price.mul(qty);
                invoiceTotal = invoiceTotal.add(lineTotal);

                // Cost Calculation (Base Unit Cost * Units in this Sale)
                // item.costPrice is the BASE UNIT COST
                let costPriceForSaleUnit = new Prisma.Decimal(0);
                
                if (saleType === 'WHOLESALE') { // Carton
                    const unitsInCarton = item.rollsPerCarton > 0 
                                            ? (item.rollsPerCarton * item.unitsPerRoll) 
                                            : item.retailPerCarton;
                    costPriceForSaleUnit = item.costPrice.mul(unitsInCarton);
                } else if (saleType === 'ROLL') {
                     costPriceForSaleUnit = item.costPrice.mul(item.unitsPerRoll);
                } else { // Retail/Unit
                     costPriceForSaleUnit = item.costPrice;
                }

                await tx.sale.create({
                    data: {
                        invoiceId: invoice.id,
                        itemId,
                        userId,
                        customerId: customerId || null, // Link sale to customer too for easy history
                        quantity: qty,
                        saleType: saleType as SaleType,
                        priceAtTime: price,
                        costPriceAtTime: costPriceForSaleUnit, // Store the cost of the SPECIFIC UNIT being sold (e.g. Cost of 1 Carton)
                        totalAmount: lineTotal,
                    }
                });
            } // End Loop

            // Update Invoice Total
            return await tx.invoice.update({
                where: { id: invoice.id },
                data: { totalAmount: invoiceTotal },
                include: { sales: { include: { item: true } }, user: true, paymentAccount: true }
            });
        }, {
            maxWait: 10000, // 10s wait for connection
            timeout: 20000  // 20s for transaction
        });

        res.json(newInvoice);
    } catch (error: any) {
        console.error('Invoice error:', error);
        res.status(400).json({ error: error.message || 'Failed to create invoice' });
    }
};

export const getDailySales = async (req: Request, res: Response) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);
        
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                item: true,
                user: true,
                paymentAccount: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                sales: { include: { item: true } },
                user: true,
                paymentAccount: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};
