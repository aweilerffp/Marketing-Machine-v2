import { requireAuth as clerkRequireAuth } from '@clerk/express';

// Secure development configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const ALLOW_AUTH_BYPASS = process.env.ALLOW_AUTH_BYPASS === 'true';
const DEV_USER_ID = process.env.DEV_USER_ID || 'dev_user_123';

// Validate required environment variables
if (isDevelopment && !process.env.CLERK_SECRET_KEY && !ALLOW_AUTH_BYPASS) {
  console.error('🚨 SECURITY ERROR: Missing CLERK_SECRET_KEY in development. Set ALLOW_AUTH_BYPASS=true only for local testing.');
  process.exit(1);
}

// Middleware that requires authentication
export const requireAuth = (req, res, next) => {
  // Controlled development bypass - requires explicit environment flag
  if (isDevelopment && ALLOW_AUTH_BYPASS) {
    console.warn('⚠️  AUTH BYPASS ENABLED - DEVELOPMENT ONLY');
    console.warn('⚠️  This should NEVER be enabled in production!');
    req.auth = { userId: DEV_USER_ID };
    return next();
  }
  
  // Production-ready authentication
  try {
    return clerkRequireAuth()(req, res, next);
  } catch (error) {
    console.error('Clerk authentication error:', error.message);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

// Helper to get user info from authenticated request
export const getUserFromRequest = (req) => {
  if (!req.auth || !req.auth.userId) {
    throw new Error('User not authenticated');
  }
  return {
    clerkId: req.auth.userId,
    ...req.auth
  };
};

// Helper to get user ID from authenticated request
export const getUserId = (req) => {
  if (!req.auth || !req.auth.userId) {
    throw new Error('User not authenticated');
  }
  return req.auth.userId;
};