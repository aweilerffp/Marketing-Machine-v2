import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

// Create a client
const queryClient = new QueryClient();

// Mock user for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <div data-mock-auth="true">
      {children}
    </div>
  );
}

function MainContent() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  if (!isSignedIn) {
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
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Ready to amplify your voice?
                </h2>
                <p className="text-gray-600">
                  Sign in to start generating LinkedIn content from your meeting transcripts.
                </p>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
                  onClick={() => setIsSignedIn(true)}
                >
                  Get Started (Mock Sign In)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Marketing Machine
          </h1>
          
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome back, {mockUser.firstName}!
                </h2>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  onClick={() => setIsSignedIn(false)}
                >
                  Sign Out
                </button>
              </div>

              {/* Company Setup Section */}
              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🏢 Company Setup Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Help us understand your brand voice to generate personalized LinkedIn content.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">
                  Complete Setup
                </button>
              </div>

              {/* Demo Content Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎯 Generate Demo Content
                </h3>
                <p className="text-gray-600 mb-4">
                  Test your brand voice analysis with sample meeting content.
                </p>
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg"
                  onClick={() => alert('🎉 Demo content would be generated here!\n\nBackend API: ' + (import.meta.env.VITE_API_URL || 'http://localhost:3001'))}
                >
                  Generate Demo Content
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppWithoutAuth() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainContent />} />
            </Routes>
          </Router>
        </MockAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default AppWithoutAuth;