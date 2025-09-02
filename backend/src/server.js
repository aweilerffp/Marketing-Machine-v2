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
    : 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (before auth middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply Clerk middleware conditionally
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment && process.env.CLERK_PUBLISHABLE_KEY === 'pk_test_valid_key_placeholder') {
  console.log('🚧 Development mode: Skipping Clerk middleware initialization');
  // Add a simple middleware that sets auth to null for dev mode
  app.use((req, res, next) => {
    req.auth = null;
    next();
  });
} else {
  app.use(clerkMiddleware());
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