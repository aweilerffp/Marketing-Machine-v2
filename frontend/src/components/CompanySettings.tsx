import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { companyApi } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SchedulingSettings } from './SchedulingSettings';
import { WebhookIntegrations } from './WebhookIntegrations';
import { LinkedInConnection } from './LinkedInConnection';

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
    brandColors: '',
    contentPillars: ['Industry Insights', 'Product Updates', 'Customer Success']
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
  
  // Hook prompt management state
  const [hookPromptData, setHookPromptData] = useState<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  } | null>(null);
  const [hookPromptLoading, setHookPromptLoading] = useState(false);
  const [hookPromptSaving, setHookPromptSaving] = useState(false);

  // Image prompt management state
  const [imagePromptData, setImagePromptData] = useState<{
    prompt: string;
    lastGenerated: string;
    lastModified: string;
    isCustom: boolean;
    companyName: string;
  } | null>(null);
  const [imagePromptLoading, setImagePromptLoading] = useState(false);
  const [imagePromptSaving, setImagePromptSaving] = useState(false);

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
          : '',
        contentPillars: (() => {
          try {
            if (typeof company.contentPillars === 'string') {
              return JSON.parse(company.contentPillars);
            } else if (Array.isArray(company.contentPillars)) {
              return company.contentPillars;
            }
          } catch (error) {
            console.warn('Failed to parse content pillars:', error);
          }
          return ['Industry Insights', 'Product Updates', 'Customer Success'];
        })()
      });
    }
  }, [company]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Content pillars management
  const addContentPillar = () => {
    setFormData(prev => ({
      ...prev,
      contentPillars: Array.isArray(prev.contentPillars) ? [...prev.contentPillars, ''] : ['']
    }));
  };

  const updateContentPillar = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      contentPillars: Array.isArray(prev.contentPillars) 
        ? prev.contentPillars.map((pillar, i) => i === index ? value : pillar)
        : [value]
    }));
  };

  const removeContentPillar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contentPillars: Array.isArray(prev.contentPillars) 
        ? prev.contentPillars.filter((_, i) => i !== index)
        : []
    }));
  };

  const sanitizeMultilineInput = (value: string) =>
    value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

  const sanitizeCommaSeparatedInput = (value: string) =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

  const handleSave = () => {
    const existingBrandVoice = (company?.brandVoiceData && typeof company.brandVoiceData === 'object')
      ? company.brandVoiceData
      : {};

    const cleanedCompanyName = formData.companyName.trim();
    const cleanedIndustry = formData.industry.trim();
    const cleanedAudience = formData.targetAudience.trim();
    const cleanedWebsiteContent = formData.websiteContent.trim();
    const cleanedSamplePosts = sanitizeMultilineInput(formData.samplePosts);
    const cleanedBrandColors = sanitizeCommaSeparatedInput(formData.brandColors);

    const mergedBrandVoiceData = {
      ...existingBrandVoice,
      companyName: cleanedCompanyName || existingBrandVoice.companyName || company?.name || '',
      industry: cleanedIndustry || existingBrandVoice.industry || '',
      targetAudience: cleanedAudience || existingBrandVoice.targetAudience || '',
      websiteContent: cleanedWebsiteContent || existingBrandVoice.websiteContent || '',
      samplePosts: cleanedSamplePosts.length > 0
        ? cleanedSamplePosts
        : Array.isArray(existingBrandVoice.samplePosts)
          ? existingBrandVoice.samplePosts
          : [],
      brandColors: cleanedBrandColors.length > 0
        ? cleanedBrandColors
        : Array.isArray(existingBrandVoice.brandColors)
          ? existingBrandVoice.brandColors
          : [],
      personality: Array.isArray(existingBrandVoice.personality) && existingBrandVoice.personality.length > 0
        ? existingBrandVoice.personality
        : ['professional', 'helpful', 'authoritative']
    };

    const cleanedContentPillars = Array.isArray(formData.contentPillars)
      ? formData.contentPillars
          .map(pillar => pillar.trim())
          .filter(pillar => pillar.length > 0)
      : [];

    const companyData = {
      name: cleanedCompanyName || company?.name || '',
      brandVoiceData: mergedBrandVoiceData,
      contentPillars: cleanedContentPillars.length > 0
        ? cleanedContentPillars
        : ['Industry Insights', 'Product Updates', 'Customer Success'],
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
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      const backendMessage = error?.response?.data?.error;
      const message = typeof backendMessage === 'string' 
        ? backendMessage 
        : 'Error saving prompt. Please try again.';
      alert(`❌ ${message}`);
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

  // Hook prompt functions
  const loadHookPromptData = async () => {
    setHookPromptLoading(true);
    try {
      const data = await companyApi.getHookPrompt();
      setHookPromptData(data);
    } catch (error) {
      console.error('Error loading hook prompt:', error);
      alert('Error loading hook prompt data. Please try again.');
    } finally {
      setHookPromptLoading(false);
    }
  };

  const saveHookPrompt = async (newPrompt: string) => {
    if (!hookPromptData) return;
    setHookPromptSaving(true);
    try {
      const result = await companyApi.updateHookPrompt(newPrompt);
      setHookPromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastModified: result.lastModified
      } : null);
      alert('✅ Hook prompt updated successfully!');
    } catch (error) {
      console.error('Error saving hook prompt:', error);
      alert('❌ Error saving hook prompt. Please try again.');
    } finally {
      setHookPromptSaving(false);
    }
  };

  const regenerateHookPrompt = async () => {
    if (!hookPromptData) return;
    setHookPromptSaving(true);
    try {
      const result = await companyApi.regenerateHookPrompt();
      setHookPromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastGenerated: result.lastGenerated
      } : null);
      alert('✅ Hook prompt regenerated from brand voice!');
    } catch (error) {
      console.error('Error regenerating hook prompt:', error);
      alert('❌ Error regenerating hook prompt. Please try again.');
    } finally {
      setHookPromptSaving(false);
    }
  };

  // Image prompt functions
  const loadImagePromptData = async () => {
    setImagePromptLoading(true);
    try {
      const data = await companyApi.getImagePrompt();
      setImagePromptData(data);
    } catch (error) {
      console.error('Error loading image prompt:', error);
      alert('Error loading image prompt data. Please try again.');
    } finally {
      setImagePromptLoading(false);
    }
  };

  const saveImagePrompt = async (newPrompt: string) => {
    if (!imagePromptData) return;
    setImagePromptSaving(true);
    try {
      const result = await companyApi.updateImagePrompt(newPrompt);
      setImagePromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastModified: result.lastModified
      } : null);
      alert('✅ Image prompt updated successfully!');
    } catch (error) {
      console.error('Error saving image prompt:', error);
      alert('❌ Error saving image prompt. Please try again.');
    } finally {
      setImagePromptSaving(false);
    }
  };

  const regenerateImagePrompt = async () => {
    if (!imagePromptData) return;
    setImagePromptSaving(true);
    try {
      const result = await companyApi.regenerateImagePrompt();
      setImagePromptData(prev => prev ? {
        ...prev,
        prompt: result.prompt,
        lastGenerated: result.lastGenerated
      } : null);
      alert('✅ Image prompt regenerated from brand voice!');
    } catch (error) {
      console.error('Error regenerating image prompt:', error);
      alert('❌ Error regenerating image prompt. Please try again.');
    } finally {
      setImagePromptSaving(false);
    }
  };

  // Load prompt data when advanced tab becomes active
  useEffect(() => {
    if (activeTab === 'advanced' && showAdvanced) {
      if (!promptData) {
        loadPromptData();
      }
      if (!hookPromptData) {
        loadHookPromptData();
      }
      if (!imagePromptData) {
        loadImagePromptData();
      }
    }
  }, [activeTab, showAdvanced, promptData, hookPromptData, imagePromptData]);

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

              {/* Content Pillars Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Content Pillars</Label>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={addContentPillar}
                      variant="outline"
                      size="sm"
                      disabled={!Array.isArray(formData.contentPillars) || formData.contentPillars.length >= 10}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      + Add Pillar
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {Array.isArray(formData.contentPillars) && formData.contentPillars.map((pillar, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={pillar}
                          onChange={(e) => updateContentPillar(index, e.target.value)}
                          placeholder={`Content pillar ${index + 1}`}
                          className="flex-1"
                        />
                        {Array.isArray(formData.contentPillars) && formData.contentPillars.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeContentPillar(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 px-2"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-2">
                      Content pillars help categorize your marketing insights. These guide the AI in generating relevant content for your brand.
                    </p>
                  </div>
                ) : (
                  <div className="mt-1">
                    {Array.isArray(formData.contentPillars) && formData.contentPillars.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.contentPillars.map((pillar, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {pillar}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-900">No content pillars defined</p>
                    )}
                  </div>
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
          <LinkedInConnection />
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

              {/* Hook Prompt Section */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Hook Generation Prompt</h3>
                {hookPromptLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Loading hook prompt...</p>
                  </div>
                ) : hookPromptData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Company</h4>
                        <p className="text-gray-600 mt-1">{hookPromptData.companyName}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Last Generated</h4>
                        <p className="text-gray-600 mt-1">{new Date(hookPromptData.lastGenerated).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Status</h4>
                        <p className="text-gray-600 mt-1">{hookPromptData.isCustom ? 'Custom' : 'Auto-generated'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-gray-900">Hook Prompt Content</h4>
                      <Button 
                        onClick={regenerateHookPrompt}
                        disabled={hookPromptSaving}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        {hookPromptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Regenerate
                      </Button>
                    </div>
                    
                    <textarea
                      value={hookPromptData.prompt}
                      onChange={(e) => setHookPromptData(prev => prev ? {...prev, prompt: e.target.value} : null)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                      placeholder="Loading hook prompt..."
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => saveHookPrompt(hookPromptData.prompt)}
                        disabled={hookPromptSaving}
                        className="flex items-center bg-green-600 hover:bg-green-700"
                      >
                        {hookPromptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Save Hook Prompt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Failed to load hook prompt</p>
                    <Button onClick={loadHookPromptData} className="mt-2" size="sm">
                      Retry Loading
                    </Button>
                  </div>
                )}
              </div>

              {/* Website Visual Analysis Section */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📸 Website Visual Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Analyze your website's visual design to automatically match your brand's look and feel in generated images.
                </p>

                <div className="space-y-4">
                  {/* Website URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://www.yourwebsite.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        id="website-url-input"
                      />
                      <Button
                        onClick={async () => {
                          const input = document.getElementById('website-url-input') as HTMLInputElement;
                          const url = input?.value;
                          if (!url) {
                            alert('Please enter a website URL');
                            return;
                          }
                          try {
                            setImagePromptSaving(true);
                            const result = await companyApi.captureScreenshot(url);

                            // Build detailed analysis display
                            const vs = result.visualStyle;
                            let analysisDetails = `✅ ${result.message}\n\n`;
                            analysisDetails += `🎨 DESIGN STYLE: ${vs.designStyle || 'N/A'}\n`;
                            analysisDetails += `🌈 MOOD & ENERGY: ${vs.mood} (${vs.energyLevel} energy)\n\n`;

                            if (vs.exactColors) {
                              analysisDetails += `🎯 EXACT COLOR PALETTE:\n`;
                              if (vs.exactColors.primary) analysisDetails += `• Primary: ${vs.exactColors.primary}\n`;
                              if (vs.exactColors.secondary) analysisDetails += `• Secondary: ${vs.exactColors.secondary}\n`;
                              if (vs.exactColors.accent) analysisDetails += `• Accent: ${vs.exactColors.accent}\n`;
                              if (vs.exactColors.background) analysisDetails += `• Background: ${vs.exactColors.background}\n`;
                              if (vs.exactColors.text) analysisDetails += `• Text: ${vs.exactColors.text}\n`;
                              analysisDetails += `\n`;
                            }

                            if (vs.typography?.style) {
                              analysisDetails += `📝 TYPOGRAPHY: ${vs.typography.style}\n`;
                            }

                            if (vs.iconImageryStyle?.primary) {
                              analysisDetails += `🖼️ IMAGERY STYLE: ${vs.iconImageryStyle.primary}\n`;
                            }

                            if (vs.keyCharacteristics && vs.keyCharacteristics.length > 0) {
                              analysisDetails += `\n✨ KEY CHARACTERISTICS:\n`;
                              vs.keyCharacteristics.forEach((char: string) => {
                                analysisDetails += `• ${char}\n`;
                              });
                            }

                            alert(analysisDetails);

                            // Reload image prompt to see updated analysis
                            await loadImagePromptData();
                          } catch (error: any) {
                            alert(`Failed to capture screenshot: ${error.response?.data?.error || error.message}`);
                          } finally {
                            setImagePromptSaving(false);
                          }
                        }}
                        disabled={imagePromptSaving}
                        className="bg-green-600 hover:bg-green-700 flex items-center"
                      >
                        {imagePromptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                        Capture & Analyze
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This will take a screenshot and analyze the visual design using AI
                    </p>
                  </div>

                  {/* Or Upload Screenshot */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or upload a screenshot</span>
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setImagePromptSaving(true);
                          const result = await companyApi.uploadScreenshot(file);

                          // Build detailed analysis display
                          const vs = result.visualStyle;
                          let analysisDetails = `✅ ${result.message}\n\n`;
                          analysisDetails += `🎨 DESIGN STYLE: ${vs.designStyle || 'N/A'}\n`;
                          analysisDetails += `🌈 MOOD & ENERGY: ${vs.mood} (${vs.energyLevel} energy)\n\n`;

                          if (vs.exactColors) {
                            analysisDetails += `🎯 EXACT COLOR PALETTE:\n`;
                            if (vs.exactColors.primary) analysisDetails += `• Primary: ${vs.exactColors.primary}\n`;
                            if (vs.exactColors.secondary) analysisDetails += `• Secondary: ${vs.exactColors.secondary}\n`;
                            if (vs.exactColors.accent) analysisDetails += `• Accent: ${vs.exactColors.accent}\n`;
                            if (vs.exactColors.background) analysisDetails += `• Background: ${vs.exactColors.background}\n`;
                            if (vs.exactColors.text) analysisDetails += `• Text: ${vs.exactColors.text}\n`;
                            analysisDetails += `\n`;
                          }

                          if (vs.typography?.style) {
                            analysisDetails += `📝 TYPOGRAPHY: ${vs.typography.style}\n`;
                          }

                          if (vs.iconImageryStyle?.primary) {
                            analysisDetails += `🖼️ IMAGERY STYLE: ${vs.iconImageryStyle.primary}\n`;
                          }

                          if (vs.keyCharacteristics && vs.keyCharacteristics.length > 0) {
                            analysisDetails += `\n✨ KEY CHARACTERISTICS:\n`;
                            vs.keyCharacteristics.forEach((char: string) => {
                              analysisDetails += `• ${char}\n`;
                            });
                          }

                          alert(analysisDetails);

                          await loadImagePromptData();
                        } catch (error: any) {
                          alert(`Failed to upload screenshot: ${error.response?.data?.error || error.message}`);
                        } finally {
                          setImagePromptSaving(false);
                          e.target.value = '';
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a screenshot of your website (PNG, JPG, max 5MB)
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 text-sm">
                    <h4 className="font-medium text-green-900 mb-2">What gets analyzed:</h4>
                    <ul className="text-green-700 space-y-1 text-xs">
                      <li>• Design mood & energy level</li>
                      <li>• Color palette & usage</li>
                      <li>• Typography & visual style</li>
                      <li>• Composition & layout patterns</li>
                      <li>• Visual metaphors & imagery</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Image Prompt Section */}
              <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎨 Image Generation Prompt</h3>
                {imagePromptLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Loading image prompt...</p>
                  </div>
                ) : imagePromptData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Company</h4>
                        <p className="text-gray-600 mt-1">{imagePromptData.companyName}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Last Generated</h4>
                        <p className="text-gray-600 mt-1">{new Date(imagePromptData.lastGenerated).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900">Status</h4>
                        <p className="text-gray-600 mt-1">{imagePromptData.isCustom ? 'Custom' : 'Auto-generated'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-gray-900">Image Prompt Content</h4>
                      <Button
                        onClick={regenerateImagePrompt}
                        disabled={imagePromptSaving}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        {imagePromptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Regenerate
                      </Button>
                    </div>

                    <textarea
                      value={imagePromptData.prompt}
                      onChange={(e) => setImagePromptData(prev => prev ? {...prev, prompt: e.target.value} : null)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="Loading image prompt..."
                    />

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Variable Substitutions</h4>
                      <div className="text-xs text-purple-700">
                        <span className="font-mono bg-purple-200 px-1 rounded">{`{hook}`}</span> → The marketing hook text will be inserted here
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveImagePrompt(imagePromptData.prompt)}
                        disabled={imagePromptSaving}
                        className="flex items-center bg-purple-600 hover:bg-purple-700"
                      >
                        {imagePromptSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Save Image Prompt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Failed to load image prompt</p>
                    <Button onClick={loadImagePromptData} className="mt-2" size="sm">
                      Retry Loading
                    </Button>
                  </div>
                )}
              </div>

              {/* LinkedIn Post Prompt Section */}
              <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📝 LinkedIn Post Prompt</h3>
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
                          Save LinkedIn Prompt
                        </Button>
                      </div>
                    </div>
                </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Failed to load LinkedIn prompt data. Please try again.</p>
                    <Button onClick={loadPromptData} className="mt-4">
                      Retry Loading
                    </Button>
                  </div>
                )}
              </div>
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
            {(() => {
              try {
                if (typeof company.contentPillars === 'string') {
                  return JSON.parse(company.contentPillars).length;
                } else if (Array.isArray(company.contentPillars)) {
                  return company.contentPillars.length;
                }
              } catch (error) {
                console.warn('Failed to parse content pillars in stats:', error);
              }
              return 3;
            })()} active
          </p>
        </div>
      </div>
    </div>
  );
};
