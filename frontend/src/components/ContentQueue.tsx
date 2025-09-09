"use client"

import { useState, useEffect } from "react"
import { Search, CheckSquare, Calendar, X, Sparkles, Users, RefreshCw } from "lucide-react"
import { Input } from "./ui/input"
import { PostCard } from "./PostCard"
import { MeetingCard } from "./MeetingCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { contentApi, handleApiError, type ContentPost } from "../services/api"
import { useMeetings, useReprocessMeeting, useDeleteMeeting, useInvalidateMeetings } from "../hooks/useContent"
import { RewriteModal } from "./modals/RewriteModal"

export function ContentQueue() {
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("meetings")
  const [error, setError] = useState<string | null>(null)
  const [rewriteModal, setRewriteModal] = useState<{ isOpen: boolean; postId?: string; content?: string }>({ 
    isOpen: false 
  })

  // Use React Query for meetings
  const { data: meetings = [], isLoading: meetingsLoading, error: meetingsError } = useMeetings()
  const reprocessMeetingMutation = useReprocessMeeting()
  const deleteMeetingMutation = useDeleteMeeting()
  const { refetchMeetings: manualRefetchMeetings } = useInvalidateMeetings()

  // Load posts from API (keeping existing implementation for now)
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

  // Handle meetings error from React Query
  useEffect(() => {
    if (meetingsError) {
      const apiError = handleApiError(meetingsError)
      setError(apiError.message)
    }
  }, [meetingsError])

  // Add focus listener for manual refresh when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      // Refresh meetings data when user focuses on the window
      manualRefetchMeetings()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [manualRefetchMeetings])

  const handleRewrite = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    if (post) {
      setRewriteModal({ 
        isOpen: true, 
        postId, 
        content: post.content 
      })
    }
  }

  const handleRewriteClose = () => {
    setRewriteModal({ isOpen: false })
  }

  const handleRewriteSubmit = async (instructions: string): Promise<string> => {
    if (!rewriteModal.postId) throw new Error("No post selected")
    return await contentApi.rewriteContent(rewriteModal.postId, instructions)
  }

  const handleRewriteAccept = async (rewrittenContent: string) => {
    if (!rewriteModal.postId) return
    
    try {
      const updatedPost = await contentApi.updateContent(rewriteModal.postId, rewrittenContent)
      setPosts(posts.map(post => 
        post.id === rewriteModal.postId ? updatedPost : post
      ))
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    }
  }

  const handleApprove = async (postId: string) => {
    try {
      // Schedule for tomorrow at 9 AM as default
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      
      const updatedPost = await contentApi.updateStatus(postId, "SCHEDULED", tomorrow.toISOString())
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

  const handleReprocess = async (meetingId: string) => {
    try {
      await reprocessMeetingMutation.mutateAsync(meetingId)
      // Also reload posts as new ones will be generated
      setTimeout(() => {
        loadPosts()
      }, 2000)
      console.log("✅ Meeting reprocessing started")
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      console.error("❌ Failed to reprocess meeting:", apiError.message)
    }
  }

  const handleDelete = async (meetingId: string) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this meeting and all its content? This action cannot be undone.')) {
      return
    }

    try {
      await deleteMeetingMutation.mutateAsync(meetingId)
      // Also reload posts since they may have been deleted
      loadPosts()
      console.log("✅ Meeting deleted successfully")
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      console.error("❌ Failed to delete meeting:", apiError.message)
    }
  }



  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const pendingPosts = filteredPosts.filter(post => post.status === "PENDING")
  const scheduledPosts = filteredPosts.filter(post => post.status === "SCHEDULED")
  const rejectedPosts = filteredPosts.filter(post => post.status === "REJECTED")

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
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPosts}
              >
                Retry Posts
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => manualRefetchMeetings()}
              >
                Retry Meetings
              </Button>
            </div>
          </div>
        )}

        {/* Queue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Meetings Analyzed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {meetings.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Needs Review</p>
                <p className="text-3xl font-bold text-primary">
                  {pendingPosts.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Scheduled</p>
                <p className="text-3xl font-bold text-secondary">
                  {scheduledPosts.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Rejected</p>
                <p className="text-3xl font-bold text-destructive">
                  {rejectedPosts.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <X className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>


        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-2xl shadow-lg">
              <TabsTrigger
                value="meetings"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4" />
                Analyzed
              </TabsTrigger>
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
                value="rejected"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <X className="h-4 w-4" />
                Rejected
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="meetings" className="space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <h2 className="text-3xl font-bold text-foreground">Meetings Analyzed</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => manualRefetchMeetings()}
                  disabled={meetingsLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${meetingsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <p className="text-muted-foreground">
                {meetings.length} meetings with generated content
              </p>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => manualRefetchMeetings()}
                  disabled={meetingsLoading}
                >
                  {meetingsLoading ? "Loading..." : "Refresh Meetings"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onReprocess={handleReprocess}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {meetings.length === 0 && (
              <div className="text-center py-20">
                <div className="h-20 w-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No meetings analyzed yet</h3>
                <p className="text-muted-foreground text-lg">Meetings with generated content will appear here.</p>
              </div>
            )}
          </TabsContent>

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

          <TabsContent value="rejected">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Rejected Posts</h2>
                <p className="text-muted-foreground">
                  {rejectedPosts.length} posts that were rejected
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {rejectedPosts.map((post) => (
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
              
              {rejectedPosts.length === 0 && (
                <div className="text-center py-20">
                  <div className="h-20 w-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">No rejected posts</h3>
                  <p className="text-muted-foreground text-lg">Posts you reject will appear here.</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>

        {/* Rewrite Modal */}
        <RewriteModal
          isOpen={rewriteModal.isOpen}
          onClose={handleRewriteClose}
          originalContent={rewriteModal.content || ''}
          onAccept={handleRewriteAccept}
          onRewrite={handleRewriteSubmit}
        />
      </div>
    </div>
  )
}