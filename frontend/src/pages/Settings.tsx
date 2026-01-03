import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Navbar from '../components/layout/Navbar';
import { ZoomConnection } from '../components/ZoomConnection';
import { LinkedInConnection } from '../components/LinkedInConnection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, AlertTriangle, Trash2, Shield, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Query consent status
  const {
    data: consent,
    isLoading: consentLoading
  } = useQuery({
    queryKey: ['consent'],
    queryFn: authApi.getConsent
  });

  // Mutation to update consent
  const updateConsentMutation = useMutation({
    mutationFn: authApi.updateConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent'] });
    }
  });

  // Mutation to request account deletion
  const deleteAccountMutation = useMutation({
    mutationFn: authApi.requestAccountDeletion,
    onSuccess: () => {
      // Redirect to home with message
      navigate('/?accountDeletionScheduled=true');
    }
  });

  const handleRevokeConsent = () => {
    if (window.confirm('Are you sure you want to revoke AI processing consent? Your meeting transcripts will no longer be processed into content.')) {
      updateConsentMutation.mutate({ aiProcessingConsent: false });
    }
  };

  const handleGrantConsent = () => {
    updateConsentMutation.mutate({ aiProcessingConsent: true });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      deleteAccountMutation.mutate();
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

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your integrations, consent, and account</p>
            </div>

            <div className="space-y-6">
              {/* Integrations Section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Integrations</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Zoom Connection */}
                  <ZoomConnection />

                  {/* LinkedIn Connection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>LinkedIn</CardTitle>
                      <CardDescription>
                        Connect LinkedIn to publish your approved content
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LinkedInConnection />
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* AI Consent Section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Processing Consent</h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      AI Processing
                    </CardTitle>
                    <CardDescription>
                      Control how your meeting transcripts are processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consentLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Loading consent status...
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {consent?.aiProcessingConsent ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {consent?.aiProcessingConsent ? 'AI Processing Enabled' : 'AI Processing Disabled'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {consent?.aiProcessingConsent
                                  ? 'Your transcripts are being processed into marketing content'
                                  : 'Your transcripts are not being processed'
                                }
                              </p>
                            </div>
                          </div>
                          <Badge variant={consent?.aiProcessingConsent ? 'default' : 'secondary'}>
                            {consent?.aiProcessingConsent ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {consent?.aiConsentGrantedAt && (
                          <p className="text-sm text-gray-500">
                            Consent granted on {new Date(consent.aiConsentGrantedAt).toLocaleDateString()}
                          </p>
                        )}

                        <div className="flex gap-2">
                          {consent?.aiProcessingConsent ? (
                            <Button
                              variant="outline"
                              onClick={handleRevokeConsent}
                              disabled={updateConsentMutation.isPending}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              {updateConsentMutation.isPending ? 'Updating...' : 'Revoke Consent'}
                            </Button>
                          ) : (
                            <Button
                              onClick={handleGrantConsent}
                              disabled={updateConsentMutation.isPending}
                            >
                              {updateConsentMutation.isPending ? 'Updating...' : 'Enable AI Processing'}
                            </Button>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            When enabled, your Zoom meeting transcripts are processed using AI (Claude by Anthropic)
                            to generate marketing content based on your brand voice. You can revoke consent at any time.
                          </p>
                          <a
                            href="/privacy"
                            className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                          >
                            Read our Privacy Policy
                          </a>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Account Section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Danger Zone
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Deleting your account will schedule all your data for permanent deletion in 10 days.
                        This includes all meetings, content, and platform connections.
                      </p>

                      {!showDeleteConfirm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete Account
                        </Button>
                      ) : (
                        <div className="p-4 border border-red-200 rounded-lg bg-red-50 space-y-4">
                          <p className="text-sm text-red-700 font-medium">
                            Are you absolutely sure? This action cannot be undone.
                          </p>
                          <p className="text-sm text-red-600">
                            Type DELETE to confirm:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="DELETE"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </main>
        </div>
      </SignedIn>
    </>
  );
}
