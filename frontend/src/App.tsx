import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { companyApi } from './services/api';
import { ContentQueue } from './components/ContentQueue';
import { FactoryFloor } from './components/FactoryFloor';
import Onboarding from './pages/Onboarding';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { Navigation } from './components/Navigation';
import { CompanySettings } from './components/CompanySettings';
import Dashboard from './pages/Dashboard';
import LinkedInCallback from './pages/LinkedInCallback';
import ZoomCallback from './pages/ZoomCallback';
import Settings from './pages/Settings';
import StatusPage from './pages/StatusPage';

// Create a client with optimized settings for real-time data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000, // Data becomes stale after 10 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 3, // Retry failed requests 3 times
    },
  },
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isDevelopment = import.meta.env.DEV;

// In development, allow running without Clerk for testing
if (!publishableKey && !isDevelopment) {
  throw new Error("Missing Publishable Key")
}

function SimpleLandingPage() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <SignIn
            routing="path"
            path="/"
            signUpUrl="/sign-up"
          />
        </div>
      </SignedOut>

      <SignedIn>
        <ErrorBoundary>
          <MainDashboard />
        </ErrorBoundary>
      </SignedIn>
    </>
  );
}

function MainDashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Get company data to check if onboarding is complete
  // (Always call hooks in the same order - never conditionally)
  const { data: company, isLoading: companyLoading, isFetching: companyFetching, isFetched: companyFetched } = useQuery({
    queryKey: ['company'],
    queryFn: companyApi.getCurrent,
    enabled: !!user,
    staleTime: 0 // Always fetch fresh data on mount
  });

  // Add debug logging
  console.log('MainDashboard - user:', user);
  console.log('MainDashboard - company:', company);
  console.log('MainDashboard - companyLoading:', companyLoading);

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Authenticating...</span>
      </div>
    );
  }

  // Wait for company data to be fetched at least once before making onboarding decision
  // This prevents showing onboarding during the initial load
  if (!companyFetched && (companyLoading || companyFetching)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    );
  }


  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const forceOnboarding = urlParams.get('forceOnboarding') === 'true';
  const skipOnboarding = urlParams.get('skipOnboarding') === 'true';

  // Check if user has completed onboarding
  const isOnboarded = skipOnboarding || (!forceOnboarding && company && company.name && company.name !== 'temp' && company.brandVoiceData && (
    company.brandVoiceData.industry ||
    company.brandVoiceData.targetAudience ||
    company.brandVoiceData.websiteContent ||
    Object.keys(company.brandVoiceData).length > 0
  ));

  console.log('🔍 MainDashboard onboarding check:', {
    hasCompany: !!company,
    companyName: company?.name,
    hasBrandVoiceData: !!company?.brandVoiceData,
    brandVoiceKeys: company?.brandVoiceData ? Object.keys(company.brandVoiceData).length : 0,
    isOnboarded,
    skipOnboarding,
    forceOnboarding,
    companyFetched
  });

  if (!isOnboarded) {
    return (
      <Onboarding />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'factory':
        return <FactoryFloor />;
      case 'content':
        return (
          <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Queue</h1>
            <ContentQueue />
          </div>
        );
      case 'status':
        return <StatusPage />;
      case 'settings':
        return <CompanySettings onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

// Development mode component without Clerk
function DevModeApp() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
              <Route path="/auth/zoom/callback" element={<ZoomCallback />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function App() {
  // In development without Clerk key, use dev mode
  if (isDevelopment && !publishableKey) {
    return <DevModeApp />;
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey!}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<SimpleLandingPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
                <Route path="/auth/zoom/callback" element={<ZoomCallback />} />
              </Routes>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;