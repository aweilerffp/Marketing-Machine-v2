"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Check, Sparkles, Target, RefreshCw, Palette, Edit3, BarChart3, Clock } from "lucide-react"

export default function MarketingMachine() {
  const [isLifetime, setIsLifetime] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Marketing Machine</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              How It Works
            </a>
            <a
              href="#factory-floor"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Factory Floor Monitoring
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Pricing
            </a>
            <Link href="https://app.trymarketingmachine.com">
              <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Turn meetings into marketing content</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-balance">
            You know you should be <span className="text-primary">marketing</span>.
            <br />
            <span className="text-muted-foreground">You're just too busy building.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
            For solo founders and small teams juggling product, sales, and support, marketing is always "later." Turn
            your existing meetings into automatic LinkedIn content.
          </p>

          <Card className="bg-card border-border p-8 max-w-2xl mx-auto mb-12 shadow-sm">
            <p className="text-sm text-muted-foreground mb-6 font-medium">Auto-sync your meeting insights from:</p>
            <div className="flex justify-center gap-6 items-center flex-wrap">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <span className="text-xs font-bold text-primary">Zoom</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div className="text-sm text-muted-foreground">+ more soon</div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="https://app.trymarketingmachine.com">
              <Button
                size="lg"
                className="rounded-full text-base px-8 bg-foreground text-background hover:bg-foreground/90"
              >
                Start Creating Content
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full text-base px-8 bg-transparent">
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="bg-secondary/50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Create <span className="text-primary">marketing content</span> in 4 steps
            </h2>
            <p className="text-xl text-muted-foreground">Capture insights, generate content, post consistently, and see results</p>
          </div>

          {/* Step 1 */}
          <div className="mb-24">
            <Card className="p-8 md:p-12 shadow-sm border-border bg-card">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                    STEP 1
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Capture Your Meetings</h3>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Connect Zoom and we automatically receive your meeting transcripts. Every customer conversation
                    becomes a potential marketing opportunity.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Automatic transcript capture from Zoom cloud recordings",
                      "Extract key insights and customer pain points",
                      "No manual note-taking required",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-white">
                  <img
                    src="/images/content-queue-stats.png"
                    alt="Content Queue Dashboard showing 8 meetings analyzed, 20 posts needing review, 0 scheduled posts, and 4 rejected posts"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Step 2 */}
          <div className="mb-24">
            <Card className="p-8 md:p-12 shadow-sm border-border bg-card">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border shadow-lg bg-white">
                  <img
                    src="/images/hook-generation-prompt.png"
                    alt="Hook Generation Prompt interface showing customized prompt for Explicit company with brand voice and content strategy settings"
                    className="w-full h-auto"
                  />
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                    STEP 2
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Generate Marketing Hooks</h3>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Our AI analyzes your meetings against your brand voice and creates compelling LinkedIn posts with
                    matching visuals. Get up to 10 content ideas per meeting.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Brand voice analysis for authentic content",
                      "LinkedIn posts with engagement-driving questions",
                      "Custom images with your brand colors",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Step 3 */}
          <div className="mb-24">
            <Card className="p-8 md:p-12 shadow-sm border-border bg-card">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                    STEP 3
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Approve & Schedule</h3>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Review generated content in your approval queue, make quick edits, and schedule posts for optimal
                    times. Stay consistent without the daily effort.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Visual approval queue for easy review",
                      "Inline editing and custom rewrites",
                      "Automatic posting at peak engagement times",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-white">
                  <img
                    src="/images/posts-review.png"
                    alt="Posts Needing Review interface showing 20 posts waiting for review with search functionality and post preview cards"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Step 4 */}
          <div>
            <Card className="p-8 md:p-12 shadow-sm border-border bg-card">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border shadow-lg bg-white">
                  <img
                    src="/images/results-screenshot.png"
                    alt="LinkedIn post performance showing real business results with 8,000+ impressions and strong engagement metrics"
                    className="w-full h-auto"
                  />
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                    STEP 4
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">See Real Business Results</h3>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Track your content performance with real metrics. Watch your LinkedIn presence grow while you focus
                    on running your business.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Track engagement and impressions in real-time",
                      "Watch your LinkedIn audience grow consistently",
                      "Generate leads while you focus on your business",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Factory Floor Monitoring Section */}
      <section id="factory-floor" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Monitor your <span className="text-primary">content pipeline</span> in real-time
            </h2>
            <p className="text-xl text-muted-foreground">Track every stage from meeting capture to published post</p>
          </div>

          <Card className="p-8 md:p-12 shadow-lg border-border bg-card overflow-hidden">
            <img
              src="/images/factory-floor.png"
              alt="Marketing Machine Factory Floor showing production line status with Input Station, AI Processing, Quality Control, Output Gallery, and Analytics stages"
              className="w-full h-auto rounded-lg"
            />
          </Card>

          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              {
                title: "Pipeline Visibility",
                desc: "See exactly where each piece of content is in the production process",
              },
              {
                title: "Real-Time Updates",
                desc: "Watch as meetings flow through AI processing to your approval queue",
              },
              {
                title: "Performance Metrics",
                desc: "Track completion rates, success metrics, and content velocity",
              },
              {
                title: "Quality Control",
                desc: "Monitor which posts are ready to publish and which need review",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Everything you need to <span className="text-primary">market consistently</span>
            </h2>
            <p className="text-xl text-muted-foreground">Powerful automation designed for founders and small teams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Brand Voice Analysis",
                desc: "We analyze your website, social posts, and communications to create content that sounds authentically you.",
              },
              {
                icon: RefreshCw,
                title: "Automatic Processing",
                desc: "Connect once and forget it. Every meeting automatically becomes marketing content.",
              },
              {
                icon: Palette,
                title: "Custom Image Generation",
                desc: "AI-generated images using your brand colors and style. Every post comes with a professional visual.",
              },
              {
                icon: Edit3,
                title: "Quick Edits & Rewrites",
                desc: 'Edit inline or use custom prompts like "remove client name" or "make it more casual".',
              },
              {
                icon: BarChart3,
                title: "Content Pillars",
                desc: "Automatically maps insights to your key topics. Maintains balanced content across your product features.",
              },
              {
                icon: Clock,
                title: "Smart Scheduling",
                desc: "Posts go live at 9am and 1pm EST by default, or customize to match your audience.",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-8 hover:shadow-md transition-shadow border-border group bg-card">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-secondary/50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Simple, <span className="text-primary">transparent</span> pricing
            </h2>
            <p className="text-xl text-muted-foreground">Choose the plan that works best for you</p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-lg font-medium transition-colors ${!isLifetime ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsLifetime(!isLifetime)}
              className="relative w-16 h-8 rounded-full bg-secondary border-2 border-border transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Toggle between monthly and lifetime pricing"
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-primary transition-transform duration-200 ease-in-out ${
                  isLifetime ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-lg font-medium transition-colors ${isLifetime ? "text-foreground" : "text-muted-foreground"}`}>
              Lifetime
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Best deal
              </span>
            </span>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <Card className="p-10 md:p-12 shadow-lg border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-bold tracking-tight">
                      {isLifetime ? "$999" : "$99"}
                    </span>
                    {!isLifetime && <span className="text-2xl text-muted-foreground">/month</span>}
                  </div>
                  {isLifetime && (
                    <p className="text-lg text-muted-foreground mt-2">One-time payment</p>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">
                  {isLifetime
                    ? "Pay once, use forever. No recurring charges."
                    : "Perfect for growing teams and consistent content creators."}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  "Unlimited meetings & content generation",
                  "Auto-sync with Zoom",
                  "AI-powered brand voice analysis",
                  "Custom image generation",
                  "LinkedIn auto-posting",
                  "Real-time pipeline monitoring",
                  "Priority support",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="https://app.trymarketingmachine.com" className="block">
                <Button
                  size="lg"
                  className="w-full rounded-full text-base bg-foreground text-background hover:bg-foreground/90"
                >
                  Start 14-day free trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <p className="text-sm text-muted-foreground text-center mt-4">
                No credit card required • Cancel anytime
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              <span className="text-primary">Marketing</span> matters more than ever
            </h2>
            <p className="text-xl text-muted-foreground">
              You're having valuable conversations every day. Why let those insights disappear?
            </p>
          </div>

          <Card className="p-10 md:p-12 shadow-sm border-border bg-card">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-6">
                <p className="text-lg leading-relaxed">
                  As a founder, I was having amazing customer conversations every week. Real insights, pain points,
                  success stories—everything I needed for authentic marketing content.
                </p>
                <p className="text-lg leading-relaxed">
                  But by the time the meeting ended, those golden moments were buried in my notes. I knew I should be
                  sharing this on LinkedIn, but between building the product and talking to customers, marketing always
                  got pushed to "later."
                </p>
                <p className="text-lg leading-relaxed">
                  That's why I built Marketing Machine: to automatically turn those conversations into content that
                  actually gets posted. Because the best marketing stories are already happening in your meetings—you
                  just need a system to capture them.
                </p>
                <div className="pt-4 border-t border-border">
                  <div className="font-semibold">The Marketing Machine Team</div>
                  <div className="text-muted-foreground text-sm mt-1">Built for founders who are too busy building</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Start turning meetings into <span className="text-primary">marketing</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect Zoom, complete a 10-minute onboarding, and start generating LinkedIn content from your next
            meeting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link href="https://app.trymarketingmachine.com">
              <Button
                size="lg"
                className="rounded-full text-base px-10 bg-foreground text-background hover:bg-foreground/90"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-secondary/50 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "How does the Zoom integration work?",
                a: "After connecting your Zoom account during onboarding, we automatically receive transcripts from your cloud recordings. You don't need to manually upload anything—transcripts are processed within 1-2 hours after your meeting ends.",
              },
              {
                q: "How do you maintain my brand voice?",
                a: "During onboarding, we analyze your website, recent social media posts, marketing emails, and other company communications. Our AI uses this to generate content that matches your tone, style, and messaging approach.",
              },
              {
                q: "How many posts will I get per meeting?",
                a: "By default, we generate 3 marketing hooks per meeting, but you can adjust this from 1-10 depending on your needs. Each hook becomes a complete LinkedIn post with an accompanying image.",
              },
              {
                q: "Can I edit the generated content?",
                a: 'You have full control in the approval queue. Edit posts inline, use custom rewrite prompts (like "make it shorter" or "remove client name"), or reject posts entirely. Nothing publishes without your approval.',
              },
              {
                q: "When will my posts go live?",
                a: "Posts are scheduled for 9am and 1pm EST by default, which are peak engagement times on LinkedIn. You can customize these times to match your audience's preferences.",
              },
              {
                q: "What happens to my meeting transcripts?",
                a: "We process transcripts to generate content and store them securely in our encrypted database. We're GDPR-compliant and never share your data. You maintain full ownership of your content.",
              },
            ].map((faq, i) => (
              <Card key={i} className="p-8 hover:shadow-sm transition-shadow border-border bg-card">
                <h3 className="text-xl font-semibold mb-3">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Marketing Machine</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Turn your meetings into LinkedIn content automatically.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#factory-floor" className="text-muted-foreground hover:text-foreground transition-colors">
                    Factory Floor Monitoring
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="/privacy#data-security" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2025 Marketing Machine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
