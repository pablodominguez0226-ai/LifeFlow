import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*', // Allow development frontend
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'LifeFlow API', version: '1.0.0', time: new Date() });
});

// Main API routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;
