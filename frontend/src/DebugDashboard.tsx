import React from 'react';
import { useAuth } from './components/auth/AuthProvider';
import ErrorBoundary from './ErrorBoundary';

function DebugDashboard() {
  const { user, isAuthenticated, getToken } = useAuth();

  const testApiCall = async () => {
    try {
      console.log('Testing API call...');
      console.log('User:', user);
      console.log('Is Authenticated:', isAuthenticated);
      
      const token = await getToken();
      console.log('Token:', token ? 'Got token' : 'No token');
      
      const response = await fetch('http://localhost:3001/api/company/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      alert(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API test error:', error);
      alert(`Error: ${error}`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Debug Dashboard
            </h1>
            
            <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication Status:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✅ User ID: {user?.id || 'Not found'}</li>
                  <li>✅ Email: {user?.email || 'Not found'}</li>
                  <li>✅ Authenticated: {isAuthenticated ? 'Yes' : 'No'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">API Test:</h3>
                <button 
                  onClick={testApiCall}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Test API Call
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will test the connection between frontend and backend.
                  Check browser console for detailed logs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Backend Status:</h3>
                <p className="text-sm">
                  Backend should be running on: 
                  <a href="http://localhost:3001/health" target="_blank" className="text-blue-600 underline ml-1">
                    http://localhost:3001/health
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default DebugDashboard;