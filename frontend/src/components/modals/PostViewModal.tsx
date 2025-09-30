"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "../ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Calendar, Clock, Check, X } from "lucide-react"
import { cn } from "../../lib/utils"
import type { ContentPost } from "../../services/api"

interface PostViewModalProps {
  isOpen: boolean
  onClose: () => void
  post: ContentPost | null
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

export function PostViewModal({ isOpen, onClose, post }: PostViewModalProps) {
  if (!post) return null

  const status = statusConfig[post.status]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-full flex flex-col p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Full Post Content</h2>
                <Badge className={cn("border", status.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              {/* Post Image */}
              {post.imageUrl && (
                <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                  <img
                    src={post.imageUrl}
                    alt="Post preview"
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              {/* Post Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Post Content</h3>
                  <div className="p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                {/* Hook Information */}
                {post.hook?.hook && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Content Hook</h3>
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">Hook:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{post.hook.hook}</p>
                      {post.hook.pillar && (
                        <>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1 mt-3">Content Pillar:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{post.hook.pillar}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Prompt */}
                {post.imagePrompt && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Image Prompt</h3>
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{post.imagePrompt}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Post Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Created: {formatDate(post.createdAt)}</span>
                    </div>
                    {post.scheduledFor && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled: {formatDate(post.scheduledFor)}</span>
                      </div>
                    )}
                    {post.publishedAt && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Published: {formatDate(post.publishedAt)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Post ID:</span>
                      <span className="font-mono text-xs">{post.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}