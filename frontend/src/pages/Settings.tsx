import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { companyApi } from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [readaiConnected, setReadaiConnected] = useState(false);
  
  // Prompt management state
  const [promptData, setPromptData] = useState<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  } | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle double-click to unlock advanced settings
  const handleAdvancedUnlock = () => {
    const shouldUnlock = window.confirm(
      '⚠️ WARNING: Advanced Prompt Settings\n\n' +
      'Editing the AI prompt can significantly impact the quality and style of your LinkedIn posts. ' +
      'Only proceed if you understand prompt engineering.\n\n' +
      'This could ruin the performance of your posts if modified incorrectly.\n\n' +
      'Do you want to proceed?'
    );
    
    if (shouldUnlock) {
      setShowAdvanced(true);
      setActiveTab('advanced');
      console.log('🔓 Advanced prompt settings unlocked');
    }
  };

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'integrations', name: 'Integrations' },
    { id: 'brand', name: 'Brand Voice' },
    { id: 'schedule', name: 'Schedule' },
    ...(showAdvanced ? [{ id: 'advanced', name: 'Advanced' }] : []),
  ];

  // Load prompt data when advanced tab is accessed
  const loadPromptData = async () => {
    setPromptLoading(true);
    try {
      const data = await companyApi.getPrompt();
      setPromptData(data);
    } catch (error) {
      console.error('Failed to load prompt:', error);
    } finally {
      setPromptLoading(false);
    }
  };

  // Save prompt changes
  const savePrompt = async () => {
    if (!promptData) return;
    setSaving(true);
    try {
      const result = await companyApi.updatePrompt(promptData.prompt);
      setPromptData(prev => prev ? { ...prev, lastModified: result.lastModified } : null);
      console.log('✅ Prompt saved successfully');
    } catch (error) {
      console.error('❌ Failed to save prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  // Regenerate prompt from brand voice
  const regeneratePrompt = async () => {
    if (!promptData) return;
    setSaving(true);
    try {
      const result = await companyApi.regeneratePrompt();
      setPromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastGenerated: result.lastGenerated
      } : null);
      console.log('🔄 Prompt regenerated successfully');
    } catch (error) {
      console.error('❌ Failed to regenerate prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  // Load prompt data when advanced tab is first accessed
  useEffect(() => {
    if (activeTab === 'advanced' && !promptData) {
      loadPromptData();
    }
  }, [activeTab, promptData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="My Company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    defaultValue="Technology"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Services</h3>
              <div className="space-y-4">
                {/* LinkedIn Integration */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">LinkedIn</h4>
                      <p className="text-sm text-gray-500">Post content to your LinkedIn profile</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {linkedinConnected ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <button 
                        onClick={() => setLinkedinConnected(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Read.ai Integration */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Read.ai</h4>
                      <p className="text-sm text-gray-500">Capture meeting transcripts automatically</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {readaiConnected ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <button 
                        onClick={() => setReadaiConnected(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700"
                      >
                        Setup Webhook
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Need help setting up integrations? Check our documentation for step-by-step instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'brand':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Voice Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Voice Description
                  </label>
                  <textarea
                    rows={4}
                    defaultValue="Professional but approachable, confident, solution-focused"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Pillars (one per line)
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={`Product Updates\nIndustry Insights\nCustomer Success Stories`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Update Brand Voice
              </button>
            </div>

            {/* Locked Advanced Prompt Section */}
            <div className="pt-6 border-t border-gray-200">
              <div 
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-colors"
                onDoubleClick={handleAdvancedUnlock}
              >
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Advanced Prompt Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Double-click to access custom LinkedIn prompt editor
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    ⚠️ Advanced users only - can impact post quality
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Posting Schedule</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Posting Times
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      defaultValue="13:00"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posts per Meeting
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1">1 post</option>
                    <option value="2">2 posts</option>
                    <option value="3" selected>3 posts (recommended)</option>
                    <option value="5">5 posts</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Save Schedule
              </button>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            {promptLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading prompt data...</p>
              </div>
            ) : promptData ? (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Advanced Settings - Use with Caution
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Modifying the AI prompt will affect the quality and style of all LinkedIn posts generated for {promptData.companyName}. 
                        Only edit if you understand prompt engineering.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Custom LinkedIn Prompt</h3>
                      <p className="text-sm text-gray-500">
                        {promptData.isCustom ? 'Custom prompt' : 'AI-generated prompt'} • 
                        Last modified: {new Date(promptData.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={regeneratePrompt}
                        disabled={promptSaving}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {promptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Regenerate from Brand Voice
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt Content ({promptData.prompt.length} characters)
                      </label>
                      <textarea
                        value={promptData.prompt}
                        onChange={(e) => setPromptData(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Loading prompt..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ensure your prompt includes placeholders for: Hook, Content Pillar, and Brand Voice data
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Variable Substitutions</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-mono bg-gray-200 px-1 rounded">Hook:</span> → Meeting insight/hook text
                        </div>
                        <div>
                          <span className="font-mono bg-gray-200 px-1 rounded">Content Pillar:</span> → Post category
                        </div>
                        <div>
                          <span className="font-mono bg-gray-200 px-1 rounded">Brand Voice:</span> → Company brand voice data
                        </div>
                        <div>
                          <span className="font-mono bg-gray-200 px-1 rounded">Meeting Context:</span> → Meeting transcript/summary
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Changes take effect immediately for new posts
                    </div>
                    <button
                      onClick={savePrompt}
                      disabled={promptSaving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {promptSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Prompt'
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load prompt data</p>
                <button
                  onClick={loadPromptData}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SignedOut>
        <div>Redirecting...</div>
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">
                Manage your account and content preferences
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </SignedIn>
    </>
  );
}