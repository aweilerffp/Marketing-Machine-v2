"use client"

import { useState } from "react"
import { Calendar, Clock, Edit3, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type PostStatus = "pending" | "approved" | "scheduled" | "rejected"

interface Post {
  id: string
  content: string
  imageUrl?: string
  imagePrompt?: string
  status: PostStatus
  createdAt: string
  scheduledFor?: string | null
  hook: {
    id: string
    hook: string
    pillar?: string
    meeting: {
      title?: string
      createdAt: string
    }
  }
}

interface PostCardProps {
  post: Post
  onRewrite: (postId: string) => void
  onApprove: (postId: string) => void
  onReject?: (postId: string) => void
  onSchedule?: (postId: string) => void
  isSelected?: boolean
  onSelect?: (postId: string, selected: boolean) => void
  showSelection?: boolean
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Check,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Calendar,
  },
  rejected: {
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
  isSelected = false,
  onSelect,
  showSelection = false,
}: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const status = statusConfig[post.status]
  const StatusIcon = status.icon

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
        <p className="text-sm text-card-foreground line-clamp-4 leading-relaxed">{post.content}</p>
        
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
        {post.status === "pending" && (
          <>
            <Button variant="outline" size="sm" onClick={() => onRewrite(post.id)} className="flex-1">
              <Edit3 className="h-3 w-3 mr-1" />
              Rewrite
            </Button>
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(post.id)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
            )}
            <Button size="sm" onClick={() => onApprove(post.id)} className="flex-1">
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
          </>
        )}

        {post.status === "approved" && onSchedule && (
          <Button size="sm" onClick={() => onSchedule(post.id)} className="w-full">
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Post
          </Button>
        )}

        {post.status === "scheduled" && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" disabled>
              <Calendar className="h-3 w-3 mr-1" />
              Scheduled
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSchedule?.(post.id)} className="flex-1">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit Schedule
            </Button>
          </>
        )}

        {post.status === "rejected" && (
          <Button size="sm" variant="destructive" className="w-full" disabled>
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}