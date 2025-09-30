import axios from 'axios';
import prisma from '../../models/prisma.js';
import { encryptToken, decryptToken } from '../encryption.js';

/**
 * Save LinkedIn connection for a user
 * @param {string} userId - User ID
 * @param {string} accessToken - LinkedIn access token
 * @param {number} expiresIn - Token expiration in seconds
 * @param {string} refreshToken - Optional refresh token
 * @param {object} profileData - LinkedIn profile data
 */
export async function saveLinkedInConnection(userId, accessToken, expiresIn, refreshToken = null, profileData = {}) {
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));

  const connectionData = {
    userId,
    platform: 'linkedin',
    platformUserId: profileData.id,
    encryptedToken: encryptToken(accessToken),
    refreshToken: refreshToken ? encryptToken(refreshToken) : null,
    expiresAt,
    connectionMetadata: {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      profilePicture: profileData.profilePicture,
      connectedAt: new Date().toISOString()
    }
  };

  // Upsert connection (update if exists, create if not)
  return await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: 'linkedin'
      }
    },
    update: {
      encryptedToken: connectionData.encryptedToken,
      refreshToken: connectionData.refreshToken,
      expiresAt: connectionData.expiresAt,
      connectionMetadata: connectionData.connectionMetadata,
      updatedAt: new Date()
    },
    create: connectionData
  });
}

/**
 * Get LinkedIn connection for a user
 * @param {string} userId - User ID
 * @returns {object|null} - Connection data with decrypted token
 */
export async function getLinkedInConnection(userId) {
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'linkedin'
      }
    }
  });

  if (!connection) return null;

  // Check if token is expired
  if (connection.expiresAt && connection.expiresAt < new Date()) {
    console.log('LinkedIn token expired for user:', userId);
    return null;
  }

  return {
    ...connection,
    accessToken: decryptToken(connection.encryptedToken),
    refreshTokenDecrypted: connection.refreshToken ? decryptToken(connection.refreshToken) : null
  };
}

/**
 * Check if user has active LinkedIn connection
 * @param {string} userId - User ID
 * @returns {boolean} - Whether user has valid LinkedIn connection
 */
export async function hasLinkedInConnection(userId) {
  const connection = await getLinkedInConnection(userId);
  return !!connection?.accessToken;
}

/**
 * Remove LinkedIn connection for a user
 * @param {string} userId - User ID
 */
export async function removeLinkedInConnection(userId) {
  return await prisma.platformConnection.delete({
    where: {
      userId_platform: {
        userId,
        platform: 'linkedin'
      }
    }
  });
}

/**
 * Get LinkedIn profile data using stored token
 * @param {string} userId - User ID
 * @returns {object} - LinkedIn profile data
 */
export async function getLinkedInProfile(userId) {
  const connection = await getLinkedInConnection(userId);

  if (!connection?.accessToken) {
    throw new Error('No LinkedIn connection found');
  }

  try {
    const response = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired, remove connection
      await removeLinkedInConnection(userId);
      throw new Error('LinkedIn token expired');
    }
    throw error;
  }
}