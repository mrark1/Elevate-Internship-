import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import applicationsRouter from './routes/applications.js';
import certificatesRouter from './routes/certificates.js';
import adminRouter from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { config } from './config.js';
import { requireAdmin } from './middleware/auth.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.CORS_ORIGIN.split(',').map(s => s.trim()).includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ success: true, service: 'CredVault API', status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/applications', applicationsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/admin', adminRouter);
// Task 4 SRS admin-prefixed aliases. Protect the entire alias mount.
app.use('/api/admin/applications', requireAdmin, applicationsRouter);
app.use('/api/admin/certificates', requireAdmin, certificatesRouter);
app.use(notFound);
app.use(errorHandler);
