import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lifeflowRoutes from './routes/lifeflow.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'LifeFlow API', version: '2.0.0', time: new Date() });
});

// LifeFlow Phase 2 API Routes
app.use('/api', lifeflowRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Configuración robusta para servir el Frontend
const clientDistPath = path.resolve(__dirname, '../../../../client/dist'); 
const finalDistPath = fs.existsSync(clientDistPath)
  ? clientDistPath
  : path.resolve('/home/pablo/apps/lifeflow/client/dist');

if (fs.existsSync(finalDistPath)) {
  app.use(express.static(finalDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(finalDistPath, 'index.html'));
  });
}

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
