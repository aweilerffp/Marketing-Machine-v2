import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// Simple working version to test each piece
function SimpleApp() {
  return (
    <ErrorBoundary>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🎉 App is Loading Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                This simplified version works. Now we'll add features step by step.
              </p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
                onClick={() => alert('Button works!')}
              >
                Test Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default SimpleApp;