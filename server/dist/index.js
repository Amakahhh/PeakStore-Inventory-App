"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const itemRoutes_1 = __importDefault(require("./routes/itemRoutes"));
const salesRoutes_1 = __importDefault(require("./routes/salesRoutes"));
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Shop Management API is running');
});
app.use('/auth', authRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/items', itemRoutes_1.default);
app.use('/sales', salesRoutes_1.default);
app.use('/accounts', accountRoutes_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
