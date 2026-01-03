import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zoomApi, type ZoomStatus } from '../services/zoom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Unlink, Video } from 'lucide-react';

interface ZoomConnectionProps {
  showSkip?: boolean;
  onSkip?: () => void;
  onConnected?: () => void;
  compact?: boolean;
}

export const ZoomConnection: React.FC<ZoomConnectionProps> = ({
  showSkip = false,
  onSkip,
  onConnected,
  compact = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const queryClient = useQueryClient();

  // Query Zoom connection status
  const {
    data: status,
    isLoading,
    error: statusError
  } = useQuery<ZoomStatus>({
    queryKey: ['zoom-status'],
    queryFn: zoomApi.getStatus,
    retry: 1
  });

  // Mutation to disconnect Zoom
  const disconnectMutation = useMutation({
    mutationFn: zoomApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to disconnect Zoom');
    }
  });

  // Handle Zoom connection
  const handleConnect = async () => {
    console.log('🔗 Zoom Connect button clicked');
    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔗 Getting Zoom auth URL...');
      const { authUrl } = await zoomApi.getAuthUrl();
      console.log('🔗 Got auth URL:', authUrl);

      // Open OAuth popup
      const code = await zoomApi.openOAuthPopup(authUrl);

      // Handle callback with authorization code
      await zoomApi.handleCallback(code);

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });

      // Notify parent
      onConnected?.();

    } catch (error: any) {
      console.error('Zoom connection error:', error);
      setError(error.message || 'Failed to connect to Zoom');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestSuccess(false);

      await zoomApi.getProfile();

      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (error: any) {
      console.error('Zoom test connection error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to test Zoom connection');
    } finally {
      setIsTesting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect Zoom? You will need to reconnect to receive meeting transcripts.')) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Zoom Integration
          </CardTitle>
          {!compact && <CardDescription>Loading connection status...</CardDescription>}
        </CardHeader>
      </Card>
    );
  }

  const isConnected = status?.connected || false;
  const profile = status?.profile;
  const expiresAt = status?.expiresAt ? new Date(status.expiresAt) : null;
  const isExpiringSoon = expiresAt ? expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false;

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Video className="w-5 h-5 text-blue-500" />
          )}
          Zoom Integration
        </CardTitle>
        {!compact && (
          <CardDescription>
            Connect your Zoom account to automatically receive meeting transcripts
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
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
                    {profile.email}
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
                  Your Zoom connection expires on {expiresAt.toLocaleDateString()}.
                  Please reconnect to continue receiving transcripts.
                </span>
              </div>
            )}

            {/* Test Success Message */}
            {testSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Connection test successful!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Test Connection
                  </>
                )}
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

            {/* How it works */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm text-gray-900 mb-2">How it works:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">1.</span>
                  After your meetings, transcripts are automatically sent
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">2.</span>
                  AI analyzes transcripts using your brand voice
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">3.</span>
                  Content appears in your approval queue
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Not Connected State */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900">Zoom Not Connected</p>
                  <p className="text-sm text-blue-700">
                    Connect to automatically receive meeting transcripts
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            {!compact && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900">What you'll get:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Automatic transcript processing after meetings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    AI-generated marketing content from your conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Works with Zoom Pro, Business, and Enterprise accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Secure OAuth connection with token encryption
                  </li>
                </ul>
              </div>
            )}

            {/* Connect Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Connect Zoom
                  </>
                )}
              </Button>
              {showSkip && onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  disabled={isConnecting}
                >
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Requirements Note */}
        {!compact && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Requires Zoom Pro, Business, or Enterprise account with cloud recording enabled.
              Transcripts are processed after cloud recordings are complete (typically 1-2 hours after meeting ends).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
