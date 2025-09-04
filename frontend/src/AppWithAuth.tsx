import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import ErrorBoundary from './ErrorBoundary';

// Add authentication step by step
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppContent() {
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
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-green-800">🎉 Authentication is working!</p>
                  <p className="text-green-600 text-sm mt-2">You are successfully signed in.</p>
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppWithAuth() {
  if (!publishableKey) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>⚠️ Missing Clerk Key</h1>
        <p>VITE_CLERK_PUBLISHABLE_KEY is: {publishableKey || 'undefined'}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey}>
        <AppContent />
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default AppWithAuth;