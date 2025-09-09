import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi, type Meeting, type ContentPost } from '../services/api'

// Query keys for consistent cache management
export const QUERY_KEYS = {
  meetings: ['meetings'],
  posts: ['posts']
} as const

// Hook for fetching meetings with React Query
export function useMeetings() {
  return useQuery({
    queryKey: QUERY_KEYS.meetings,
    queryFn: contentApi.getMeetings,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 30 * 1000, // Background refresh every 30 seconds
    retry: 3,
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
      
      // Also invalidate posts since they may be related to the deleted meeting
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
    },
    onError: () => {
      // Refetch on error to ensure data consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings })
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

// Hook for fetching content posts (for Dashboard)
export function useContentQueue() {
  return useQuery({
    queryKey: QUERY_KEYS.posts,
    queryFn: contentApi.getQueue,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 30 * 1000, // Background refresh every 30 seconds
    retry: 3,
  })
}