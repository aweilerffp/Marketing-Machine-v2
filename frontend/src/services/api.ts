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
    if ((window as any).Clerk?.session) {
      const token = await (window as any).Clerk.session.getToken();
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
      processedStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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

export interface Meeting {
  id: string;
  readaiId: string;
  title?: string;
  summary?: string;
  processedStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processedAt?: string;
  createdAt: string;
  contentHooks: Array<{
    id: string;
    hook: string;
    pillar?: string;
    posts: Array<{
      id: string;
      content: string;
      status: string;
    }>;
  }>;
}

// API Service Functions
export interface PaginatedResponse<T> {
  posts: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface DashboardData {
  posts: ContentPost[];
  meetings: Meeting[];
  stats: {
    totalMeetings: number;
    pendingPosts: number;
    scheduledPosts: number;
    rejectedPosts: number;
    totalPosts: number;
  };
  timestamp: string;
}

export const contentApi = {
  // Get consolidated dashboard data (posts + meetings + stats)
  getDashboard: async (params?: { limit?: number }): Promise<DashboardData> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const response = await api.get(`/api/content/dashboard?${searchParams.toString()}`);
    return response.data;
  },

  // Get pending posts for approval queue with pagination
  getQueue: async (params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED';
  }): Promise<PaginatedResponse<ContentPost>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    
    const response = await api.get(`/api/content/queue?${searchParams.toString()}`);
    return response.data;
  },

  // Get all posts without pagination (backward compatibility)
  getQueueLegacy: async (): Promise<ContentPost[]> => {
    const response = await api.get('/api/content/queue?limit=1000');
    return response.data.posts || response.data;
  },

  // Update post status (approve/reject)
  updateStatus: async (postId: string, status: 'APPROVED' | 'REJECTED' | 'SCHEDULED', scheduledFor?: string): Promise<ContentPost> => {
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
  },

  // Rewrite post content with AI
  rewriteContent: async (postId: string, instructions: string): Promise<string> => {
    const response = await api.post(`/api/content/${postId}/rewrite`, {
      instructions
    });
    return response.data.rewrittenContent;
  },

  // Generate demo content
  generateDemo: async (): Promise<{
    message: string;
    meeting: { id: string; title: string; summary: string };
    postsGenerated: number;
    posts: Array<{
      id: string;
      hook: string;
      content: string;
      imagePrompt: string;
      status: string;
      createdAt: string;
    }>;
  }> => {
    const response = await api.post('/api/content/demo/generate');
    return response.data;
  },

  // Get analyzed meetings
  getMeetings: async (): Promise<Meeting[]> => {
    const response = await api.get('/api/content/meetings');
    return response.data;
  },

  // Reprocess a meeting to regenerate content
  reprocessMeeting: async (meetingId: string): Promise<{
    message: string;
    meetingId: string;
    status: string;
  }> => {
    const response = await api.post(`/api/content/meetings/${meetingId}/reprocess`);
    return response.data;
  },

  // Delete a meeting and all related content
  deleteMeeting: async (meetingId: string): Promise<{
    message: string;
    meetingId: string;
    deletedPosts: number;
    deletedHooks: number;
  }> => {
    const response = await api.delete(`/api/content/meetings/${meetingId}`);
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

  // Create company  
  create: async (companyData: Partial<Company>): Promise<Company> => {
    const response = await api.post('/api/company', companyData);
    return response.data;
  },

  // Create/update company
  upsert: async (companyData: Partial<Company>): Promise<Company> => {
    const response = await api.post('/api/company', companyData);
    return response.data;
  },

  // Delete company (for reset)
  delete: async (): Promise<void> => {
    await api.delete('/api/company');
  },

  // Update scheduling settings
  updateScheduling: async (config: any): Promise<{ message: string; postingSchedule: any }> => {
    const response = await api.put('/api/company/scheduling', config);
    return response.data;
  },

  // Webhook management
  getWebhook: async (): Promise<{
    webhookUrl: string | null;
    isActive: boolean;
    companyId?: string;
    tokenPreview?: string;
    instructions?: string;
  }> => {
    const response = await api.get('/api/company/webhook');
    return response.data;
  },

  generateWebhook: async (): Promise<{
    webhookUrl: string;
    isActive: boolean;
    companyId: string;
    tokenPreview: string;
    message: string;
  }> => {
    const response = await api.post('/api/company/webhook/generate');
    return response.data;
  },

  toggleWebhook: async (): Promise<{
    isActive: boolean;
    message: string;
  }> => {
    const response = await api.put('/api/company/webhook/toggle');
    return response.data;
  },

  // Prompt management
  getPrompt: async (): Promise<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  }> => {
    const response = await api.get('/api/company/prompt');
    return response.data;
  },

  updatePrompt: async (prompt: string): Promise<{
    prompt: string;
    lastModified: string;
    message: string;
    companyName: string;
  }> => {
    const response = await api.put('/api/company/prompt', { prompt });
    return response.data;
  },

  regeneratePrompt: async (): Promise<{
    prompt: string;
    lastGenerated: string;
    message: string;
    companyName: string;
  }> => {
    const response = await api.post('/api/company/prompt/regenerate');
    return response.data;
  },

  // Hook prompt management
  getHookPrompt: async (): Promise<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  }> => {
    const response = await api.get('/api/company/hook-prompt');
    return response.data;
  },

  updateHookPrompt: async (prompt: string): Promise<{
    prompt: string;
    lastModified: string;
    message: string;
    companyName: string;
  }> => {
    const response = await api.put('/api/company/hook-prompt', { prompt });
    return response.data;
  },

  regenerateHookPrompt: async (): Promise<{
    prompt: string;
    lastGenerated: string;
    message: string;
    companyName: string;
  }> => {
    const response = await api.post('/api/company/hook-prompt/regenerate');
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

// Note: Meeting interface is already exported above at line 63