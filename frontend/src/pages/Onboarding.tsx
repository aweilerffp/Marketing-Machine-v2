import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useUpsertCompany } from '../hooks/useCompany';
import URLInputStep from '../components/onboarding/URLInputStep';
import AIFieldPreview from '../components/onboarding/AIFieldPreview';

interface BrandVoiceData {
  tone: string;
  personality: string[];
  style: string;
  keywords: string[];
  colors: string[];
  demoVideos: string[];
  websiteContent: string;
  socialPosts: string[];
  supportEmails: string[];
  marketingEmails: string[];
  storyBrand?: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // Now starts at 0 for URL input
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [analysisData, setAnalysisData] = useState<any>(null); // Store AI analysis results

  const upsertCompanyMutation = useUpsertCompany();

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetAudience: '',
    contentPillars: [] as string[],
    postingTimes: ['09:00', '13:00'],
    timezone: 'America/New_York',
    brandVoice: {
      tone: '',
      personality: [] as string[],
      style: '',
      keywords: [] as string[],
      colors: [] as string[],
      demoVideos: [] as string[],
      websiteContent: '',
      socialPosts: [] as string[],
      supportEmails: [] as string[],
      marketingEmails: [] as string[],
      storyBrand: ''
    } as BrandVoiceData
  });

  // Form validation
  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.industry.trim()) newErrors.industry = 'Industry is required';
        if (!formData.targetAudience.trim()) newErrors.targetAudience = 'Target audience is required';
        break;
      case 2:
        if (formData.contentPillars.length < 2) newErrors.contentPillars = 'At least 2 content pillars are required';
        break;
      case 3:
        if (!formData.brandVoice.tone.trim()) newErrors.tone = 'Brand tone is required';
        if (formData.brandVoice.personality.length === 0) newErrors.personality = 'At least one personality trait is required';
        break;
      case 5:
        if (!formData.brandVoice.websiteContent.trim()) newErrors.websiteContent = 'Website content is required for brand analysis';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle analysis completion
  const handleAnalysisComplete = (data: any) => {
    console.log('Analysis complete:', data);
    setAnalysisData(data);

    // Pre-fill form data from analysis (including visual style profile for image generation)
    setFormData({
      ...formData,
      companyName: data.companyName || '',
      industry: data.industry || '',
      targetAudience: data.targetAudience || '',
      contentPillars: data.contentPillars || [],
      brandVoice: {
        ...formData.brandVoice,
        tone: data.brandVoice?.tone?.value || data.brandVoice?.tone || '',
        personality: data.brandVoice?.personality || [],
        style: data.brandVoice?.style?.value || data.brandVoice?.style || '',
        keywords: data.brandVoice?.keywords || [],
        colors: data.brandVoice?.colors || [],
        websiteContent: data.websiteContent || '',
        socialPosts: data.socialContent?.linkedInPosts || [],
        visualStyleProfile: data.visualStyleProfile // Save complete visual style for image generation
      }
    });

    // Move to step 1 (review)
    setStep(1);
  };

  // Handle skip analysis
  const handleSkipAnalysis = () => {
    setAnalysisData(null);
    setStep(1); // Skip to manual entry
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 6) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    setIsSubmitting(true);
    try {
      const companyData = {
        name: formData.companyName,
        brandVoiceData: {
          ...formData.brandVoice,
          industry: formData.industry,
          targetAudience: formData.targetAudience
        },
        contentPillars: formData.contentPillars,
        postingSchedule: {
          timezone: formData.timezone,
          defaultTimes: formData.postingTimes
        }
      };

      await upsertCompanyMutation.mutateAsync(companyData);
      navigate('/');
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      setErrors({ submit: 'Failed to save company information. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalityToggle = (trait: string) => {
    const current = formData.brandVoice.personality;
    const updated = current.includes(trait) 
      ? current.filter(t => t !== trait)
      : [...current, trait];
    
    setFormData({
      ...formData,
      brandVoice: { ...formData.brandVoice, personality: updated }
    });
  };

  const addToArray = (field: keyof BrandVoiceData, value: string) => {
    if (value.trim()) {
      const currentArray = formData.brandVoice[field] as string[];
      setFormData({
        ...formData,
        brandVoice: {
          ...formData.brandVoice,
          [field]: [...currentArray, value.trim()]
        }
      });
    }
  };

  const removeFromArray = (field: keyof BrandVoiceData, index: number) => {
    const currentArray = formData.brandVoice[field] as string[];
    setFormData({
      ...formData,
      brandVoice: {
        ...formData.brandVoice,
        [field]: currentArray.filter((_, i) => i !== index)
      }
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <URLInputStep
            onAnalysisComplete={handleAnalysisComplete}
            onSkip={handleSkipAnalysis}
          />
        );

      case 1:
        return (
          <div className="space-y-6">
            {/* Warning banner for low confidence */}
            {analysisData && analysisData.overallConfidence < 0.7 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Low confidence analysis.</strong> We weren't able to gather enough information. Please review all fields carefully before finalizing.
                    </p>
                    {analysisData.warnings && analysisData.warnings.length > 0 && (
                      <ul className="mt-2 text-xs text-yellow-600 list-disc list-inside">
                        {analysisData.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {analysisData && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  ✨ We analyzed your website and pre-filled the information below. Feel free to edit anything!
                </p>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
              <p className="text-gray-600">Tell us about your business to personalize your content</p>
            </div>

            <div className="space-y-4">
              {analysisData ? (
                <>
                  <AIFieldPreview
                    label="Company Name *"
                    value={formData.companyName}
                    confidence={analysisData.confidenceScores?.companyName || 0.9}
                    source="website"
                    onChange={(value) => setFormData({ ...formData, companyName: value })}
                    placeholder="Enter your company name"
                  />
                  <AIFieldPreview
                    label="Industry *"
                    value={formData.industry}
                    confidence={analysisData.confidenceScores?.industry || 0.7}
                    source="website"
                    onChange={(value) => setFormData({ ...formData, industry: value })}
                    placeholder="e.g., SaaS, E-commerce, Consulting"
                  />
                  <AIFieldPreview
                    label="Target Audience *"
                    value={formData.targetAudience}
                    confidence={analysisData.confidenceScores?.targetAudience || 0.7}
                    source="website"
                    multiline={true}
                    onChange={(value) => setFormData({ ...formData, targetAudience: value })}
                    placeholder="e.g., B2B SaaS founders, small business owners..."
                  />
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.companyName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your company name"
                    />
                    {errors.companyName && (
                      <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.industry ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., SaaS, E-commerce, Consulting"
                    />
                    {errors.industry && (
                      <p className="text-red-600 text-sm mt-1">{errors.industry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience *
                    </label>
                    <textarea
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.targetAudience ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., B2B SaaS founders, small business owners, marketing professionals..."
                    />
                    {errors.targetAudience && (
                      <p className="text-red-600 text-sm mt-1">{errors.targetAudience}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            {analysisData && analysisData.contentPillars?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  ✨ We suggested these content pillars based on your website. Remove any you don't want and add your own!
                </p>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Pillars</h2>
              <p className="text-gray-600">What topics should your content focus on? We'll map your meeting insights to these pillars.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Content Pillars (minimum 2) *
                </label>

                {/* Display current pillars as removable chips */}
                <div className="mb-3 min-h-[60px] p-3 border border-gray-300 rounded-md bg-gray-50">
                  {formData.contentPillars.length === 0 ? (
                    <p className="text-gray-400 text-sm">No pillars added yet. Add some below!</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.contentPillars.map((pillar, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-300"
                        >
                          {pillar}
                          <button
                            type="button"
                            onClick={() => {
                              const newPillars = formData.contentPillars.filter((_, i) => i !== index);
                              setFormData({ ...formData, contentPillars: newPillars });
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input to add new pillars */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a content pillar (e.g., Product Updates)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !formData.contentPillars.includes(value)) {
                          setFormData({
                            ...formData,
                            contentPillars: [...formData.contentPillars, value]
                          });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !formData.contentPillars.includes(value)) {
                        setFormData({
                          ...formData,
                          contentPillars: [...formData.contentPillars, value]
                        });
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add a pillar</p>

                {errors.contentPillars && (
                  <p className="text-red-600 text-sm mt-1">{errors.contentPillars}</p>
                )}

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Total pillars: {formData.contentPillars.length} {formData.contentPillars.length < 2 && '(need at least 2)'}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Voice & Tone</h2>
              <p className="text-gray-600">Define how your brand should communicate</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Tone *
                </label>
                <textarea
                  value={formData.brandVoice.tone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    brandVoice: { ...formData.brandVoice, tone: e.target.value }
                  })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Professional but approachable, confident, solution-focused, authentic..."
                />
                {errors.tone && (
                  <p className="text-red-600 text-sm mt-1">{errors.tone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Personality Traits * (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'Professional', 'Friendly', 'Authoritative', 'Approachable', 
                    'Innovative', 'Trustworthy', 'Passionate', 'Analytical',
                    'Creative', 'Helpful', 'Direct', 'Empathetic'
                  ].map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => handlePersonalityToggle(trait)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        formData.brandVoice.personality.includes(trait)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
                {errors.personality && (
                  <p className="text-red-600 text-sm mt-1">{errors.personality}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Style
                </label>
                <select
                  value={formData.brandVoice.style}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    brandVoice: { ...formData.brandVoice, style: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select communication style</option>
                  <option value="formal">Formal & Corporate</option>
                  <option value="conversational">Conversational & Casual</option>
                  <option value="educational">Educational & Informative</option>
                  <option value="inspirational">Inspirational & Motivating</option>
                  <option value="technical">Technical & Detailed</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Assets & Keywords</h2>
              <p className="text-gray-600">Help us understand your visual brand and key messaging</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Colors (optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">Enter hex codes for your brand colors</p>
                <div className="space-y-2">
                  {formData.brandVoice.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color }}
                        title={color}
                      ></div>
                      <input
                        type="text"
                        value={color}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromArray('colors', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="e.g., #4F46E5 or blue"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('colors', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">Press Enter to add color</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Brand Keywords (optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">Words that define your brand or should appear in content</p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.brandVoice.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeFromArray('keywords', index)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., innovation, efficiency, growth"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('keywords', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">Press Enter to add keyword</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Examples</h2>
              <p className="text-gray-600">Provide examples of your existing content to train our AI on your brand voice</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Content *
                </label>
                <p className="text-sm text-gray-500 mb-2">Copy and paste text from your homepage or key pages</p>
                <textarea
                  value={formData.brandVoice.websiteContent}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    brandVoice: { ...formData.brandVoice, websiteContent: e.target.value }
                  })}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.websiteContent ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Paste your homepage headline, about section, or key product descriptions..."
                />
                {errors.websiteContent && (
                  <p className="text-red-600 text-sm mt-1">{errors.websiteContent}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recent Social Media Posts (optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">Add 3-5 of your best recent LinkedIn posts</p>
                <div className="space-y-2">
                  {formData.brandVoice.socialPosts.map((post, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <textarea
                        value={post}
                        readOnly
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromArray('socialPosts', index)}
                        className="text-red-600 hover:text-red-800 mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <textarea
                    placeholder="Paste a recent LinkedIn post..."
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        addToArray('socialPosts', (e.target as HTMLTextAreaElement).value);
                        (e.target as HTMLTextAreaElement).value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">Press Ctrl+Enter to add post</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Email Examples (optional)
                </label>
                <p className="text-sm text-gray-500 mb-2">Recent newsletters or marketing emails</p>
                <div className="space-y-2">
                  {formData.brandVoice.marketingEmails.map((email, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <textarea
                        value={email}
                        readOnly
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromArray('marketingEmails', index)}
                        className="text-red-600 hover:text-red-800 mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <textarea
                    placeholder="Paste marketing email content..."
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        addToArray('marketingEmails', (e.target as HTMLTextAreaElement).value);
                        (e.target as HTMLTextAreaElement).value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">Press Ctrl+Enter to add email</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Publishing Schedule</h2>
              <p className="text-gray-600">When should we post your approved content?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time (EST/EDT)</option>
                  <option value="America/Chicago">Central Time (CST/CDT)</option>
                  <option value="America/Denver">Mountain Time (MST/MDT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Posting Times
                </label>
                <p className="text-sm text-gray-500 mb-2">Optimal times for LinkedIn engagement: 9am and 1pm</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="time"
                    value={formData.postingTimes[0]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      postingTimes: [e.target.value, formData.postingTimes[1]] 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={formData.postingTimes[1]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      postingTimes: [formData.postingTimes[0], e.target.value] 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
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
          
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Progress Bar - Only show if past step 0 */}
              {step > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Step {step} of 6</span>
                    <span>{Math.round((step / 6) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(step / 6) * 100}%` }}
                    ></div>
                  </div>

                  {/* Step indicators */}
                  <div className="flex justify-between mt-4 text-xs">
                    <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Company</span>
                    <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Pillars</span>
                    <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Voice</span>
                    <span className={step >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Assets</span>
                    <span className={step >= 5 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Examples</span>
                    <span className={step >= 6 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Schedule</span>
                  </div>
                </div>
              )}

              {/* Step Content */}
              {renderStep()}

              {/* Navigation Buttons - Only show for steps 1-6 */}
              {step > 0 && (
                <div className="flex justify-between pt-8">
                  <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className={`px-4 py-2 rounded-md ${
                      step === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Back
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Setting up...
                      </>
                    ) : (
                      step === 6 ? 'Complete Setup' : 'Next'
                    )}
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </SignedIn>
    </>
  );
}