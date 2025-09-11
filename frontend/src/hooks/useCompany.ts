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
  
  // More robust onboarding detection
  const isOnboarded = Boolean(
    company && 
    company.name && 
    company.name.trim() !== '' &&
    company.name !== 'temp' && 
    company.brandVoiceData && 
    typeof company.brandVoiceData === 'object' &&
    (
      // Check if brand voice has meaningful content
      (company.brandVoiceData.industry && company.brandVoiceData.industry.trim() !== '') ||
      (company.brandVoiceData.targetAudience && company.brandVoiceData.targetAudience.trim() !== '') ||
      (company.brandVoiceData.websiteContent && company.brandVoiceData.websiteContent.trim() !== '') ||
      (company.brandVoiceData.companyDescription && company.brandVoiceData.companyDescription.trim() !== '') ||
      Object.keys(company.brandVoiceData).filter(key => 
        company.brandVoiceData[key] && 
        typeof company.brandVoiceData[key] === 'string' && 
        company.brandVoiceData[key].trim() !== ''
      ).length > 2 // At least 3 meaningful fields
    )
  );
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Onboarding check:', {
      hasCompany: !!company,
      companyName: company?.name,
      brandVoiceData: company?.brandVoiceData,
      brandVoiceKeys: company?.brandVoiceData ? Object.keys(company.brandVoiceData) : [],
      isOnboarded
    });
  }

  // Permanent development bypass - check for localStorage flag
  const devBypass = typeof window !== 'undefined' && 
    (window.localStorage.getItem('SKIP_ONBOARDING') === 'true' ||
     window.localStorage.getItem('DEV_ONBOARDED') === 'true');
     
  if (process.env.NODE_ENV === 'development' && devBypass && company) {
    console.log('🚧 DEV: Onboarding bypassed via localStorage flag');
    return { isOnboarded: true, isLoading, company };
  }
  
  return { isOnboarded, isLoading, company };
}