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
exports.deleteAccount = exports.createAccount = exports.getAccounts = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield prisma_1.default.paymentAccount.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
exports.getAccounts = getAccounts;
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, details } = req.body;
        const account = yield prisma_1.default.paymentAccount.create({
            data: { name, type, details }
        });
        res.json(account);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});
exports.createAccount = createAccount;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.paymentAccount.delete({
            where: { id }
        });
        res.json({ message: 'Account deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
exports.deleteAccount = deleteAccount;
