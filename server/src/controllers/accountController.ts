import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';


export const getAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ 
        error: 'Failed to fetch accounts',
        details: error.message,
        code: error.code
    });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { name, type, details } = req.body;
    const account = await prisma.paymentAccount.create({
      data: { name, type, details }
    });
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ 
        error: 'Failed to create account',
        details: error.message,
        code: error.code
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.paymentAccount.delete({
      where: { id }
    });
    res.json({ message: 'Account deleted' });
  } catch (error: any) {
    res.status(500).json({ 
        error: 'Failed to delete account',
        details: error.message,
        code: error.code
    });
  }
};
