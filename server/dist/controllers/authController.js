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
exports.getMe = exports.syncUser = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Note: Most auth (login/signup) happens on client side with Supabase Auth.
// This controller is for syncing users to our DB or admin actions.
const syncUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, email, name, role } = req.body;
        if (!id || !email) {
            res.status(400).json({ error: 'Missing required fields' });
            return; // Ensure void return
        }
        const user = yield prisma_1.default.user.upsert({
            where: { id: id },
            update: { email, name, role },
            create: { id, email, name, role: role || 'STAFF' },
        });
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});
exports.syncUser = syncUser;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // In a real app, middleware would extract user from token
    // For now, valid connection test
    res.json({ message: "Auth endpoint working" });
});
exports.getMe = getMe;
