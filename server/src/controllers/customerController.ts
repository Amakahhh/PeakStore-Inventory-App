import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all customers (with optional search)
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    });
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Create a new customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, address } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Customer name is required' });
      return;
    }
    
    // Check for duplicate phone if provided
    if (phone) {
        const existing = await prisma.customer.findUnique({ where: { phone } });
        if (existing) {
             res.status(400).json({ error: 'Customer with this phone number already exists' });
             return;
        }
    }
    
    const customer = await prisma.customer.create({
      data: { name, phone, email, address }
    });
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Get single customer history
export const getCustomerHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const customer = await prisma.customer.findUnique({
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
    } catch (error) {
        console.error('Error fetching customer history:', error);
        res.status(500).json({ error: 'Error fetching history' });
    }
}
