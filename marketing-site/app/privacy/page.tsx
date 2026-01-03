import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'Privacy Policy - Marketing Machine',
  description: 'Privacy Policy for Marketing Machine - How we collect, use, and protect your data.',
}

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Marketing Machine ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our service that converts meeting transcripts into
              marketing content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Email address (from your authentication provider)</li>
              <li>Name and profile information</li>
              <li>Company/business information you provide</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Meeting Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Meeting transcripts from your connected Zoom account</li>
              <li>Meeting titles and participant information</li>
              <li>Meeting duration and timestamps</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.3 Brand Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Brand voice preferences and content pillars</li>
              <li>Website content you provide for analysis</li>
              <li>Social media post examples</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>AI Processing:</strong> Meeting transcripts are processed using AI (Claude by Anthropic) to generate marketing content tailored to your brand voice</li>
              <li><strong>Content Generation:</strong> Creating LinkedIn posts, hooks, and accompanying images based on meeting insights</li>
              <li><strong>Service Improvement:</strong> Improving our AI models and service quality</li>
              <li><strong>Communication:</strong> Sending service-related notifications and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We integrate with the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Zoom:</strong> For meeting transcript retrieval (requires your authorization)</li>
              <li><strong>LinkedIn:</strong> For content publishing (requires your authorization)</li>
              <li><strong>Anthropic (Claude):</strong> For AI-powered content generation</li>
              <li><strong>Clerk:</strong> For authentication services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention and Deletion</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your data as follows:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account data is retained while your account is active</li>
              <li>Meeting transcripts are retained until you delete them or your account</li>
              <li>Generated content is retained until published or deleted</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Upon account deletion or Zoom app deauthorization:</strong> All your data will be
              permanently deleted within 10 days. This includes all meeting transcripts, generated
              content, brand settings, and personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Consent Withdrawal:</strong> Revoke AI processing consent at any time from Settings</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>All data is transmitted over encrypted connections (HTTPS/TLS)</li>
              <li>OAuth tokens are encrypted at rest</li>
              <li>Access to production systems is restricted and monitored</li>
              <li>Regular security reviews and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. AI Processing Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using Marketing Machine, you consent to AI processing of your meeting transcripts.
              This processing uses Claude (Anthropic) to analyze transcripts and generate marketing
              content. You can revoke this consent at any time from the Settings page, which will
              stop all transcript processing. Previously generated content will remain available
              until you delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Marketing Machine is not intended for users under the age of 18. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new Privacy Policy on this page and updating the
              "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <p className="text-muted-foreground mt-4">
              Email: privacy@trymarketingmachine.com
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
