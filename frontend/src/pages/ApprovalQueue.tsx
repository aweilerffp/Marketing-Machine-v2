import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useContentQueue, useUpdatePostStatus, useUpdatePostContent } from '../hooks/useContent';

const getDefaultScheduledTime = () => {
  const tomorrowMorning = new Date();
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  return tomorrowMorning.toISOString();
};

export default function ApprovalQueue() {
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch queue data
  const { data: posts = [], isLoading, error, refetch } = useContentQueue();
  
  // Mutations for updating posts
  const updateStatusMutation = useUpdatePostStatus();
  const updateContentMutation = useUpdatePostContent();

  const handleApprove = async (postId: string) => {
    const scheduledFor = getDefaultScheduledTime();

    try {
      await updateStatusMutation.mutateAsync({ 
        postId, 
        status: 'SCHEDULED',
        scheduledFor,
      });
    } catch (error) {
      console.error('Failed to approve post:', error);
      // TODO: Add toast notification
    }
  };

  const handleReject = async (postId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ postId, status: 'REJECTED' });
    } catch (error) {
      console.error('Failed to reject post:', error);
      // TODO: Add toast notification
    }
  };

  const handleEdit = (postId: string, content: string) => {
    setEditingPost(postId);
    setEditContent(content);
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      await updateContentMutation.mutateAsync({ 
        postId, 
        content: editContent 
      });
      setEditingPost(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to save edit:', error);
      // TODO: Add toast notification
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const pendingPosts = posts.filter(post => post.status === 'PENDING');

  if (isLoading) {
    return (
      <>
        <SignedOut>
          <div>Redirecting...</div>
        </SignedOut>
        <SignedIn>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading content queue...</span>
              </div>
            </main>
          </div>
        </SignedIn>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SignedOut>
          <div>Redirecting...</div>
        </SignedOut>
        <SignedIn>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error loading content queue
                    </h3>
                    <p className="mt-2 text-sm text-red-700">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <div>Redirecting...</div>
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Content Approval Queue</h1>
              <p className="text-gray-600 mt-2">
                Review and approve generated LinkedIn posts
              </p>
            </div>

            {pendingPosts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H8" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mt-4">No posts to review</h3>
                <p className="text-gray-500 mt-2">New content will appear here after meetings are processed</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {post.hook.meeting.title || 'Untitled Meeting'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Generated {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        {post.hook.pillar && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {post.hook.pillar}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    </div>

                    <div className="mb-4">
                      {editingPost === post.id ? (
                        <div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleSaveEdit(post.id)}
                              disabled={updateContentMutation.isPending}
                              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {updateContentMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : null}
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updateContentMutation.isPending}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-md p-4">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                            {post.content}
                          </pre>
                        </div>
                      )}
                    </div>

                    {post.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={post.imageUrl}
                          alt="Generated content image"
                          className="rounded-md max-w-sm"
                        />
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprove(post.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {updateStatusMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleEdit(post.id, post.content)}
                        disabled={updateContentMutation.isPending || editingPost !== null}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleReject(post.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {updateStatusMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </SignedIn>
    </>
  );
}
