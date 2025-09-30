import { api } from './api';

export interface LinkedInProfile {
  firstName?: {
    localized?: {
      en_US?: string;
    };
  };
  lastName?: {
    localized?: {
      en_US?: string;
    };
  };
  id: string;
}

export interface LinkedInStatus {
  connected: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    connectedAt?: string;
  } | null;
  expiresAt?: string | null;
}

export interface LinkedInConnectionResponse {
  success: boolean;
  expiresIn: number;
  profile: {
    name: string;
    id: string;
  };
}

export interface LinkedInPostResponse {
  success: boolean;
  linkedinPostId: string;
  publishedAt: string;
  message: string;
  visibility: string;
}

export interface LinkedInPostRequest {
  text: string;
  contentId?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export const linkedinApi = {
  // Get LinkedIn OAuth authorization URL
  async getAuthUrl(): Promise<{ authUrl: string }> {
    console.log('🔗 Making API call to /api/linkedin/auth');
    const response = await api.get('/api/linkedin/auth');
    console.log('🔗 API response:', response.data);
    return response.data;
  },

  // Handle OAuth callback with authorization code
  async handleCallback(code: string, state?: string): Promise<LinkedInConnectionResponse> {
    const response = await api.post('/api/linkedin/callback', { code, state });
    return response.data;
  },

  // Get LinkedIn connection status
  async getStatus(): Promise<LinkedInStatus> {
    const response = await api.get('/api/linkedin/status');
    return response.data;
  },

  // Get LinkedIn profile (test connection)
  async getProfile(): Promise<LinkedInProfile> {
    const response = await api.get('/api/linkedin/profile');
    return response.data;
  },

  // Disconnect LinkedIn account
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/api/linkedin/disconnect');
    return response.data;
  },

  // Post content to LinkedIn
  async postContent(postData: LinkedInPostRequest): Promise<LinkedInPostResponse> {
    const response = await api.post('/api/linkedin/post', postData);
    return response.data;
  },

  // Test LinkedIn posting
  async testPost(): Promise<LinkedInPostResponse> {
    const response = await api.post('/api/linkedin/test');
    return response.data;
  },

  // Get LinkedIn posting status
  async getPostingStatus(): Promise<{
    connected: boolean;
    expiresAt?: string;
    rateLimit: {
      dailyLimit: number;
      used: number;
      remaining: number;
      resetTime: string;
    };
    profile?: any;
    message: string;
  }> {
    const response = await api.get('/api/linkedin/status');
    return response.data;
  },

  // Helper to open LinkedIn OAuth popup
  openOAuthPopup(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        'linkedin-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Check for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed before completion'));
        }
      }, 1000);

      // Listen for popup redirect with code
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'LINKEDIN_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          resolve(event.data.code);
        } else if (event.data?.type === 'LINKEDIN_OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error || 'OAuth failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth timeout'));
      }, 300000);
    });
  }
};