import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyApi } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SchedulingSettings } from './SchedulingSettings';
import { WebhookIntegrations } from './WebhookIntegrations';

interface CompanySettingsProps {
  onBack?: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetAudience: '',
    websiteContent: '',
    samplePosts: '',
    brandColors: ''
  });

  // Prompt management state
  const [promptData, setPromptData] = useState<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  } | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get current company data
  const { data: company, isLoading, refetch } = useQuery({
    queryKey: ['company'],
    queryFn: companyApi.getCurrent
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: any) => companyApi.upsert(data),
    onSuccess: () => {
      setIsEditing(false);
      refetch();
      
      // Clear cached prompt data when brand voice is updated - new prompt will be generated
      if (promptData) {
        console.log('🔄 Brand voice updated - clearing cached prompt data for regeneration');
        setPromptData(null);
      }
      
      alert('✅ Company settings updated successfully!');
      
      // If advanced tab is open, show message about prompt regeneration
      if (showAdvanced && activeTab === 'advanced') {
        setTimeout(() => {
          alert('🎯 Custom LinkedIn prompt is being regenerated based on your updated brand voice. Refresh the Advanced tab to see the new prompt.');
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Update error:', error);
      alert('❌ Error updating company settings. Please try again.');
    }
  });

  // Handle scheduling settings save
  const handleSchedulingSettingsSave = async (config: any) => {
    try {
      await companyApi.updateScheduling(config);
    } catch (err) {
      throw err;
    }
  };

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.name || '',
        industry: company.brandVoiceData?.industry || '',
        targetAudience: company.brandVoiceData?.targetAudience || '',
        websiteContent: company.brandVoiceData?.websiteContent || '',
        samplePosts: Array.isArray(company.brandVoiceData?.samplePosts) 
          ? company.brandVoiceData.samplePosts.join('\n') 
          : '',
        brandColors: Array.isArray(company.brandVoiceData?.brandColors)
          ? company.brandVoiceData.brandColors.join(', ')
          : ''
      });
    }
  }, [company]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const brandVoiceData = {
      industry: formData.industry,
      targetAudience: formData.targetAudience,
      websiteContent: formData.websiteContent,
      samplePosts: formData.samplePosts.split('\n').filter(post => post.trim()),
      brandColors: formData.brandColors.split(',').map(color => color.trim()),
      personality: company?.brandVoiceData?.personality || ['professional', 'helpful', 'authoritative']
    };

    const companyData = {
      name: formData.companyName,
      brandVoiceData,
      contentPillars: company?.contentPillars || ['Industry Insights', 'Product Updates', 'Customer Success'],
      postingSchedule: company?.postingSchedule || {
        timezone: 'America/New_York',
        defaultTimes: ['09:00', '13:00']
      }
    };

    updateCompanyMutation.mutate(companyData);
  };

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

  // Load prompt data when advanced tab is accessed
  const loadPromptData = async () => {
    setPromptLoading(true);
    try {
      const data = await companyApi.getPrompt();
      setPromptData(data);
    } catch (error) {
      console.error('Error loading prompt:', error);
      alert('Error loading prompt data. Please try again.');
    } finally {
      setPromptLoading(false);
    }
  };

  // Save prompt changes
  const savePrompt = async (newPrompt: string) => {
    if (!promptData) return;
    setPromptSaving(true);
    try {
      const result = await companyApi.updatePrompt(newPrompt);
      setPromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastModified: result.lastModified
      } : null);
      alert('✅ Prompt updated successfully!');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('❌ Error saving prompt. Please try again.');
    } finally {
      setPromptSaving(false);
    }
  };

  // Regenerate prompt from brand voice
  const regeneratePrompt = async () => {
    if (!promptData) return;
    setPromptSaving(true);
    try {
      const result = await companyApi.regeneratePrompt();
      setPromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastGenerated: result.lastGenerated
      } : null);
      alert('✅ Prompt regenerated from brand voice!');
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      alert('❌ Error regenerating prompt. Please try again.');
    } finally {
      setPromptSaving(false);
    }
  };

  // Load prompt data when advanced tab becomes active
  useEffect(() => {
    if (activeTab === 'advanced' && showAdvanced && !promptData) {
      loadPromptData();
    }
  }, [activeTab, showAdvanced, promptData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Company Profile</h2>
          <p className="text-gray-600 mb-4">Complete the brand voice onboarding to create your company profile.</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your brand voice, company information, and scheduling preferences</p>
          </div>
          <div className="flex space-x-3">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                Back to Dashboard
              </Button>
            )}
            <Button 
              onClick={async () => {
                if (window.confirm('This will reset your brand voice setup. Are you sure?')) {
                  try {
                    console.log('Attempting to reset company data...');
                    // Clear company data by creating minimal profile
                    await companyApi.upsert({
                      name: 'temp',
                      brandVoiceData: {},
                      contentPillars: [],
                      postingSchedule: {}
                    });
                    console.log('Company data reset successful');
                    window.location.reload();
                  } catch (error: any) {
                    console.error('Reset error:', error);
                    alert(`Error resetting onboarding: ${error?.message || error}`);
                  }
                }
              }}
              variant="outline"
              className="bg-red-50 text-red-600 hover:bg-red-100"
            >
              Reset Onboarding
            </Button>
            <Button 
              onClick={() => {
                // Force show onboarding by redirecting to a test URL
                window.location.href = window.location.origin + '?forceOnboarding=true';
              }}
              variant="outline"
              className="bg-green-50 text-green-600 hover:bg-green-100"
            >
              Preview New Onboarding
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Settings
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setIsEditing(false)} 
                  variant="outline"
                  disabled={updateCompanyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className={`grid w-full ${showAdvanced ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          {showAdvanced && (
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                {isEditing ? (
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{company.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                {isEditing ? (
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{company.brandVoiceData?.industry || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                {isEditing ? (
                  <Input
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{company.brandVoiceData?.targetAudience || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Brand Voice</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="websiteContent">Website Content Sample</Label>
                {isEditing ? (
                  <textarea
                    id="websiteContent"
                    value={formData.websiteContent}
                    onChange={(e) => handleInputChange('websiteContent', e.target.value)}
                    className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste content from your website..."
                  />
                ) : (
                  <p className="mt-1 text-gray-900 text-sm">
                    {company.brandVoiceData?.websiteContent 
                      ? `${company.brandVoiceData.websiteContent.substring(0, 200)}...`
                      : 'Not specified'
                    }
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="samplePosts">Sample Social Posts</Label>
                {isEditing ? (
                  <textarea
                    id="samplePosts"
                    value={formData.samplePosts}
                    onChange={(e) => handleInputChange('samplePosts', e.target.value)}
                    className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="One post per line..."
                  />
                ) : (
                  <div className="mt-1 text-gray-900 text-sm">
                    {company.brandVoiceData?.samplePosts?.length > 0 
                      ? `${company.brandVoiceData.samplePosts.length} sample posts`
                      : 'Not specified'
                    }
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="brandColors">Brand Colors</Label>
                {isEditing ? (
                  <Input
                    id="brandColors"
                    value={formData.brandColors}
                    onChange={(e) => handleInputChange('brandColors', e.target.value)}
                    placeholder="#1a73e8, #34a853"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {company.brandVoiceData?.brandColors?.length > 0 
                      ? company.brandVoiceData.brandColors.join(', ')
                      : 'Not specified'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Locked Advanced Prompt Section */}
            {!showAdvanced && (
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Scheduling Preferences</h2>
            <p className="text-gray-600">Configure how often and when your content should be posted</p>
            <SchedulingSettings onSave={handleSchedulingSettingsSave} />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <WebhookIntegrations />
        </TabsContent>

        {/* Advanced Tab - Hidden Prompt Settings */}
        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Advanced Prompt Settings</h2>
                  <p className="text-gray-600">Customize the AI prompt used for LinkedIn post generation</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={async () => {
                      if (!promptData) return;
                      setPromptLoading(true);
                      try {
                        const result = await companyApi.regeneratePrompt();
                        setPromptData(prev => prev ? {
                          ...prev,
                          prompt: result.prompt,
                          lastGenerated: result.lastGenerated,
                          isCustom: false
                        } : null);
                        alert('✅ Prompt refreshed with latest brand voice data!');
                      } catch (error) {
                        console.error('Error refreshing prompt:', error);
                        alert('❌ Error refreshing prompt. Please try again.');
                      } finally {
                        setPromptLoading(false);
                      }
                    }}
                    variant="outline"
                    disabled={promptLoading}
                    className="flex items-center"
                  >
                    {promptLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Refresh Prompt Data
                  </Button>
                  <Button 
                    onClick={() => setShowAdvanced(false)}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    🔒 Lock Advanced Settings
                  </Button>
                </div>
              </div>

              {promptLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading prompt data...</span>
                </div>
              ) : promptData ? (
                <div className="space-y-6">
                  {/* Show info if prompt data is stale */}
                  {company && promptData.companyName !== company.name && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h3 className="text-sm font-medium text-blue-800">Prompt May Be Outdated</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            This prompt was generated for "{promptData.companyName}" but your current company is "{company.name}". 
                            Click "Refresh Prompt Data" to load the latest prompt for your current brand voice.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Modifying this prompt can significantly impact your LinkedIn post quality. Only proceed if you understand prompt engineering.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Company</h4>
                      <p className="text-gray-600 mt-1">{promptData.companyName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Last Generated</h4>
                      <p className="text-gray-600 mt-1">{new Date(promptData.lastGenerated).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900">Status</h4>
                      <p className="text-gray-600 mt-1">{promptData.isCustom ? 'Custom' : 'Auto-generated'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Current Prompt</h3>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={regeneratePrompt}
                        disabled={promptSaving}
                        variant="outline"
                        className="flex items-center"
                      >
                        {promptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Regenerate from Brand Voice
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="promptContent">
                        Prompt Content ({promptData.prompt.length} characters)
                      </Label>
                      <textarea
                        id="promptContent"
                        value={promptData.prompt}
                        onChange={(e) => setPromptData(prev => prev ? {...prev, prompt: e.target.value} : null)}
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
                          <span className="font-mono bg-gray-200 px-1 rounded">{`{HOOK_LIST}`}</span> → Meeting insight/hook text
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load prompt data. Please try again.</p>
                  <Button onClick={loadPromptData} className="mt-4">
                    Retry Loading
                  </Button>
                </div>
              )}

              {promptData && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <Button 
                      onClick={() => savePrompt(promptData.prompt)}
                      disabled={promptSaving}
                      className="flex items-center"
                    >
                      {promptSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Save Prompt Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900">Profile Created</h3>
          <p className="text-sm text-blue-700 mt-1">
            {new Date(company.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900">Last Updated</h3>
          <p className="text-sm text-green-700 mt-1">
            {new Date(company.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-900">Content Pillars</h3>
          <p className="text-sm text-purple-700 mt-1">
            {Array.isArray(company.contentPillars) ? company.contentPillars.length : 3} active
          </p>
        </div>
      </div>
    </div>
  );
};