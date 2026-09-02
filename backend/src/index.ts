import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';

import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import publicRouter from './routes/public';

const app = express();
const PORT = process.env.PORT || 4000;

const upload = multer({ storage: multer.memoryStorage() });

const corsOrigins = [
  ...(process.env.CORS_ORIGIN || '').split(','),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
]
  .map((o) => o.trim())
  .filter(Boolean);

const allowOrigins = [...new Set(corsOrigins)];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowOrigins.includes('*') || allowOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message === 'File type not allowed') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CWD: ${process.cwd()}`);
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL}`);
  console.log(`KEY prefix: ${(process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(0, 20)} len ${(process.env.SUPABASE_SERVICE_ROLE_KEY || '').length}`);
});

export default app;
