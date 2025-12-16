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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function checkData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Connecting to DB...");
            const userCount = yield prisma.user.count();
            const itemCount = yield prisma.item.count();
            const saleCount = yield prisma.sale.count();
            const accountCount = yield prisma.paymentAccount.count();
            console.log(`Users: ${userCount}`);
            console.log(`Items: ${itemCount}`);
            console.log(`Sales: ${saleCount}`);
            console.log(`Accounts: ${accountCount}`);
        }
        catch (e) {
            console.error("Error connecting to DB:", e);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
checkData();
