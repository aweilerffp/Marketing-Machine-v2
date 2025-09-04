// Shared TypeScript interfaces for all streams
export declare enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED', 
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  email: string;
  clerkId: string;
}

export interface Company {
  id: string;
  name: string;
  userId: string;
  brandVoiceData: any;
  contentPillars: string;
  postingSchedule: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPost {
  id: string;
  hookId: string;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  hook: {
    id: string;
    meeting?: {
      title: string;
    };
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  getToken: () => Promise<string>;
}

export interface LinkedInService {
  postContent(content: PostContent, userToken: string): Promise<PostResult>;
  validateConnection(userToken: string): Promise<ConnectionStatus>;
  getRateLimitStatus(userToken: string): Promise<RateLimit>;
}

export interface PostContent {
  text: string;
  imagePrompt?: string;
  scheduledFor?: Date;
}

export interface PostResult {
  success: boolean;
  linkedinPostId?: string;
  error?: string;
  publishedAt?: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  expiresAt: Date;
}

export interface RateLimit {
  remaining: number;
  resetAt: Date;
}