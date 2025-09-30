import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { linkedinApi, type LinkedInPostRequest } from '../services/linkedin';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, AlertCircle, Send, TestTube, Eye, Users } from 'lucide-react';

interface LinkedInManualPostProps {
  contentId?: string;
  initialText?: string;
  onPostSuccess?: (linkedinPostId: string) => void;
}

export const LinkedInManualPost: React.FC<LinkedInManualPostProps> = ({
  contentId,
  initialText = '',
  onPostSuccess
}) => {
  const [text, setText] = useState(initialText);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get LinkedIn posting status
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError
  } = useQuery({
    queryKey: ['linkedin-posting-status'],
    queryFn: linkedinApi.getPostingStatus,
    retry: 1
  });

  // Post mutation
  const postMutation = useMutation({
    mutationFn: (postData: LinkedInPostRequest) => linkedinApi.postContent(postData),
    onSuccess: (data) => {
      setText('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['linkedin-posting-status'] });
      onPostSuccess?.(data.linkedinPostId);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to post to LinkedIn');
    }
  });

  // Test post mutation
  const testMutation = useMutation({
    mutationFn: linkedinApi.testPost,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['linkedin-posting-status'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Test post failed');
    }
  });

  const handlePost = () => {
    if (!text.trim()) {
      setError('Please enter some content to post');
      return;
    }

    if (text.length > 3000) {
      setError('Post content cannot exceed 3,000 characters');
      return;
    }

    postMutation.mutate({
      text: text.trim(),
      contentId,
      visibility
    });
  };

  const handleTestPost = () => {
    testMutation.mutate();
  };

  const isConnected = status?.connected || false;
  const characterCount = text.length;
  const isOverLimit = characterCount > 3000;
  const canPost = isConnected && text.trim().length > 0 && !isOverLimit;

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            LinkedIn Manual Posting
          </CardTitle>
          <CardDescription>Loading posting status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          LinkedIn Manual Posting
        </CardTitle>
        <CardDescription>
          Manually post content to your LinkedIn profile
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Status Error */}
        {statusError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load LinkedIn status. Please refresh the page.</span>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">LinkedIn Not Connected</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Please connect your LinkedIn account in the Integrations tab before posting.
            </p>
          </div>
        ) : (
          <>
            {/* Connected Status */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">LinkedIn Connected</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ready to Post
              </Badge>
            </div>

            {/* Rate Limit Info */}
            {status?.rateLimit && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Daily Limit:</strong> {status.rateLimit.used || 0} / {status.rateLimit.dailyLimit} posts used
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Resets at: {new Date(status.rateLimit.resetTime).toLocaleString()}
                </p>
              </div>
            )}

            {/* Post Form */}
            <div className="space-y-4">
              {/* Visibility Setting */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Post Visibility</Label>
                <Select value={visibility} onValueChange={(value: 'PUBLIC' | 'CONNECTIONS') => setVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Public - Anyone on LinkedIn
                      </div>
                    </SelectItem>
                    <SelectItem value="CONNECTIONS">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Connections Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <Label htmlFor="post-text">Post Content</Label>
                <Textarea
                  id="post-text"
                  placeholder="What do you want to share on LinkedIn?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className={isOverLimit ? 'border-red-500' : ''}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={`${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                    {characterCount.toLocaleString()} / 3,000 characters
                  </span>
                  {isOverLimit && (
                    <span className="text-red-600">Character limit exceeded</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleTestPost}
                  disabled={testMutation.isPending || !isConnected}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={!canPost || postMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {postMutation.isPending ? 'Posting...' : 'Post to LinkedIn'}
                </Button>
              </div>
            </div>

            {/* Success Messages */}
            {postMutation.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Successfully posted to LinkedIn!</span>
              </div>
            )}

            {testMutation.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Test post successful! Your LinkedIn connection is working.</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};