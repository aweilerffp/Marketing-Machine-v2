import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../services/api';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';

export const WebhookIntegrations: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Get current webhook configuration
  const { data: webhookConfig, isLoading, refetch } = useQuery({
    queryKey: ['webhook-config'],
    queryFn: companyApi.getWebhook
  });

  // Generate webhook URL
  const generateWebhookMutation = useMutation({
    mutationFn: companyApi.generateWebhook,
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Generate webhook error:', error);
      alert('❌ Error generating webhook URL. Please try again.');
    }
  });

  // Toggle webhook active/inactive
  const toggleWebhookMutation = useMutation({
    mutationFn: companyApi.toggleWebhook,
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Toggle webhook error:', error);
      alert('❌ Error toggling webhook status. Please try again.');
    }
  });

  const handleCopyWebhookUrl = async () => {
    if (webhookConfig?.webhookUrl) {
      try {
        await navigator.clipboard.writeText(webhookConfig.webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy URL to clipboard');
      }
    }
  };

  const handleGenerateWebhook = () => {
    const shouldGenerate = webhookConfig?.webhookUrl 
      ? window.confirm('This will generate a new webhook URL and invalidate the existing one. Are you sure?')
      : true;
    
    if (shouldGenerate) {
      generateWebhookMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading webhook configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Read.ai Integration</h2>
        <p className="text-gray-600 mt-1">
          Connect your Read.ai account to automatically generate content from meeting transcripts
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Webhook URL</h3>
            <p className="text-sm text-gray-600">
              Copy this URL and add it as a webhook in your Read.ai account settings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {webhookConfig?.webhookUrl && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="webhook-active" className="text-sm font-medium">
                  Active
                </Label>
                <Switch
                  id="webhook-active"
                  checked={webhookConfig.isActive}
                  onCheckedChange={() => toggleWebhookMutation.mutate()}
                  disabled={toggleWebhookMutation.isPending}
                />
              </div>
            )}
          </div>
        </div>

        {webhookConfig?.webhookUrl ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex mt-1">
                <Input
                  id="webhook-url"
                  value={webhookConfig.webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWebhookUrl}
                  className="ml-2 flex items-center space-x-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Company ID</Label>
                <p className="font-mono text-gray-900">{webhookConfig.companyId}</p>
              </div>
              <div>
                <Label className="text-gray-600">Token Preview</Label>
                <p className="font-mono text-gray-900">{webhookConfig.tokenPreview}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateWebhook}
                disabled={generateWebhookMutation.isPending}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate URL</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open('https://read.ai/settings/webhooks', '_blank')}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Read.ai Settings</span>
              </Button>
            </div>

            {webhookConfig.webhookUrl?.includes('localhost') ? (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">🚨 Development Setup Required</h4>
                <p className="text-sm text-amber-800 mb-3">
                  Read.ai cannot reach localhost URLs. You need to use ngrok to create a public tunnel:
                </p>
                <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside mb-3">
                  <li>Sign up for a free ngrok account at <a href="https://dashboard.ngrok.com/signup" target="_blank" className="underline">dashboard.ngrok.com</a></li>
                  <li>Install your authtoken: <code className="bg-amber-100 px-1 rounded">ngrok config add-authtoken YOUR_TOKEN</code></li>
                  <li>Start ngrok tunnel: <code className="bg-amber-100 px-1 rounded">ngrok http 3001</code></li>
                  <li>Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok.io)</li>
                  <li>Add it to your <code className="bg-amber-100 px-1 rounded">.env</code> file: <code className="bg-amber-100 px-1 rounded">NGROK_URL=https://abc123.ngrok.io</code></li>
                  <li>Restart your backend server</li>
                  <li>Regenerate the webhook URL above</li>
                </ol>
                <p className="text-xs text-amber-700">
                  <strong>Alternative:</strong> Use RequestBin to test webhook payloads manually
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the webhook URL above</li>
                  <li>Go to your Read.ai account settings</li>
                  <li>Navigate to the Webhooks section</li>
                  <li>Add a new webhook and paste the URL</li>
                  <li>Set the trigger to "Meeting End"</li>
                  <li>Save your webhook configuration</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-600">No webhook URL generated yet</p>
            <p className="text-sm text-gray-500">
              {webhookConfig?.instructions || 'Generate a webhook URL to start receiving Read.ai notifications'}
            </p>
            <Button
              onClick={handleGenerateWebhook}
              disabled={generateWebhookMutation.isPending}
              className="flex items-center space-x-2"
            >
              {generateWebhookMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Generate Webhook URL</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">⚡ How it works</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>When a meeting ends in Read.ai, it will send the transcript to your webhook</li>
            <li>Our system will automatically analyze the transcript using your brand voice</li>
            <li>Content hooks and posts will be generated and appear in your Content Queue</li>
            <li>You'll receive a notification when new content is ready for review</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">🧪 Testing</h4>
          <p className="text-sm text-gray-700 mb-3">
            Test your webhook integration without Read.ai:
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open('https://requestbin.com/', '_blank')}
            className="flex items-center space-x-2 w-full justify-center"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open RequestBin</span>
          </Button>
          <p className="text-xs text-gray-600 mt-2">
            Use RequestBin to generate test webhook payloads and see if your endpoint receives them
          </p>
        </div>
      </div>
    </div>
  );
};