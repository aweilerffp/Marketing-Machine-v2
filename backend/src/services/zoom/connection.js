import axios from 'axios';
import prisma from '../../models/prisma.js';
import { encryptToken, decryptToken } from '../encryption.js';

/**
 * Save Zoom connection for a user
 * @param {string} userId - User ID
 * @param {string} accessToken - Zoom access token
 * @param {string} refreshToken - Zoom refresh token
 * @param {number} expiresIn - Token expiration in seconds
 * @param {object} profileData - Zoom profile data
 */
export async function saveZoomConnection(userId, accessToken, refreshToken, expiresIn, profileData = {}) {
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));

  const connectionData = {
    userId,
    platform: 'zoom',
    platformUserId: profileData.id,
    encryptedToken: encryptToken(accessToken),
    refreshToken: encryptToken(refreshToken),
    expiresAt,
    connectionMetadata: {
      email: profileData.email,
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      accountId: profileData.account_id,
      picUrl: profileData.pic_url,
      connectedAt: new Date().toISOString()
    }
  };

  // Upsert connection (update if exists, create if not)
  return await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: 'zoom'
      }
    },
    update: {
      platformUserId: connectionData.platformUserId,
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
 * Get Zoom connection for a user (with auto-refresh if needed)
 * @param {string} userId - User ID
 * @returns {object|null} - Connection data with decrypted token
 */
export async function getZoomConnection(userId) {
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: 'zoom'
      }
    }
  });

  if (!connection) return null;

  // Check if token is expiring within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (connection.expiresAt && connection.expiresAt < fiveMinutesFromNow) {
    console.log('Zoom token expiring soon, attempting refresh for user:', userId);
    const refreshed = await refreshZoomToken(userId, connection);
    if (refreshed) {
      return refreshed;
    }
    // If refresh failed, return null (token expired)
    console.log('Zoom token refresh failed for user:', userId);
    return null;
  }

  return {
    ...connection,
    accessToken: decryptToken(connection.encryptedToken),
    refreshTokenDecrypted: connection.refreshToken ? decryptToken(connection.refreshToken) : null
  };
}

/**
 * Refresh Zoom access token using refresh token
 * @param {string} userId - User ID
 * @param {object} connection - Existing connection with encrypted tokens
 * @returns {object|null} - Updated connection with new token, or null if failed
 */
export async function refreshZoomToken(userId, connection) {
  if (!connection?.refreshToken) {
    console.error('No refresh token available for Zoom refresh');
    return null;
  }

  try {
    const refreshToken = decryptToken(connection.refreshToken);

    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    const newExpiresAt = new Date(Date.now() + (expires_in * 1000));

    // Update stored tokens
    const updatedConnection = await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        encryptedToken: encryptToken(access_token),
        refreshToken: encryptToken(refresh_token),
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      }
    });

    console.log('Zoom token refreshed successfully for user:', userId);

    return {
      ...updatedConnection,
      accessToken: access_token,
      refreshTokenDecrypted: refresh_token
    };
  } catch (error) {
    console.error('Error refreshing Zoom token:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Get valid access token for a user, refreshing if necessary
 * @param {string} userId - User ID
 * @returns {string|null} - Access token or null if unavailable
 */
export async function getZoomAccessToken(userId) {
  const connection = await getZoomConnection(userId);
  return connection?.accessToken || null;
}

/**
 * Check if user has active Zoom connection
 * @param {string} userId - User ID
 * @returns {boolean} - Whether user has valid Zoom connection
 */
export async function hasZoomConnection(userId) {
  const connection = await getZoomConnection(userId);
  return !!connection?.accessToken;
}

/**
 * Remove Zoom connection for a user
 * @param {string} userId - User ID
 */
export async function removeZoomConnection(userId) {
  try {
    return await prisma.platformConnection.delete({
      where: {
        userId_platform: {
          userId,
          platform: 'zoom'
        }
      }
    });
  } catch (error) {
    // Connection might not exist
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
}

/**
 * Get Zoom user profile using stored token
 * @param {string} userId - User ID
 * @returns {object} - Zoom user profile data
 */
export async function getZoomProfile(userId) {
  const connection = await getZoomConnection(userId);

  if (!connection?.accessToken) {
    throw new Error('No Zoom connection found');
  }

  try {
    const response = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid, try refresh one more time
      const refreshed = await refreshZoomToken(userId, await prisma.platformConnection.findUnique({
        where: { userId_platform: { userId, platform: 'zoom' } }
      }));

      if (refreshed) {
        // Retry with new token
        const retryResponse = await axios.get('https://api.zoom.us/v2/users/me', {
          headers: { 'Authorization': `Bearer ${refreshed.accessToken}` }
        });
        return retryResponse.data;
      }

      // Remove connection if refresh failed
      await removeZoomConnection(userId);
      throw new Error('Zoom token expired');
    }
    throw error;
  }
}

/**
 * Find Zoom connection by Zoom email
 * @param {string} email - Zoom user email (from webhook host_email)
 * @returns {object|null} - Connection with user and company data
 */
export async function findConnectionByZoomEmail(email) {
  // Query PlatformConnection where connectionMetadata.email matches
  const connections = await prisma.platformConnection.findMany({
    where: {
      platform: 'zoom'
    },
    include: {
      user: {
        include: {
          company: true,
          consent: true
        }
      }
    }
  });

  // Filter by email in connectionMetadata (JSON field)
  const match = connections.find(conn => {
    const metadata = conn.connectionMetadata;
    return metadata?.email?.toLowerCase() === email.toLowerCase();
  });

  return match || null;
}

/**
 * Download transcript file from Zoom
 * @param {string} downloadUrl - Zoom transcript download URL
 * @param {string} accessToken - Zoom access token
 * @returns {string} - VTT transcript content
 */
export async function downloadZoomTranscript(downloadUrl, accessToken) {
  try {
    const response = await axios.get(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'text'
    });

    return response.data;
  } catch (error) {
    console.error('Error downloading Zoom transcript:', error.response?.data || error.message);
    throw error;
  }
}
