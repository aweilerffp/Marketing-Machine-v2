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
  previousLinkedInPosts: string;
  marketingEmails: string;
  meetingTranscripts: string;
  videoTranscripts: string;
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
    previousLinkedInPosts: '',
    marketingEmails: '',
    meetingTranscripts: '',
    videoTranscripts: '',
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
    if (step < 4) {
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
      previousLinkedInPosts: formData.previousLinkedInPosts.split('\n').filter(post => post.trim()),
      marketingEmails: formData.marketingEmails.split('\n---\n').filter(email => email.trim()),
      meetingTranscripts: formData.meetingTranscripts,
      videoTranscripts: formData.videoTranscripts,
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
        return formData.targetAudience.trim();
      case 3:
        return formData.websiteContent.trim() || formData.previousLinkedInPosts.trim() || formData.marketingEmails.trim() || formData.meetingTranscripts.trim() || formData.videoTranscripts.trim();
      case 4:
        return true; // Optional brand colors
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
            Step {step} of 4
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
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
          <h2 className="text-2xl font-semibold">Target Audience</h2>
          <p className="text-gray-600">Who is your primary audience on LinkedIn?</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="e.g., Business professionals, Small business owners, SaaS founders"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Brand Voice Content</h2>
          <p className="text-gray-600">
            Provide examples of your existing content to help us learn your brand voice. 
            <strong> At least one field is required.</strong>
          </p>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="websiteContent">Website Content</Label>
              <textarea
                id="websiteContent"
                value={formData.websiteContent}
                onChange={(e) => handleInputChange('websiteContent', e.target.value)}
                placeholder="Paste content from your website (About page, homepage, etc.)"
                className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="previousLinkedInPosts">Previous LinkedIn Posts</Label>
              <textarea
                id="previousLinkedInPosts"
                value={formData.previousLinkedInPosts}
                onChange={(e) => handleInputChange('previousLinkedInPosts', e.target.value)}
                placeholder="Paste your successful LinkedIn posts (one per line)"
                className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <textarea
                id="marketingEmails"
                value={formData.marketingEmails}
                onChange={(e) => handleInputChange('marketingEmails', e.target.value)}
                placeholder="Paste marketing emails you've sent (separate multiple emails with '---')"
                className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="meetingTranscripts">Meeting Transcripts</Label>
              <textarea
                id="meetingTranscripts"
                value={formData.meetingTranscripts}
                onChange={(e) => handleInputChange('meetingTranscripts', e.target.value)}
                placeholder="Paste transcripts from company meetings, customer calls, or internal discussions"
                className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="videoTranscripts">Video Transcripts</Label>
              <textarea
                id="videoTranscripts"
                value={formData.videoTranscripts}
                onChange={(e) => handleInputChange('videoTranscripts', e.target.value)}
                placeholder="Paste transcripts from company videos, webinars, or presentations"
                className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Brand Colors</h2>
          <p className="text-gray-600">Optional: Add your brand colors to help with content styling.</p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="brandColors">Brand Colors</Label>
              <Input
                id="brandColors"
                value={formData.brandColors}
                onChange={(e) => handleInputChange('brandColors', e.target.value)}
                placeholder="e.g., #1a73e8, #34a853 (comma separated)"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                These will be used to style your LinkedIn posts and maintain brand consistency.
              </p>
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
          {createCompanyMutation.isPending ? 'Saving...' : (step === 4 ? 'Complete Setup' : 'Next')}
        </Button>
      </div>
    </div>
  );
};