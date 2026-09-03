"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: '*', // Allow development frontend
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));
app.use(express_1.default.json());
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', name: 'LifeFlow API', version: '1.0.0', time: new Date() });
});
// Main API routes
app.use('/api', api_1.default);
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`===========================================`);
        console.log(`🚀 LifeFlow Server running on port ${PORT}`);
        console.log(`🌐 Health: http://localhost:${PORT}/health`);
        console.log(`📊 API Base: http://localhost:${PORT}/api`);
        console.log(`===========================================`);
    });
}
exports.default = app;
