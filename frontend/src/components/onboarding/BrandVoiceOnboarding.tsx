import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { companyApi } from '../../services/api';
import { useAuth } from '../auth/AuthProvider';

interface OnboardingData {
  companyName: string;
  industry: string;
  targetAudience: string;
  websiteContent: string;
  samplePosts: string;
  brandColors: string;
}

interface BrandVoiceOnboardingProps {
  onComplete: () => void;
}

export const BrandVoiceOnboarding: React.FC<BrandVoiceOnboardingProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    targetAudience: '',
    websiteContent: '',
    samplePosts: '',
    brandColors: ''
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => companyApi.create(data),
    onSuccess: () => {
      console.log('✅ Company onboarding completed');
      onComplete();
    },
    onError: (error) => {
      console.error('❌ Onboarding error:', error);
      alert('Error saving onboarding data. Please try again.');
    }
  });

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    const brandVoiceData = {
      industry: formData.industry,
      targetAudience: formData.targetAudience,
      websiteContent: formData.websiteContent,
      samplePosts: formData.samplePosts.split('\n').filter(post => post.trim()),
      brandColors: formData.brandColors.split(',').map(color => color.trim()),
      personality: ['professional', 'helpful', 'authoritative']
    };

    const companyData = {
      name: formData.companyName,
      brandVoiceData,
      contentPillars: JSON.stringify(['Industry Insights', 'Product Updates', 'Customer Success']),
      postingSchedule: {
        timezone: 'America/New_York',
        defaultTimes: ['09:00', '13:00']
      }
    };

    createCompanyMutation.mutate(companyData);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.companyName.trim() && formData.industry.trim();
      case 2:
        return formData.targetAudience.trim() && formData.websiteContent.trim();
      case 3:
        return true; // Optional fields
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Brand Voice Setup</h1>
          <div className="text-sm text-gray-500">
            Step {step} of 3
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Company Information</h2>
          <p className="text-gray-600">Tell us about your company to personalize your content generation.</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="e.g., Acme Corp"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Brand Voice</h2>
          <p className="text-gray-600">Help us understand your brand voice and target audience.</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="e.g., Business professionals, Small business owners"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="websiteContent">Website Content *</Label>
              <textarea
                id="websiteContent"
                value={formData.websiteContent}
                onChange={(e) => handleInputChange('websiteContent', e.target.value)}
                placeholder="Paste some content from your website to help us understand your brand voice..."
                className="mt-1 w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Additional Details</h2>
          <p className="text-gray-600">Optional information to further customize your content.</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="samplePosts">Sample Social Posts</Label>
              <textarea
                id="samplePosts"
                value={formData.samplePosts}
                onChange={(e) => handleInputChange('samplePosts', e.target.value)}
                placeholder="Paste some existing social media posts (one per line)..."
                className="mt-1 w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="brandColors">Brand Colors</Label>
              <Input
                id="brandColors"
                value={formData.brandColors}
                onChange={(e) => handleInputChange('brandColors', e.target.value)}
                placeholder="e.g., #1a73e8, #34a853 (comma separated)"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed() || createCompanyMutation.isPending}
        >
          {createCompanyMutation.isPending ? 'Saving...' : (step === 3 ? 'Complete Setup' : 'Next')}
        </Button>
      </div>
    </div>
  );
};