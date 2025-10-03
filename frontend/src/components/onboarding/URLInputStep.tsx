import { useState } from 'react';
import axios from 'axios';

interface URLInputStepProps {
  onAnalysisComplete: (data: any) => void;
  onSkip: () => void;
}

const PROGRESS_MESSAGES = [
  { step: 'scraping_website', message: '🔍 Investigating your website...' },
  { step: 'extracting_colors', message: '🎨 Admiring your color palette...' },
  { step: 'finding_linkedin', message: '🔗 Stalking your LinkedIn...' },
  { step: 'scraping_linkedin', message: '📄 Reading your posts...' },
  { step: 'finding_youtube', message: '📺 Binge-watching your YouTube...' },
  { step: 'scraping_youtube', message: '🎬 Getting video transcripts...' },
  { step: 'analyzing_brand', message: '✨ Synthesizing your brand essence...' },
  { step: 'finalizing', message: '🎯 Putting the finishing touches...' },
  { step: 'complete', message: '🎉 Analysis complete!' }
];

export default function URLInputStep({ onAnalysisComplete, onSkip }: URLInputStepProps) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ step: '', percentage: 0, message: '' });
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setProgress({ step: 'starting', percentage: 0, message: 'Starting analysis...' });

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Start analysis
      const startResponse = await axios.post(
        `${API_URL}/api/company/analyze-website`,
        { url },
        { withCredentials: true }
      );

      const { jobId } = startResponse.data;

      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(
            `${API_URL}/api/company/analysis-status/${jobId}`,
            { withCredentials: true }
          );

          const job = statusResponse.data;

          if (job.status === 'processing' && job.progress) {
            setProgress(job.progress);
          } else if (job.status === 'complete') {
            clearInterval(pollInterval);
            setProgress({ step: 'complete', percentage: 100, message: '🎉 Analysis complete!' });
            setTimeout(() => {
              onAnalysisComplete(job.data);
            }, 1000);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setError(job.error || 'Analysis failed. Please try again.');
            setIsAnalyzing(false);
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isAnalyzing) {
          setError('Analysis timed out. Please try again or fill manually.');
          setIsAnalyzing(false);
        }
      }, 120000);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze website. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const getCurrentMessage = () => {
    const found = PROGRESS_MESSAGES.find(m => m.step === progress.step);
    return found?.message || progress.message || 'Analyzing...';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's Start with Your Website
        </h2>
        <p className="text-gray-600">
          We'll analyze your website to pre-fill your brand profile. You can review and adjust everything before finalizing.
        </p>
      </div>

      {!isAnalyzing ? (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Website URL *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://yourcompany.com"
                disabled={isAnalyzing}
              />
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Analyze Website
            </button>

            <div className="text-center">
              <button
                onClick={onSkip}
                className="text-gray-600 hover:text-gray-900 text-sm underline"
              >
                Skip analysis and fill manually
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              What we'll analyze:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Company name and industry</li>
              <li>✓ Brand voice and tone</li>
              <li>✓ Visual brand colors</li>
              <li>✓ Website content</li>
              <li>✓ LinkedIn posts (if available)</li>
              <li>✓ YouTube videos (if available)</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{getCurrentMessage()}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress.percentage}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Animated brand detective icon */}
          <div className="flex justify-center py-8">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-5xl">🕵️</span>
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-24 h-24 bg-blue-400 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            This usually takes 20-30 seconds...
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
