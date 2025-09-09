import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { companyApi } from './services/api';
import { ContentQueue } from './components/ContentQueue';
import { BrandVoiceOnboarding } from './components/onboarding/BrandVoiceOnboarding';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { Navigation } from './components/Navigation';
import { CompanySettings } from './components/CompanySettings';
import Dashboard from './pages/Dashboard';

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

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

function SimpleLandingPage() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                Marketing Machine
              </h1>
              <p className="text-xl text-gray-600 mb-12">
                Transform your meeting insights into compelling LinkedIn content with AI-powered brand voice analysis.
              </p>
              
              <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Ready to amplify your voice?
                  </h2>
                  <p className="text-gray-600">
                    Sign in to start generating LinkedIn content from your meeting transcripts.
                  </p>
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105">
                      Get Started
                    </button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </div>
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
  const { data: company, isLoading: companyLoading, refetch: refetchCompany } = useQuery({
    queryKey: ['company'],
    queryFn: companyApi.getCurrent,
    enabled: !!user
  });


  // Check for force onboarding parameter
  const urlParams = new URLSearchParams(window.location.search);
  const forceOnboarding = urlParams.get('forceOnboarding') === 'true';
  
  // Check if user has completed onboarding
  const isOnboarded = !forceOnboarding && company && company.name && company.name !== 'temp' && company.brandVoiceData && (
    company.brandVoiceData.industry || 
    company.brandVoiceData.targetAudience || 
    company.brandVoiceData.websiteContent ||
    Object.keys(company.brandVoiceData).length > 0
  );

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="onboarding" onNavigate={() => {}} />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete Your Brand Voice Setup
            </h3>
            <p className="text-gray-600">
              Help us understand your brand voice to generate personalized LinkedIn content.
            </p>
          </div>
          <BrandVoiceOnboarding onComplete={() => {
            refetchCompany();
            // Small delay to ensure data is refreshed before checking onboarding status
            setTimeout(() => {
              refetchCompany();
            }, 1000);
          }} />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'content':
        return (
          <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Queue</h1>
            <ContentQueue />
          </div>
        );
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

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<SimpleLandingPage />} />
              </Routes>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;