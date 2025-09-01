import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function SimpleLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <div className="flex items-center justify-center">
          <span className="ml-2 text-2xl font-bold text-gray-900">Marketing Machine</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Dashboard
          </a>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Transform Your Meetings Into LinkedIn Gold
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Marketing Machine automatically converts your meeting transcripts into engaging LinkedIn posts. 
            Set your brand voice once, and watch your content calendar fill up with authentic, professional posts.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-blue-700">
              Get Started
            </a>
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
              View Demo
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Content</h3>
            <p className="text-gray-600">Advanced AI analyzes your meetings and creates LinkedIn posts that match your brand voice perfectly.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brand Consistency</h3>
            <p className="text-gray-600">Set your tone, style, and key messages once. Every generated post maintains your professional brand identity.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Savings</h3>
            <p className="text-gray-600">Turn hours of meeting content into multiple LinkedIn posts in minutes, not hours.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Create a client
const queryClient = new QueryClient();

function TestDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      <div className="mt-4 space-x-4">
        <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        <a href="/onboarding" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Complete Onboarding
        </a>
      </div>
    </div>
  );
}

function WorkingOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetAudience: '',
    contentPillars: [] as string[],
    tone: '',
    personality: [] as string[],
    style: '',
    colors: [] as string[],
    keywords: [] as string[],
    websiteContent: '',
    socialPosts: [] as string[],
    marketingEmails: [] as string[],
    supportEmails: [] as string[],
    demoVideos: [] as string[],
    storyBrand: '',
    timezone: 'America/New_York',
    postingTimes: ['09:00', '13:00']
  });

  // Temporary input states for adding items
  const [tempInputs, setTempInputs] = useState({
    newPillar: '',
    newColor: '',
    newKeyword: '',
    newSocialPost: '',
    newMarketingEmail: '',
    newSupportEmail: '',
    newDemoVideo: ''
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  
  const addItem = (field: keyof typeof formData, value: string, tempField: keyof typeof tempInputs) => {
    if (value.trim() && !(formData[field] as string[]).includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setTempInputs(prev => ({ ...prev, [tempField]: '' }));
    }
  };

  const removeItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };
  
  const togglePersonality = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 6</span>
            <span className="text-sm text-gray-500">{Math.round((step / 6) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
              <p className="text-gray-600">Tell us about your company</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({...prev, companyName: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({...prev, industry: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="consulting">Consulting</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({...prev, targetAudience: e.target.value}))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-20"
                  placeholder="Describe your target audience..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <ContentPillarsStep 
              formData={formData}
              tempInputs={tempInputs}
              setTempInputs={setTempInputs}
              addItem={addItem}
              removeItem={removeItem}
            />
          )}

          {step === 3 && (
            <BrandVoiceStep 
              formData={formData}
              setFormData={setFormData}
              togglePersonality={togglePersonality}
            />
          )}

          {step === 4 && (
            <BrandAssetsStep 
              formData={formData}
              tempInputs={tempInputs}
              setTempInputs={setTempInputs}
              addItem={addItem}
              removeItem={removeItem}
            />
          )}

          {step === 5 && (
            <ContentExamplesStep 
              formData={formData}
              setFormData={setFormData}
              tempInputs={tempInputs}
              setTempInputs={setTempInputs}
              addItem={addItem}
              removeItem={removeItem}
            />
          )}

          {step === 6 && (
            <FinalReviewStep 
              formData={formData}
              setFormData={setFormData}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          
          {step < 6 && (
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components to keep it clean
function ContentPillarsStep({ formData, tempInputs, setTempInputs, addItem, removeItem }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Content Pillars</h2>
      <p className="text-gray-600">What topics should your content focus on? (minimum 2 required)</p>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={tempInputs.newPillar}
          onChange={(e) => setTempInputs((prev: any) => ({...prev, newPillar: e.target.value}))}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Industry Insights, Leadership, Innovation..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addItem('contentPillars', tempInputs.newPillar, 'newPillar');
            }
          }}
        />
        <button
          onClick={() => addItem('contentPillars', tempInputs.newPillar, 'newPillar')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      
      {formData.contentPillars.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.contentPillars.map((pillar: string, index: number) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              {pillar}
              <button
                onClick={() => removeItem('contentPillars', index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {formData.contentPillars.length < 2 && (
        <p className="text-sm text-orange-600">Add at least 2 content pillars to continue</p>
      )}
    </div>
  );
}

function BrandVoiceStep({ formData, setFormData, togglePersonality }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Brand Voice & Tone</h2>
      <p className="text-gray-600">Define your brand's communication style</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Tone * (required)</label>
        <textarea
          value={formData.tone}
          onChange={(e) => setFormData((prev: any) => ({...prev, tone: e.target.value}))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-20"
          placeholder="Describe your brand's tone (e.g., professional yet approachable, authoritative but friendly...)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Personality Traits * (select multiple - at least 1 required)</label>
        <div className="grid grid-cols-2 gap-3">
          {['Professional', 'Friendly', 'Authoritative', 'Approachable', 'Innovative', 'Trustworthy', 'Passionate', 'Analytical', 'Creative', 'Helpful', 'Direct', 'Empathetic'].map((trait) => (
            <button
              key={trait}
              onClick={() => togglePersonality(trait)}
              className={`p-3 text-left rounded-lg border-2 transition-colors ${
                formData.personality.includes(trait)
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
        {formData.personality.length === 0 && (
          <p className="text-sm text-orange-600 mt-2">Select at least one personality trait</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Communication Style (optional)</label>
        <select
          value={formData.style}
          onChange={(e) => setFormData((prev: any) => ({...prev, style: e.target.value}))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Communication Style</option>
          <option value="formal">Formal & Corporate</option>
          <option value="conversational">Conversational & Casual</option>
          <option value="educational">Educational & Informative</option>
          <option value="inspirational">Inspirational & Motivating</option>
          <option value="technical">Technical & Detailed</option>
        </select>
      </div>
    </div>
  );
}

// Step 4: Brand Assets & Keywords
function BrandAssetsStep({ formData, tempInputs, setTempInputs, addItem, removeItem }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Brand Assets & Keywords</h2>
      <p className="text-gray-600">Optional brand elements to enhance content generation</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors (optional)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={tempInputs.newColor}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newColor: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., #1f2937, blue, or rgb(31, 41, 55)"
              onKeyPress={(e) => e.key === 'Enter' && addItem('colors', tempInputs.newColor, 'newColor')}
            />
            <button
              onClick={() => addItem('colors', tempInputs.newColor, 'newColor')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {formData.colors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color: string, index: number) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                  {color}
                  <button onClick={() => removeItem('colors', index)} className="ml-2 text-purple-600 hover:text-purple-800">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Key Brand Keywords (optional)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={tempInputs.newKeyword}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newKeyword: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., innovation, leadership, growth, technology..."
              onKeyPress={(e) => e.key === 'Enter' && addItem('keywords', tempInputs.newKeyword, 'newKeyword')}
            />
            <button
              onClick={() => addItem('keywords', tempInputs.newKeyword, 'newKeyword')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {formData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword: string, index: number) => (
                <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                  {keyword}
                  <button onClick={() => removeItem('keywords', index)} className="ml-2 text-green-600 hover:text-green-800">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 5: Content Examples
function ContentExamplesStep({ formData, setFormData, tempInputs, setTempInputs, addItem, removeItem }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Content Examples</h2>
      <p className="text-gray-600">Help us understand your brand voice with examples</p>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Website Content * (required for brand voice analysis)</label>
        <textarea
          value={formData.websiteContent}
          onChange={(e) => setFormData((prev: any) => ({...prev, websiteContent: e.target.value}))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-32"
          placeholder="Paste your homepage, about us, or key page content that represents your brand voice..."
        />
        {!formData.websiteContent.trim() && (
          <p className="text-sm text-orange-600 mt-1">Website content is required for AI brand voice training</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Recent LinkedIn Posts (optional - 3-5 recommended)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <textarea
              value={tempInputs.newSocialPost}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newSocialPost: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-16"
              placeholder="Paste a recent LinkedIn post..."
            />
            <button
              onClick={() => addItem('socialPosts', tempInputs.newSocialPost, 'newSocialPost')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 self-start"
            >
              Add
            </button>
          </div>
          {formData.socialPosts.length > 0 && (
            <div className="space-y-2">
              {formData.socialPosts.map((post: string, index: number) => (
                <div key={index} className="bg-blue-50 p-3 rounded-md text-sm border">
                  <div className="flex justify-between items-start">
                    <span className="flex-1 whitespace-pre-wrap">{post.substring(0, 150)}{post.length > 150 ? '...' : ''}</span>
                    <button onClick={() => removeItem('socialPosts', index)} className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Marketing Email Examples (optional)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <textarea
              value={tempInputs.newMarketingEmail}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newMarketingEmail: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-16"
              placeholder="Paste marketing email content..."
            />
            <button
              onClick={() => addItem('marketingEmails', tempInputs.newMarketingEmail, 'newMarketingEmail')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 self-start"
            >
              Add
            </button>
          </div>
          {formData.marketingEmails.length > 0 && (
            <div className="space-y-2">
              {formData.marketingEmails.map((email: string, index: number) => (
                <div key={index} className="bg-green-50 p-3 rounded-md text-sm border">
                  <div className="flex justify-between items-start">
                    <span className="flex-1">{email.substring(0, 150)}{email.length > 150 ? '...' : ''}</span>
                    <button onClick={() => removeItem('marketingEmails', index)} className="ml-2 text-red-600 hover:text-red-800">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Support Email Examples (optional)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <textarea
              value={tempInputs.newSupportEmail}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newSupportEmail: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-16"
              placeholder="Paste customer support email content..."
            />
            <button
              onClick={() => addItem('supportEmails', tempInputs.newSupportEmail, 'newSupportEmail')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 self-start"
            >
              Add
            </button>
          </div>
          {formData.supportEmails.length > 0 && (
            <div className="space-y-2">
              {formData.supportEmails.map((email: string, index: number) => (
                <div key={index} className="bg-yellow-50 p-3 rounded-md text-sm border">
                  <div className="flex justify-between items-start">
                    <span className="flex-1">{email.substring(0, 150)}{email.length > 150 ? '...' : ''}</span>
                    <button onClick={() => removeItem('supportEmails', index)} className="ml-2 text-red-600 hover:text-red-800">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Demo Videos (optional)</label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="url"
              value={tempInputs.newDemoVideo}
              onChange={(e) => setTempInputs((prev: any) => ({...prev, newDemoVideo: e.target.value}))}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              onKeyPress={(e) => e.key === 'Enter' && addItem('demoVideos', tempInputs.newDemoVideo, 'newDemoVideo')}
            />
            <button
              onClick={() => addItem('demoVideos', tempInputs.newDemoVideo, 'newDemoVideo')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {formData.demoVideos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.demoVideos.map((video: string, index: number) => (
                <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center">
                  📹 Video {index + 1}
                  <button onClick={() => removeItem('demoVideos', index)} className="ml-2 text-red-600 hover:text-red-800">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">StoryBrand Framework (optional)</label>
        <textarea
          value={formData.storyBrand}
          onChange={(e) => setFormData((prev: any) => ({...prev, storyBrand: e.target.value}))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-20"
          placeholder="If you use the StoryBrand framework, describe your brand story here..."
        />
      </div>
    </div>
  );
}

// Step 6: Final Review & Publishing Schedule
function FinalReviewStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Publishing Schedule & Final Review</h2>
      <p className="text-gray-600">Set your posting schedule and review your brand voice setup</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData((prev: any) => ({...prev, timezone: e.target.value}))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Central Europe (CET)</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Morning Post</label>
            <input
              type="time"
              value={formData.postingTimes[0]}
              onChange={(e) => setFormData((prev: any) => ({
                ...prev,
                postingTimes: [e.target.value, prev.postingTimes[1]]
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Afternoon Post</label>
            <input
              type="time"
              value={formData.postingTimes[1]}
              onChange={(e) => setFormData((prev: any) => ({
                ...prev,
                postingTimes: [prev.postingTimes[0], e.target.value]
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Brand Voice Profile</h3>
        <div className="bg-gray-50 p-6 rounded-lg space-y-3 text-sm">
          <div><strong>Company:</strong> {formData.companyName}</div>
          <div><strong>Industry:</strong> {formData.industry}</div>
          <div><strong>Target Audience:</strong> {formData.targetAudience}</div>
          <div><strong>Content Pillars:</strong> {formData.contentPillars.join(', ') || 'None'}</div>
          <div><strong>Brand Tone:</strong> {formData.tone}</div>
          <div><strong>Personality Traits:</strong> {formData.personality.join(', ') || 'None'}</div>
          <div><strong>Communication Style:</strong> {formData.style || 'Not specified'}</div>
          <div><strong>Brand Colors:</strong> {formData.colors.join(', ') || 'None'}</div>
          <div><strong>Keywords:</strong> {formData.keywords.join(', ') || 'None'}</div>
          <div><strong>Website Content:</strong> {formData.websiteContent ? 'Provided' : 'Missing (Required)'}</div>
          <div><strong>Social Posts:</strong> {formData.socialPosts.length} examples</div>
          <div><strong>Marketing Emails:</strong> {formData.marketingEmails.length} examples</div>
          <div><strong>Support Emails:</strong> {formData.supportEmails.length} examples</div>
          <div><strong>Demo Videos:</strong> {formData.demoVideos.length} videos</div>
          <div><strong>StoryBrand:</strong> {formData.storyBrand ? 'Provided' : 'Not provided'}</div>
          <div><strong>Posting Schedule:</strong> {formData.postingTimes.join(' & ')} ({formData.timezone})</div>
        </div>
      </div>
      
      <button
        onClick={() => {
          console.log('Complete Brand Voice Data:', formData);
          alert(`Brand Voice Setup Complete! 
          
✅ ${formData.contentPillars.length} Content Pillars
✅ ${formData.personality.length} Personality Traits  
✅ ${formData.socialPosts.length} Social Post Examples
✅ ${formData.marketingEmails.length} Marketing Email Examples
✅ ${formData.supportEmails.length} Support Email Examples
✅ ${formData.demoVideos.length} Demo Videos

All data logged to console. Ready for AI content generation!`);
        }}
        disabled={!formData.companyName || !formData.industry || !formData.targetAudience || formData.contentPillars.length < 2 || !formData.tone || formData.personality.length === 0 || !formData.websiteContent}
        className="w-full bg-green-600 text-white py-4 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        🚀 Complete Brand Voice Setup
      </button>
      
      {(!formData.companyName || !formData.industry || !formData.targetAudience || formData.contentPillars.length < 2 || !formData.tone || formData.personality.length === 0 || !formData.websiteContent) && (
        <p className="text-sm text-red-600 text-center">
          Please complete all required fields: Company Info, Content Pillars (2+), Brand Tone, Personality Traits (1+), and Website Content
        </p>
      )}
    </div>
  );
}

function OldSimpleOnboarding() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    targetAudience: '',
    contentPillars: [] as string[],
    newPillar: '',
    tone: '',
    personality: [] as string[],
    style: '',
    colors: [] as string[],
    newColor: '',
    keywords: [] as string[],
    newKeyword: '',
    websiteContent: '',
    socialPosts: [] as string[],
    newSocialPost: '',
    marketingEmails: [] as string[],
    newMarketingEmail: '',
    timezone: 'America/New_York',
    postingTimes: ['09:00', '13:00']
  });

  const totalSteps = 6;
  
  const nextStep = () => setStep(Math.min(step + 1, totalSteps));
  const prevStep = () => setStep(Math.max(step - 1, 1));
  
  const handlePersonalityToggle = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
            <p className="text-gray-600">Tell us about your company</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({...prev, companyName: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Your Company Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({...prev, industry: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Industry</option>
                <option value="technology">Technology</option>
                <option value="consulting">Consulting</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Brand Voice Tone</h2>
            <p className="text-gray-600">How would you describe your brand's communication style?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {['Professional', 'Friendly', 'Authoritative', 'Conversational', 'Inspiring', 'Educational'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setFormData(prev => ({...prev, tone}))}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    formData.tone === tone
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Brand Voice & Tone</h2>
            <p className="text-gray-600">Define your brand's communication style</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Tone *</label>
              <textarea
                value={formData.tone}
                onChange={(e) => setFormData(prev => ({...prev, tone: e.target.value}))}
                className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-20 ${
                  errors.tone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your brand's tone (e.g., professional yet approachable, authoritative but friendly...)"
              />
              {errors.tone && <p className="text-red-600 text-sm mt-1">{errors.tone}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personality Traits * (select multiple)</label>
              <div className="grid grid-cols-2 gap-3">
                {['Professional', 'Friendly', 'Authoritative', 'Approachable', 'Innovative', 'Trustworthy', 'Passionate', 'Analytical', 'Creative', 'Helpful', 'Direct', 'Empathetic'].map((trait) => (
                  <button
                    key={trait}
                    onClick={() => handlePersonalityToggle(trait)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors ${
                      formData.personality.includes(trait)
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
              {errors.personality && <p className="text-red-600 text-sm mt-1">{errors.personality}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication Style (optional)</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData(prev => ({...prev, style: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Style</option>
                <option value="formal">Formal & Corporate</option>
                <option value="conversational">Conversational & Casual</option>
                <option value="educational">Educational & Informative</option>
                <option value="inspirational">Inspirational & Motivating</option>
                <option value="technical">Technical & Detailed</option>
              </select>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Brand Assets & Keywords</h2>
            <p className="text-gray-600">Optional brand elements to enhance content</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors (hex codes)</label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.newColor}
                    onChange={(e) => setFormData(prev => ({...prev, newColor: e.target.value}))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="#1f2937 or blue"
                    onKeyPress={(e) => e.key === 'Enter' && addItem('colors', 'newColor')}
                  />
                  <button
                    onClick={() => addItem('colors', 'newColor')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {color}
                        <button
                          onClick={() => removeItem('colors', index)}
                          className="ml-2 text-gray-600 hover:text-gray-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Brand Keywords</label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.newKeyword}
                    onChange={(e) => setFormData(prev => ({...prev, newKeyword: e.target.value}))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="innovation, leadership, growth..."
                    onKeyPress={(e) => e.key === 'Enter' && addItem('keywords', 'newKeyword')}
                  />
                  <button
                    onClick={() => addItem('keywords', 'newKeyword')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {keyword}
                        <button
                          onClick={() => removeItem('keywords', index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Content Examples</h2>
            <p className="text-gray-600">Help us understand your brand voice with examples</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website Content * (required)</label>
              <textarea
                value={formData.websiteContent}
                onChange={(e) => setFormData(prev => ({...prev, websiteContent: e.target.value}))}
                className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-32 ${
                  errors.websiteContent ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Paste your homepage, about us, or key page content for brand voice analysis..."
              />
              {errors.websiteContent && <p className="text-red-600 text-sm mt-1">{errors.websiteContent}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recent LinkedIn Posts (optional)</label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <textarea
                    value={formData.newSocialPost}
                    onChange={(e) => setFormData(prev => ({...prev, newSocialPost: e.target.value}))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-16"
                    placeholder="Paste a recent LinkedIn post..."
                  />
                  <button
                    onClick={() => addItem('socialPosts', 'newSocialPost')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 self-start"
                  >
                    Add
                  </button>
                </div>
                
                {formData.socialPosts.length > 0 && (
                  <div className="space-y-2">
                    {formData.socialPosts.map((post, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{post.substring(0, 100)}{post.length > 100 ? '...' : ''}</span>
                          <button
                            onClick={() => removeItem('socialPosts', index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marketing Email Examples (optional)</label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <textarea
                    value={formData.newMarketingEmail}
                    onChange={(e) => setFormData(prev => ({...prev, newMarketingEmail: e.target.value}))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 h-16"
                    placeholder="Paste marketing email content..."
                  />
                  <button
                    onClick={() => addItem('marketingEmails', 'newMarketingEmail')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 self-start"
                  >
                    Add
                  </button>
                </div>
                
                {formData.marketingEmails.length > 0 && (
                  <div className="space-y-2">
                    {formData.marketingEmails.map((email, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{email.substring(0, 100)}{email.length > 100 ? '...' : ''}</span>
                          <button
                            onClick={() => removeItem('marketingEmails', index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Publishing Schedule</h2>
            <p className="text-gray-600">Set your default posting schedule</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({...prev, timezone: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Central Europe (CET)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Posting Times</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Morning Post</label>
                  <input
                    type="time"
                    value={formData.postingTimes[0]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      postingTimes: [e.target.value, prev.postingTimes[1]]
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Afternoon Post</label>
                  <input
                    type="time"
                    value={formData.postingTimes[1]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      postingTimes: [prev.postingTimes[0], e.target.value]
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Optimal LinkedIn engagement times</p>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Setup</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                <div><strong>Company:</strong> {formData.companyName}</div>
                <div><strong>Industry:</strong> {formData.industry}</div>
                <div><strong>Target Audience:</strong> {formData.targetAudience}</div>
                <div><strong>Content Pillars:</strong> {formData.contentPillars.join(', ') || 'None added'}</div>
                <div><strong>Brand Tone:</strong> {formData.tone}</div>
                <div><strong>Personality Traits:</strong> {formData.personality.join(', ') || 'None selected'}</div>
                <div><strong>Communication Style:</strong> {formData.style || 'Not specified'}</div>
                <div><strong>Keywords:</strong> {formData.keywords.join(', ') || 'None added'}</div>
                <div><strong>Posting Schedule:</strong> {formData.postingTimes.join(' & ')} {formData.timezone}</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                console.log('Brand Voice Data:', formData);
                alert('Onboarding completed! Brand voice data saved. (In full version, this would connect to your backend API)');
              }}
              className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700"
            >
              Complete Brand Voice Setup
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          
          {step < totalSteps && (
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
            Skip for now →
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<SimpleLandingPage />} />
            <Route path="/dashboard" element={<TestDashboard />} />
            <Route path="/onboarding" element={<WorkingOnboarding />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
