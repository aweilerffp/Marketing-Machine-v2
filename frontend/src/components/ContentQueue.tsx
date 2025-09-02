"use client"

import { useState, useEffect } from "react"
import { Search, CheckSquare, Calendar, Settings, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PostCard } from "@/components/PostCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { contentApi, handleApiError, type ContentPost } from "@/services/api"

export function ContentQueue() {
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("review")
  const [error, setError] = useState<string | null>(null)

  // Load posts from API
  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const queuePosts = await contentApi.getQueue()
      setPosts(queuePosts)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRewrite = (postId: string) => {
    // TODO: Implement rewrite modal
    console.log("Rewrite post:", postId)
  }

  const handleApprove = async (postId: string) => {
    try {
      const updatedPost = await contentApi.updateStatus(postId, "APPROVED")
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ))
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    }
  }

  const handleReject = async (postId: string) => {
    try {
      const updatedPost = await contentApi.updateStatus(postId, "REJECTED")
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ))
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    }
  }

  const handleSchedule = (postId: string) => {
    // TODO: Implement schedule modal
    console.log("Schedule post:", postId)
  }

  const handleGenerateDemo = async () => {
    try {
      setIsLoading(true)
      await contentApi.generateDemo()
      await loadPosts() // Reload posts after generating demo content
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const pendingPosts = filteredPosts.filter(post => post.status === "PENDING")
  const approvedPosts = filteredPosts.filter(post => post.status === "APPROVED") 
  const scheduledPosts = filteredPosts.filter(post => post.status === "SCHEDULED")

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Content Management
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 text-balance">Content Queue</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Review posts from meeting transcripts and manage your LinkedIn schedule with intelligent automation
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPosts}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Queue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Needs Review</p>
                <p className="text-4xl font-bold text-primary">
                  {pendingPosts.length}
                </p>
              </div>
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Scheduled</p>
                <p className="text-4xl font-bold text-secondary">
                  {scheduledPosts.length}
                </p>
              </div>
              <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Calendar className="h-8 w-8 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content Button */}
        {posts.length === 0 && !isLoading && (
          <div className="text-center mb-8">
            <Button onClick={handleGenerateDemo} size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Demo Content
            </Button>
          </div>
        )}

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-3 bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-2xl shadow-lg">
              <TabsTrigger
                value="review"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CheckSquare className="h-4 w-4" />
                Review
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4" />
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="review" className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Posts Needing Review</h2>
              <p className="text-muted-foreground">
                {pendingPosts.length} posts waiting for your review
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {pendingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onRewrite={handleRewrite}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSchedule={handleSchedule}
                />
              ))}
            </div>

            {pendingPosts.length === 0 && (
              <div className="text-center py-20">
                <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-lg">No posts need review right now.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Scheduled Posts</h2>
                <p className="text-muted-foreground">
                  {scheduledPosts.length} posts ready to publish
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {scheduledPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onRewrite={handleRewrite}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSchedule={handleSchedule}
                  />
                ))}
              </div>
              
              {scheduledPosts.length === 0 && (
                <div className="text-center py-20">
                  <div className="h-20 w-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">No scheduled posts</h3>
                  <p className="text-muted-foreground text-lg">Approve some posts to get started.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Scheduling Settings</h2>
                <p className="text-muted-foreground">Configure your content publishing preferences</p>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8">
                  <p className="text-center text-muted-foreground">
                    Scheduling configuration will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}