
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log("Connecting to DB...");
        const userCount = await prisma.user.count();
        const itemCount = await prisma.item.count();
        const saleCount = await prisma.sale.count();
        const accountCount = await prisma.paymentAccount.count();

        console.log(`Users: ${userCount}`);
        console.log(`Items: ${itemCount}`);
        console.log(`Sales: ${saleCount}`);
        console.log(`Accounts: ${accountCount}`);
    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
