import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, ContentPost, handleApiError } from '../services/api';

// Query keys
const QUERY_KEYS = {
  contentQueue: ['content', 'queue'] as const,
};

// Hook for fetching approval queue
export function useContentQueue() {
  return useQuery({
    queryKey: QUERY_KEYS.contentQueue,
    queryFn: contentApi.getQueue,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  });
}

// Hook for updating post status
export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, status, scheduledFor }: { 
      postId: string; 
      status: 'APPROVED' | 'REJECTED'; 
      scheduledFor?: string;
    }) => contentApi.updateStatus(postId, status, scheduledFor),
    
    onSuccess: (updatedPost) => {
      // Update the cache with the new post data
      queryClient.setQueryData(
        QUERY_KEYS.contentQueue,
        (oldData: ContentPost[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          );
        }
      );
    },
    
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update post status:', apiError.message);
      throw apiError;
    },
  });
}

// Hook for updating post content
export function useUpdatePostContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      contentApi.updateContent(postId, content),
    
    onSuccess: (updatedPost) => {
      // Update the cache with the new post content
      queryClient.setQueryData(
        QUERY_KEYS.contentQueue,
        (oldData: ContentPost[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          );
        }
      );
    },
    
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update post content:', apiError.message);
      throw apiError;
    },
  });
}

// Helper hook for optimistic updates
export function useOptimisticPostUpdate() {
  const queryClient = useQueryClient();

  const updatePostOptimistically = (postId: string, updates: Partial<ContentPost>) => {
    queryClient.setQueryData(
      QUERY_KEYS.contentQueue,
      (oldData: ContentPost[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(post => 
          post.id === postId ? { ...post, ...updates } : post
        );
      }
    );
  };

  const revertOptimisticUpdate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentQueue });
  };

  return { updatePostOptimistically, revertOptimisticUpdate };
}