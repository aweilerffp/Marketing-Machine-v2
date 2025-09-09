import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, handleApiError } from '../services/api';
import type { Company } from '../services/api';

// Query keys
const QUERY_KEYS = {
  company: ['company'] as const,
};

// Hook for fetching current user's company
export function useCompany() {
  return useQuery({
    queryKey: QUERY_KEYS.company,
    queryFn: companyApi.getCurrent,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

// Hook for creating/updating company
export function useUpsertCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyData: Partial<Company>) => companyApi.upsert(companyData),
    
    onSuccess: (updatedCompany) => {
      // Update the cache with the new company data
      queryClient.setQueryData(QUERY_KEYS.company, updatedCompany);
      
      // Invalidate any related queries that might depend on company data
      queryClient.invalidateQueries({ 
        queryKey: ['content'], // This will refetch content if company changes
      });
    },
    
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update company:', apiError.message);
      throw apiError;
    },
  });
}

// Helper function to check if user has completed onboarding
export function useIsOnboarded() {
  const { data: company, isLoading } = useCompany();
  
  const isOnboarded = Boolean(
    company && 
    company.name && 
    company.name !== 'temp' && 
    company.brandVoiceData && (
      company.brandVoiceData.industry || 
      company.brandVoiceData.targetAudience || 
      company.brandVoiceData.websiteContent ||
      Object.keys(company.brandVoiceData).length > 0
    )
  );
  
  return { isOnboarded, isLoading, company };
}