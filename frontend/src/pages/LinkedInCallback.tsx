import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LinkedIn OAuth Callback Handler
 *
 * This page receives the OAuth redirect from LinkedIn after user authorization.
 * It extracts the authorization code and posts it back to the parent window
 * that opened the OAuth popup.
 */
export default function LinkedInCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Check if opened as popup
    const isPopup = window.opener && !window.opener.closed;

    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);

      if (isPopup) {
        // Send error to parent window
        window.opener.postMessage(
          {
            type: 'LINKEDIN_OAUTH_ERROR',
            error: errorDescription || error
          },
          window.location.origin
        );
        window.close();
      } else {
        // Not a popup, redirect to dashboard with error
        navigate('/?error=linkedin_oauth_failed');
      }
      return;
    }

    if (code) {
      console.log('LinkedIn OAuth success, got code');

      if (isPopup) {
        // Send success to parent window
        window.opener.postMessage(
          {
            type: 'LINKEDIN_OAUTH_SUCCESS',
            code,
            state
          },
          window.location.origin
        );
        // Window will be closed by parent
      } else {
        // Not a popup, redirect to dashboard
        navigate('/');
      }
    } else {
      console.error('No code or error in LinkedIn callback');

      if (isPopup) {
        window.opener.postMessage(
          {
            type: 'LINKEDIN_OAUTH_ERROR',
            error: 'No authorization code received'
          },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/?error=linkedin_oauth_failed');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Completing LinkedIn authentication...</p>
      </div>
    </div>
  );
}
