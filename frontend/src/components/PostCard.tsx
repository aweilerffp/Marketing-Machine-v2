"use client"

import { useState } from "react"
import { Calendar, Clock, Edit3, Check, X, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { cn } from "../lib/utils"
import type { ContentPost } from "../services/api"

interface PostCardProps {
  post: ContentPost
  onRewrite: (postId: string) => void
  onApprove: (postId: string) => void
  onReject?: (postId: string) => void
  onSchedule?: (postId: string) => void
  onView?: (postId: string) => void
  isSelected?: boolean
  onSelect?: (postId: string, selected: boolean) => void
  showSelection?: boolean
  loadingStates?: Record<string, boolean>
}

const statusConfig = {
  PENDING: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Check,
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Calendar,
  },
  PUBLISHED: {
    label: "Published",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Check,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X,
  },
}

export function PostCard({
  post,
  onRewrite,
  onApprove,
  onReject,
  onSchedule,
  onView,
  isSelected = false,
  onSelect,
  showSelection = false,
  loadingStates = {},
}: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const status = statusConfig[post.status]
  const StatusIcon = status.icon
  
  // Loading states for each action
  const isRewriteLoading = loadingStates[`rewrite-${post.id}`] || false
  const isApproveLoading = loadingStates[`approve-${post.id}`] || false
  const isRejectLoading = loadingStates[`reject-${post.id}`] || false

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow duration-200",
        isSelected && "ring-2 ring-primary bg-primary/5",
      )}
    >
      <CardHeader className="p-0">
        <div className="relative">
          {post.imageUrl && (
            <>
              <img
                src={post.imageUrl}
                alt="Post preview"
                className={cn(
                  "w-full h-48 object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0",
                )}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && <div className="w-full h-48 bg-muted animate-pulse" />}
            </>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={cn("border", status.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          {showSelection && onSelect && (
            <div className="absolute top-3 left-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(post.id, checked as boolean)}
                className="bg-white/90 border-white"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div 
          className={cn(
            "text-sm text-card-foreground line-clamp-4 leading-relaxed",
            onView && "cursor-pointer hover:text-primary transition-colors"
          )}
          onClick={() => onView?.(post.id)}
          title={onView ? "Click to view full post" : undefined}
        >
          {post.content}
        </div>
        
        {post.hook?.hook && (
          <div className="mt-3 p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground font-medium">Hook:</p>
            <p className="text-xs text-muted-foreground">{post.hook.hook}</p>
          </div>
        )}

        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Created {formatDate(post.createdAt)}</span>
          </div>
          {post.scheduledFor && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Scheduled for {formatDate(post.scheduledFor)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {post.status === "PENDING" && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRewrite(post.id)} 
              disabled={isRewriteLoading}
              className="flex-1 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-150"
            >
              {isRewriteLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Edit3 className="h-3 w-3 mr-1" />
              )}
              Rewrite
            </Button>
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(post.id)}
                disabled={isRejectLoading}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejectLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <X className="h-3 w-3 mr-1" />
                )}
                Reject
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => onApprove(post.id)} 
              disabled={isApproveLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproveLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Approve
            </Button>
          </>
        )}

        {post.status === "APPROVED" && onSchedule && (
          <Button 
            size="sm" 
            onClick={() => onSchedule(post.id)} 
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Post
          </Button>
        )}

        {post.status === "SCHEDULED" && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" disabled>
              <Calendar className="h-3 w-3 mr-1" />
              Scheduled
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onSchedule?.(post.id)} 
              className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all duration-150"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Schedule
            </Button>
          </>
        )}

        {post.status === "REJECTED" && (
          <Button size="sm" variant="destructive" className="w-full" disabled>
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}