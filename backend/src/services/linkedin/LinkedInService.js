import fetch from 'node-fetch';
import { authService } from '../auth/AuthService.js';

/**
 * LinkedIn API service implementing interface contracts
 */
export class LinkedInService {
  constructor() {
    this.baseUrl = 'https://api.linkedin.com/v2';
    this.rateLimitRemaining = 100; // Track rate limits
    this.rateLimitReset = Date.now() + (60 * 60 * 1000); // 1 hour from now
  }

  /**
   * Post content to LinkedIn
   */
  async postContent(content, userToken) {
    try {
      // Validate token first
      const connectionStatus = await this.validateConnection(userToken);
      if (!connectionStatus.connected) {
        throw new Error('LinkedIn connection invalid or expired');
      }

      // Get user's LinkedIn profile info
      const profile = await this.getUserProfile(userToken);
      if (!profile?.id) {
        throw new Error('Could not retrieve LinkedIn profile');
      }

      // Create the post
      const postData = {
        author: `urn:li:person:${profile.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await this.makeLinkedInAPICall('/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      // Update rate limit tracking
      this.updateRateLimits(response.headers);

      console.log('✅ Successfully posted to LinkedIn:', result.id);

      return {
        success: true,
        linkedinPostId: result.id,
        publishedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ LinkedIn posting error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate LinkedIn connection
   */
  async validateConnection(userToken) {
    try {
      const profile = await this.getUserProfile(userToken);
      
      return {
        connected: !!profile?.id,
        expiresAt: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) // 60 days
      };
    } catch (error) {
      console.error('LinkedIn connection validation error:', error);
      return {
        connected: false,
        expiresAt: new Date()
      };
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(userToken) {
    return {
      remaining: this.rateLimitRemaining,
      resetAt: new Date(this.rateLimitReset)
    };
  }

  /**
   * Get LinkedIn user profile
   */
  async getUserProfile(userToken) {
    try {
      const response = await this.makeLinkedInAPICall('/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error('Error getting LinkedIn profile:', error);
      throw error;
    }
  }

  /**
   * Make authenticated LinkedIn API call
   */
  async makeLinkedInAPICall(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Marketing-Machine/1.0',
        ...options.headers
      }
    });

    return response;
  }

  /**
   * Update rate limit tracking from response headers
   */
  updateRateLimits(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    
    if (remaining) this.rateLimitRemaining = parseInt(remaining);
    if (reset) this.rateLimitReset = parseInt(reset) * 1000; // Convert to milliseconds
  }

  /**
   * Check if we're near rate limit
   */
  isNearRateLimit() {
    return this.rateLimitRemaining < 10;
  }
}

/**
 * Mock LinkedIn service for development/testing
 */
export class MockLinkedInService {
  async postContent(content, userToken) {
    console.log('🤖 Mock LinkedIn posting:', content.text.substring(0, 50) + '...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      linkedinPostId: `mock_post_${Date.now()}`,
      publishedAt: new Date().toISOString()
    };
  }

  async validateConnection(userToken) {
    return {
      connected: true,
      expiresAt: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000))
    };
  }

  async getRateLimitStatus(userToken) {
    return {
      remaining: 100,
      resetAt: new Date(Date.now() + (60 * 60 * 1000))
    };
  }
}

// Export appropriate service based on environment
const useReal = process.env.NODE_ENV === 'production' && process.env.LINKEDIN_ENABLED === 'true';
export const linkedInService = useReal ? new LinkedInService() : new MockLinkedInService();

console.log(`🔗 LinkedIn service initialized: ${useReal ? 'REAL' : 'MOCK'} mode`);