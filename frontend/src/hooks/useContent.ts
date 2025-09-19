import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi, type Meeting, type ContentPost, type DashboardData } from '../services/api'

// Query keys for consistent cache management
export const QUERY_KEYS = {
  meetings: ['meetings'],
  posts: ['posts'],
  dashboard: ['dashboard']
} as const

// Hook for fetching meetings with React Query
export function useMeetings() {
  return useQuery({
    queryKey: QUERY_KEYS.meetings,
    queryFn: contentApi.getMeetings,
    staleTime: 10 * 60 * 1000, // Consider data stale after 10 minutes (increased)
    gcTime: 30 * 60 * 1000, // Keep in garbage collection for 30 minutes
    refetchOnWindowFocus: false, // Disable aggressive window focus refetch
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes (reduced frequency)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Hook for reprocessing meetings
export function useReprocessMeeting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (meetingId: string) => contentApi.reprocessMeeting(meetingId),
    onSuccess: (_, meetingId) => {
      // Optimistically update the meeting status
      queryClient.setQueryData(QUERY_KEYS.meetings, (oldData: Meeting[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map(meeting => 
          meeting.id === meetingId 
            ? { ...meeting, processedStatus: 'PROCESSING' as const }
            : meeting
        )
      })
      
      // Invalidate and refetch meetings after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings })
        // Also invalidate posts since new ones will be generated
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
      }, 2000)
    },
    onError: () => {
      // Refetch on error to ensure data consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings })
    }
  })
}

// Hook for deleting meetings
export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (meetingId: string) => contentApi.deleteMeeting(meetingId),
    onSuccess: (_, meetingId) => {
      // Optimistically remove the meeting from cache
      queryClient.setQueryData(QUERY_KEYS.meetings, (oldData: Meeting[] | undefined) => {
        if (!oldData) return oldData
        return oldData.filter(meeting => meeting.id !== meetingId)
      })
      
      // Also remove any posts associated with the deleted meeting from cache
      queryClient.setQueryData(QUERY_KEYS.posts, (oldPosts: any[] | undefined) => {
        if (!oldPosts) return oldPosts
        return oldPosts.filter(post => post.hook?.meetingId !== meetingId)
      })
    },
    onError: () => {
      // Refetch on error to ensure data consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
    }
  })
}

// Hook for manual cache invalidation
export function useInvalidateMeetings() {
  const queryClient = useQueryClient()
  
  return {
    invalidateMeetings: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings })
    },
    refetchMeetings: () => {
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.meetings })
    }
  }
}

// Hook for manual dashboard cache invalidation
export function useInvalidateDashboard() {
  const queryClient = useQueryClient()
  
  return {
    invalidateDashboard: () => {
      return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
    refetchDashboard: () => {
      return queryClient.refetchQueries({ queryKey: QUERY_KEYS.dashboard })
    }
  }
}

// Hook for fetching content posts (for Dashboard)
export function useContentQueue() {
  return useQuery({
    queryKey: QUERY_KEYS.posts,
    queryFn: contentApi.getQueueLegacy,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes (increased)
    gcTime: 15 * 60 * 1000, // Keep in garbage collection for 15 minutes
    refetchOnWindowFocus: false, // Disable aggressive window focus refetch
    refetchInterval: 3 * 60 * 1000, // Background refresh every 3 minutes (reduced frequency)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Hook for updating post status with optimistic updates
export function useUpdatePostStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, status, scheduledFor }: { 
      postId: string; 
      status: 'APPROVED' | 'REJECTED' | 'SCHEDULED'; 
      scheduledFor?: string;
    }) => contentApi.updateStatus(postId, status, scheduledFor),
    onMutate: async ({ postId, status, scheduledFor }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts })
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts)
      
      // Optimistically update to the new value
      queryClient.setQueryData(QUERY_KEYS.posts, (oldPosts: ContentPost[] | undefined) => {
        if (!oldPosts) return oldPosts
        return oldPosts.map(post => 
          post.id === postId 
            ? { ...post, status: status as any, scheduledFor }
            : post
        )
      })
      
      // Return a context object with the snapshotted value
      return { previousPosts }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(QUERY_KEYS.posts, context.previousPosts)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    }
  })
}

// Hook for updating post content with optimistic updates  
export function useUpdatePostContent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => 
      contentApi.updateContent(postId, content),
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts })
      
      const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts)
      
      queryClient.setQueryData(QUERY_KEYS.posts, (oldPosts: ContentPost[] | undefined) => {
        if (!oldPosts) return oldPosts
        return oldPosts.map(post => 
          post.id === postId 
            ? { ...post, content, updatedAt: new Date().toISOString() }
            : post
        )
      })
      
      return { previousPosts }
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(QUERY_KEYS.posts, context.previousPosts)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    }
  })
}

// Hook for rewriting post content
export function useRewritePostContent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, instructions }: { postId: string; instructions: string }) =>
      contentApi.rewriteContent(postId, instructions),
    // Note: No optimistic update for rewrite since we need AI response
    onSuccess: () => {
      // Invalidate posts to show any changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    }
  })
}

// Hook for consolidated dashboard data (optimized single API call)
export function useDashboardData() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => contentApi.getDashboard({ limit: 25 }),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes (increased)
    gcTime: 15 * 60 * 1000, // Keep in garbage collection for 15 minutes
    refetchOnWindowFocus: false, // Disable aggressive window focus refetch
    refetchInterval: 3 * 60 * 1000, // Background refresh every 3 minutes (reduced frequency)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Hook to extract posts from dashboard data
export function useDashboardPosts() {
  const { data, ...queryState } = useDashboardData()
  return {
    data: data?.posts || [],
    ...queryState
  }
}

// Hook to extract meetings from dashboard data  
export function useDashboardMeetings() {
  const { data, ...queryState } = useDashboardData()
  return {
    data: data?.meetings || [],
    ...queryState
  }
}

// Hook to extract stats from dashboard data
export function useDashboardStats() {
  const { data, ...queryState } = useDashboardData()
  return {
    data: data?.stats || {
      totalMeetings: 0,
      pendingPosts: 0,
      scheduledPosts: 0,
      rejectedPosts: 0,
      totalPosts: 0
    },
    ...queryState
  }
}