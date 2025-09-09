import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { PrismaClient } from '@prisma/client';

// Initialize queue system
import './services/queue/index.js';

// API Routes
import webhooksRouter from './api/webhooks/index.js';
import authRouter from './api/auth/index.js';
import companyRouter from './api/company/index.js';
import contentRouter from './api/content/index.js';
import linkedinRouter from './api/linkedin/index.js';

// Load environment variables
dotenv.config();

// Initialize
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (before auth middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply Clerk middleware (proper configuration)
if (!process.env.CLERK_SECRET_KEY) {
  console.warn('⚠️ CLERK_SECRET_KEY not configured - authentication will fail');
}

// Always use Clerk middleware in production, conditionally in development
const useClerkAuth = process.env.NODE_ENV === 'production' || 
                    (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== 'your_clerk_secret_key_here');

if (useClerkAuth) {
  console.log('🔒 Clerk authentication enabled');
  app.use(clerkMiddleware());
} else {
  console.log('🚧 Development mode: Mock authentication enabled');
  // Mock auth for development
  app.use((req, res, next) => {
    req.auth = {
      userId: 'dev_user_123',
      sessionId: 'dev_session_123'
    };
    next();
  });
}

app.use('/api/webhooks', webhooksRouter);
app.use('/api/auth', authRouter);
app.use('/api/company', companyRouter);
app.use('/api/content', contentRouter);
app.use('/api/linkedin', linkedinRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Marketing Machine API running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});