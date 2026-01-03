import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'Terms of Service - Marketing Machine',
  description: 'Terms of Service for Marketing Machine - The rules and guidelines for using our service.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Marketing Machine</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Marketing Machine ("Service"), you agree to be bound by these
              Terms of Service ("Terms"). If you disagree with any part of these terms, you may
              not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Marketing Machine is a software service that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Connects to your Zoom account to retrieve meeting transcripts</li>
              <li>Uses AI to analyze transcripts and generate marketing content</li>
              <li>Creates LinkedIn posts based on your brand voice and preferences</li>
              <li>Allows you to review, edit, and publish content to LinkedIn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Requirements</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Create an account with valid authentication credentials</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Have a valid Zoom account with cloud recording and transcription enabled</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Consent and Authorization</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By using the Service, you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Consent to AI Processing:</strong> You authorize us to process your meeting transcripts using AI to generate marketing content</li>
              <li><strong>Authorize Zoom Access:</strong> You grant us permission to access your Zoom meeting recordings and transcripts</li>
              <li><strong>Authorize LinkedIn Posting:</strong> If connected, you grant us permission to post content to your LinkedIn account on your behalf</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You may revoke these authorizations at any time through the Settings page or by
              disconnecting the respective services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Meeting Participant Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Important:</strong> You are responsible for ensuring that all participants
              in your meetings are aware that transcripts may be used for content generation.
              We recommend informing meeting participants that transcripts will be processed
              by AI to create marketing content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Content Ownership and Rights</h2>
            <h3 className="text-xl font-medium mt-6 mb-3">6.1 Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of your meeting transcripts and the content generated from them.
              By using the Service, you grant us a limited license to process your content for
              the purpose of providing the Service.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">6.2 Generated Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              Content generated by the Service using your transcripts belongs to you. You are
              responsible for reviewing and approving all content before publication.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">6.3 Review Responsibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for reviewing all AI-generated content before publishing.
              AI-generated content may contain errors, inaccuracies, or inappropriate material.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Generate content that violates any laws or regulations</li>
              <li>Create misleading, defamatory, or harmful content</li>
              <li>Process transcripts without proper consent from participants</li>
              <li>Circumvent any limitations or restrictions on the Service</li>
              <li>Attempt to reverse engineer or exploit the AI systems</li>
              <li>Share account access with unauthorized users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to provide reliable service but do not guarantee uninterrupted access.
              The Service may be temporarily unavailable due to maintenance, updates, or
              circumstances beyond our control. Transcript processing times may vary depending
              on Zoom server load (typically 1-2 hours after meeting ends).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Marketing Machine shall not be liable for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Content generated by AI that you publish without adequate review</li>
              <li>Actions taken based on AI-generated content</li>
              <li>Third-party service interruptions (Zoom, LinkedIn, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" without warranties of any kind, either express or
              implied. We do not warrant that AI-generated content will be accurate, appropriate,
              or suitable for your purposes. You are responsible for reviewing all content before
              publication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may terminate or suspend your access to the Service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>For violations of these Terms</li>
              <li>For fraudulent or illegal activity</li>
              <li>At our discretion with reasonable notice</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon termination, your data will be deleted within 10 days as described in our
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of
              material changes by posting the updated Terms and updating the "Last updated"
              date. Continued use of the Service after changes constitutes acceptance of the
              new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of
              the State of Delaware, United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground mt-4">
              Email: legal@trymarketingmachine.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Marketing Machine. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
