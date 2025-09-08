import { requireAuth as clerkRequireAuth } from '@clerk/express';

// Development bypass for testing
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEV_USER_ID = 'dev-test-user-id';

// Middleware that requires authentication
export const requireAuth = (req, res, next) => {
  // Development bypass when using mock authentication
  if (isDevelopment && process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here') {
    console.log('🚧 Development mode: Bypassing Clerk authentication');
    req.auth = { userId: 'dev_user_123' };
    return next();
  }
  
  try {
    // Use actual Clerk authentication
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