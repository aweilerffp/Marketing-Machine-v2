import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linkedinApi, type LinkedInStatus } from '../services/linkedin';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Unlink, ChevronDown, ChevronUp } from 'lucide-react';
import { LinkedInManualPost } from './LinkedInManualPost';

export const LinkedInConnection: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualPost, setShowManualPost] = useState(false);
  const queryClient = useQueryClient();

  // Query LinkedIn connection status
  const {
    data: status,
    isLoading,
    error: statusError
  } = useQuery<LinkedInStatus>({
    queryKey: ['linkedin-status'],
    queryFn: linkedinApi.getStatus,
    retry: 1
  });

  // Mutation to disconnect LinkedIn
  const disconnectMutation = useMutation({
    mutationFn: linkedinApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-status'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to disconnect LinkedIn');
    }
  });

  // Handle LinkedIn connection
  const handleConnect = async () => {
    console.log('🔗 LinkedIn Connect button clicked');
    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔗 Getting LinkedIn auth URL...');
      // Get authorization URL
      const { authUrl } = await linkedinApi.getAuthUrl();
      console.log('🔗 Got auth URL:', authUrl);

      // Open OAuth popup
      const code = await linkedinApi.openOAuthPopup(authUrl);

      // Handle callback with authorization code
      await linkedinApi.handleCallback(code);

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['linkedin-status'] });

    } catch (error: any) {
      console.error('LinkedIn connection error:', error);
      setError(error.message || 'Failed to connect to LinkedIn');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect LinkedIn? This will stop all automated posting.')) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            LinkedIn Integration
          </CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isConnected = status?.connected || false;
  const profile = status?.profile;
  const expiresAt = status?.expiresAt ? new Date(status.expiresAt) : null;
  const isExpiringSoon = expiresAt ? expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false; // 7 days

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          LinkedIn Integration
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn account to enable automated posting
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {statusError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load LinkedIn status. Please refresh the page.</span>
          </div>
        )}

        {isConnected && profile ? (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Connected as {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-green-700">
                    {profile.connectedAt ?
                      `Connected on ${new Date(profile.connectedAt).toLocaleDateString()}` :
                      'LinkedIn account connected'
                    }
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>

            {/* Token Expiration Warning */}
            {isExpiringSoon && expiresAt && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Your LinkedIn connection expires on {expiresAt.toLocaleDateString()}.
                  Please reconnect to continue automated posting.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => linkedinApi.getProfile()}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Unlink className="w-4 h-4" />
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Not Connected State */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">LinkedIn Not Connected</p>
                  <p className="text-sm text-gray-600">
                    Connect your LinkedIn account to enable automated posting of approved content
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">What you'll get:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Automatic posting of approved content
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Image and text content support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Rate-limited posting (150 posts/day max)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Secure token storage with encryption
                </li>
              </ul>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Connect LinkedIn
                </>
              )}
            </Button>
          </div>
        )}

        {/* Manual Posting Toggle */}
        {isConnected && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowManualPost(!showManualPost)}
              className="w-full flex items-center justify-between"
            >
              <span>Manual Posting</span>
              {showManualPost ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Rate Limit Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            LinkedIn allows up to 150 posts per day. Your content will be automatically queued and posted within these limits.
          </p>
        </div>
      </CardContent>

      {/* Manual Posting Section */}
      {isConnected && showManualPost && (
        <div className="border-t border-gray-200">
          <CardContent className="pt-6">
            <LinkedInManualPost onPostSuccess={(postId) => {
              console.log('Posted successfully:', postId);
              setShowManualPost(false); // Collapse after successful post
            }} />
          </CardContent>
        </div>
      )}
    </Card>
  );
};