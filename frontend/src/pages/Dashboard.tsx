import { useUser } from '@clerk/clerk-react';
import { useContentQueue } from '../hooks/useContent';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useUser();
  const { data: posts = [] } = useContentQueue();

  // Calculate stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(post => post.status === 'PUBLISHED').length;
  const scheduledPosts = posts.filter(post => post.status === 'SCHEDULED').length;
  
  // Mock performance data
  const mockImpressions = 47250;
  const mockEngagementRate = 4.2;
  const mockReach = 12800;

  return (
    <div className="min-h-screen bg-gray-50">
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'there'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Here's your marketing content overview
              </p>
              
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <button 
                onClick={() => onNavigate && onNavigate('content')}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
                    <p className="text-xs text-blue-600 mt-1">View all posts →</p>
                  </div>
                </div>
              </button>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Scheduled Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{scheduledPosts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{publishedPosts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => onNavigate && onNavigate('content')}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">Review Content</h3>
                  <p className="text-sm text-gray-600">Approve or edit generated posts</p>
                </button>
                
                <button 
                  onClick={() => onNavigate && onNavigate('settings')}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">Settings</h3>
                  <p className="text-sm text-gray-600">Update brand voice and preferences</p>
                </button>
                
                <button 
                  onClick={() => onNavigate && onNavigate('company')}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">Company Setup</h3>
                  <p className="text-sm text-gray-600">Configure company settings</p>
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Key Metrics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Total Impressions</p>
                        <p className="text-lg font-bold text-gray-900">{mockImpressions.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 font-medium">+12.3%</p>
                      <p className="text-xs text-gray-500">vs last month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Engagement Rate</p>
                        <p className="text-lg font-bold text-gray-900">{mockEngagementRate}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 font-medium">+2.1%</p>
                      <p className="text-xs text-gray-500">vs last month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Total Reach</p>
                        <p className="text-lg font-bold text-gray-900">{mockReach.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 font-medium">+8.7%</p>
                      <p className="text-xs text-gray-500">vs last month</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Content & Impressions Trend</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Last 7 days</span>
                    <span>Impressions per day</span>
                  </div>
                  
                  {/* Simple bar chart */}
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const height = Math.floor(Math.random() * 60) + 20;
                      const impressions = Math.floor(Math.random() * 8000) + 3000;
                      const posts = Math.floor(Math.random() * 3) + 1;
                      return (
                        <div key={day} className="flex items-center space-x-3">
                          <div className="w-8 text-xs text-gray-500">{day}</div>
                          <div className="flex-1 flex items-center space-x-2">
                            <div 
                              className="bg-blue-200 rounded-sm transition-all hover:bg-blue-300" 
                              style={{height: '16px', width: `${height}%`}}
                            ></div>
                            <div className="text-xs text-gray-600 min-w-0">
                              {impressions.toLocaleString()} ({posts} post{posts !== 1 ? 's' : ''})
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Weekly Average</span>
                      <span className="font-medium text-gray-900">6,750 impressions/day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
  );
}