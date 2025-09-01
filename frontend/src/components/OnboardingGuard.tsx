import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useIsOnboarded } from '../hooks/useCompany';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { isOnboarded, isLoading: companyLoading } = useIsOnboarded();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both user and company data to load
    if (!userLoaded || companyLoading) return;

    // If user is signed in but not onboarded, redirect to onboarding
    // unless they're already on the onboarding page
    if (isSignedIn && !isOnboarded && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }

    // If user is signed in and onboarded, but on onboarding page, redirect to dashboard
    if (isSignedIn && isOnboarded && location.pathname === '/onboarding') {
      navigate('/dashboard', { replace: true });
    }
  }, [isSignedIn, isOnboarded, userLoaded, companyLoading, navigate, location.pathname]);

  // Show loading while checking onboarding status
  if (!userLoaded || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}