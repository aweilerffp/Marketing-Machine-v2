import { clerkClient } from '@clerk/clerk-sdk-node';
import crypto from 'crypto';
import prisma from '../../models/prisma.js';

/**
 * Authentication service implementing the interface contracts
 */
export class AuthService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get encrypted LinkedIn token for user
   */
  async getLinkedInToken(userId) {
    try {
      const tokenRecord = await prisma.platformToken.findFirst({
        where: {
          userId: userId,
          platform: 'linkedin'
        }
      });

      if (!tokenRecord || this.isTokenExpired(tokenRecord)) {
        return null;
      }

      return this.decryptToken(tokenRecord.encryptedToken);
    } catch (error) {
      console.error('Error getting LinkedIn token:', error);
      return null;
    }
  }

  /**
   * Get current user from Clerk session
   */
  async getCurrentUser(clerkUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: { company: true }
      });

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated via Clerk
   */
  async isAuthenticated(req) {
    try {
      const { userId } = req.auth || {};
      return !!userId;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Store encrypted LinkedIn token
   */
  async storeEncryptedToken(userId, token, expiresAt = null) {
    try {
      const encryptedToken = this.encryptToken(token);
      
      await prisma.platformToken.upsert({
        where: {
          userId_platform: {
            userId: userId,
            platform: 'linkedin'
          }
        },
        update: {
          encryptedToken: encryptedToken,
          expiresAt: expiresAt,
          updatedAt: new Date()
        },
        create: {
          userId: userId,
          platform: 'linkedin',
          encryptedToken: encryptedToken,
          expiresAt: expiresAt
        }
      });

      console.log('✅ LinkedIn token stored for user:', userId);
    } catch (error) {
      console.error('Error storing encrypted token:', error);
      throw error;
    }
  }

  /**
   * Validate Clerk session
   */
  async validateClerkSession(sessionToken) {
    try {
      const session = await clerkClient.sessions.getSession(sessionToken);
      return session && session.status === 'active';
    } catch (error) {
      console.error('Error validating Clerk session:', error);
      return false;
    }
  }

  /**
   * Encrypt token for secure storage
   */
  encryptToken(token) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt token for use
   */
  decryptToken(encryptedToken) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(tokenRecord) {
    if (!tokenRecord.expiresAt) return false;
    return new Date() > new Date(tokenRecord.expiresAt);
  }
}

// Export singleton instance
export const authService = new AuthService();