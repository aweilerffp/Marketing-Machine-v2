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
      alert('✅ Company settings updated successfully!');
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
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