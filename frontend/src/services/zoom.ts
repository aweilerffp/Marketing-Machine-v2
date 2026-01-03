import { api } from './api';

export interface ZoomProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  pic_url?: string;
  account_id?: string;
}

export interface ZoomStatus {
  connected: boolean;
  profile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    connectedAt?: string;
  } | null;
  expiresAt?: string | null;
}

export interface ZoomConnectionResponse {
  success: boolean;
  expiresIn: number;
  profile: {
    name: string;
    email: string;
    id: string;
  };
}

export const zoomApi = {
  // Get Zoom OAuth authorization URL
  async getAuthUrl(): Promise<{ authUrl: string; state: string }> {
    console.log('🔗 Making API call to /api/zoom/auth');
    const response = await api.get('/api/zoom/auth');
    console.log('🔗 API response:', response.data);
    return response.data;
  },

  // Handle OAuth callback with authorization code
  async handleCallback(code: string, state?: string): Promise<ZoomConnectionResponse> {
    const response = await api.post('/api/zoom/callback', { code, state });
    return response.data;
  },

  // Get Zoom connection status
  async getStatus(): Promise<ZoomStatus> {
    const response = await api.get('/api/zoom/status');
    return response.data;
  },

  // Get Zoom profile (test connection)
  async getProfile(): Promise<ZoomProfile> {
    const response = await api.get('/api/zoom/profile');
    return response.data;
  },

  // Disconnect Zoom account
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/api/zoom/disconnect');
    return response.data;
  },

  // Helper to open Zoom OAuth popup
  openOAuthPopup(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        'zoom-oauth',
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

        if (event.data?.type === 'ZOOM_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          resolve(event.data.code);
        } else if (event.data?.type === 'ZOOM_OAUTH_ERROR') {
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
