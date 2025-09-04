import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import ErrorBoundary from './ErrorBoundary';
import { companyApi, contentApi } from './services/api';
import { ContentQueue } from './components/ContentQueue';
import { BrandVoiceOnboarding } from './components/onboarding/BrandVoiceOnboarding';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import DebugDashboard from './DebugDashboard';

// Create a client
const queryClient = new QueryClient();

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Publishable Key")
}

function SimpleLandingPage() {
  return (
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
            <SignedOut>
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
            </SignedOut>

            <SignedIn>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Welcome back!
                  </h2>
                  <UserButton afterSignOutUrl="/" />
                </div>
                <ErrorBoundary>
                  <MainDashboard />
                </ErrorBoundary>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainDashboard() {
  const { user } = useAuth();
  
  // Get company data to check if onboarding is complete
  const { data: company, isLoading: companyLoading, refetch: refetchCompany } = useQuery({
    queryKey: ['company'],
    queryFn: companyApi.getCurrent,
    enabled: !!user
  });

  // Demo content generation mutation
  const generateDemoMutation = useMutation({
    mutationFn: contentApi.generateDemo,
    onSuccess: (data) => {
      refetchCompany();
      alert(`🎉 Demo Content Generated Successfully!\n\n` +
            `Generated ${data.postsGenerated} LinkedIn posts from: ${data.meeting.title}\n\n` +
            `Check the approval queue below to review your AI-generated content!`);
    },
    onError: (error: unknown) => {
      console.error('Demo generation error:', error);
      let errorMessage = 'Failed to generate demo content. ';
      const err = error as any;
      if (err.response) {
        errorMessage += `Server responded with ${err.response.status}: ${err.response.data?.error || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += 'Unable to reach the server. Make sure the backend is running.';
      } else {
        errorMessage += err.message || 'Unknown error occurred';
      }
      alert('❌ ' + errorMessage);
    },
  });

  const isOnboarded = company && company.name && company.brandVoiceData;
  const isGenerating = generateDemoMutation.isPending;

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
      <div className="space-y-6">
        <div className="text-center py-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Brand Voice Setup
          </h3>
          <p className="text-gray-600">
            Help us understand your brand voice to generate personalized LinkedIn content.
          </p>
        </div>
        <BrandVoiceOnboarding onComplete={() => refetchCompany()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Company Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {company.name}
        </h3>
        <p className="text-gray-600">
          Industry: {company.brandVoiceData?.industry || 'Not specified'}
        </p>
        <p className="text-gray-600">
          Target Audience: {company.brandVoiceData?.targetAudience || 'Not specified'}
        </p>
      </div>

      {/* Demo Content Generation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Demo Content
        </h3>
        <p className="text-gray-600 mb-4">
          Test your brand voice analysis with sample meeting content.
        </p>
        <button
          onClick={() => generateDemoMutation.mutate()}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
        >
          {isGenerating ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </span>
          ) : (
            'Generate Demo Content'
          )}
        </button>
      </div>

      {/* Content Approval Queue */}
      <ContentQueue />
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