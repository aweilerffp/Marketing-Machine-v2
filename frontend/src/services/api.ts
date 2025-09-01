import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests  
api.interceptors.request.use(async (config) => {
  try {
    // Get Clerk token from global Clerk instance
    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Content Post Types
export interface ContentPost {
  id: string;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  status: 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED';
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  hook: {
    id: string;
    hook: string;
    pillar?: string;
    meeting: {
      title?: string;
      createdAt: string;
    };
  };
}

export interface Company {
  id: string;
  name: string;
  brandVoiceData: any;
  contentPillars: string[];
  postingSchedule: any;
  createdAt: string;
  updatedAt: string;
}

// API Service Functions
export const contentApi = {
  // Get pending posts for approval queue
  getQueue: async (): Promise<ContentPost[]> => {
    const response = await api.get('/api/content/queue');
    return response.data;
  },

  // Update post status (approve/reject)
  updateStatus: async (postId: string, status: 'APPROVED' | 'REJECTED', scheduledFor?: string): Promise<ContentPost> => {
    const response = await api.put(`/api/content/${postId}/status`, {
      status,
      scheduledFor
    });
    return response.data;
  },

  // Update post content
  updateContent: async (postId: string, content: string): Promise<ContentPost> => {
    const response = await api.put(`/api/content/${postId}/content`, {
      content
    });
    return response.data;
  }
};

export const companyApi = {
  // Get current user's company
  getCurrent: async (): Promise<Company | null> => {
    try {
      const response = await api.get('/api/company/current');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create/update company
  upsert: async (companyData: Partial<Company>): Promise<Company> => {
    const response = await api.post('/api/company', companyData);
    return response.data;
  }
};

export const authApi = {
  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Error handling helper
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.statusText;
    return new Error(`API Error (${error.response.status}): ${message}`);
  } else if (error.request) {
    // Request was made but no response received
    return new Error('Network Error: Unable to reach server');
  } else {
    // Something else happened
    return new Error(`Request Error: ${error.message}`);
  }
};

export default api;