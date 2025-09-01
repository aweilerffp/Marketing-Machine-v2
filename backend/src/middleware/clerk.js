import { requireAuth as clerkRequireAuth } from '@clerk/express';

// Middleware that requires authentication
export const requireAuth = clerkRequireAuth();

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