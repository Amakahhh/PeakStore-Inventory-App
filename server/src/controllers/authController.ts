import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { supabase } from '../supabase';


// Note: Most auth (login/signup) happens on client side with Supabase Auth.
// This controller is for syncing users to our DB or admin actions.

export const syncUser = async (req: Request, res: Response) => {
    try {
        const { id, email, name, role } = req.body;
        
        if (!id || !email) {
             res.status(400).json({ error: 'Missing required fields' });
             return; // Ensure void return
        }

        const user = await prisma.user.upsert({
            where: { id: id },
            update: { email, name, role },
            create: { id, email, name, role: role || 'STAFF' },
        });

        res.status(200).json(user);
    } catch (error: any) {
        console.error('Error syncing user:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to sync user',
            details: error.message,
            code: error.code,
            meta: error.meta
        });
    }
};

export const getMe = async (req: Request, res: Response) => {
    // In a real app, middleware would extract user from token
    // For now, valid connection test
    res.json({ message: "Auth endpoint working" });
};
