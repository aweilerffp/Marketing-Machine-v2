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

  // Handle both old and new LinkedIn API response formats
  const platformUserId = profileData.sub || profileData.id;
  const firstName = profileData.given_name || profileData.firstName?.localized?.en_US || profileData.firstName;
  const lastName = profileData.family_name || profileData.lastName?.localized?.en_US || profileData.lastName;
  const profilePicture = profileData.picture || profileData.profilePicture;

  const connectionData = {
    userId,
    platform: 'linkedin',
    platformUserId,
    encryptedToken: encryptToken(accessToken),
    refreshToken: refreshToken ? encryptToken(refreshToken) : null,
    expiresAt,
    connectionMetadata: {
      firstName,
      lastName,
      profilePicture,
      email: profileData.email,
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
    // Use OpenID Connect userinfo endpoint
    const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid, remove connection
      await removeLinkedInConnection(userId);
      throw new Error('LinkedIn token expired');
    }
    throw error;
  }
}