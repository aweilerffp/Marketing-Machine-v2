import axios from 'axios';

/**
 * Post text content to LinkedIn using UGC Posts API
 * @param {string} accessToken - LinkedIn access token
 * @param {string} personUrn - LinkedIn person URN
 * @param {string} text - Text content to post
 * @param {string} visibility - 'PUBLIC' or 'CONNECTIONS'
 * @returns {object} - Post result with LinkedIn post ID
 */
export async function postTextToLinkedIn(accessToken, personUrn, text, visibility = 'PUBLIC') {
  try {
    const postData = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility
      }
    };

    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    // Extract post ID from response headers
    const postId = response.headers['x-restli-id'] || response.data?.id;

    return {
      success: true,
      linkedinPostId: postId,
      publishedAt: new Date().toISOString(),
      message: 'Post published successfully'
    };

  } catch (error) {
    console.error('LinkedIn posting error:', error.response?.data || error);

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to post to LinkedIn',
      statusCode: error.response?.status
    };
  }
}

/**
 * Get LinkedIn person URN from profile
 * @param {string} accessToken - LinkedIn access token
 * @returns {string} - Person URN (urn:li:person:XXXXXX)
 */
export async function getLinkedInPersonUrn(accessToken) {
  try {
    // Use OpenID Connect userinfo endpoint (LinkedIn API v2)
    const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Extract person ID from 'sub' claim (format: unique-id or urn)
    const personId = response.data.sub;

    // If sub is already a URN, return it; otherwise construct one
    if (personId.startsWith('urn:')) {
      return personId;
    }

    return `urn:li:person:${personId}`;

  } catch (error) {
    console.error('Error getting LinkedIn person URN:', error.response?.data || error);
    throw new Error('Failed to get LinkedIn person URN');
  }
}

/**
 * Validate LinkedIn connection by testing API access
 * @param {string} accessToken - LinkedIn access token
 * @returns {object} - Connection status
 */
export async function validateLinkedInConnection(accessToken) {
  try {
    // Use OpenID Connect userinfo endpoint (LinkedIn API v2)
    const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return {
      connected: true,
      personId: response.data.sub,
      name: response.data.name || `${response.data.given_name || ''} ${response.data.family_name || ''}`.trim()
    };

  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        connected: false,
        error: 'Token expired or invalid'
      };
    }

    return {
      connected: false,
      error: error.response?.data?.message || 'Connection validation failed'
    };
  }
}

/**
 * Get LinkedIn API rate limit status (mock implementation)
 * Note: LinkedIn doesn't provide rate limit headers, so this is estimated
 * @param {string} accessToken - LinkedIn access token
 * @returns {object} - Rate limit status
 */
export async function getLinkedInRateLimit(accessToken) {
  // LinkedIn allows 150 posts per day per user
  // This is a mock implementation - actual rate limiting should be tracked in application
  return {
    dailyLimit: 150,
    windowStart: new Date().toISOString().split('T')[0], // Today
    used: 0, // Would need to track this in database
    remaining: 150,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}