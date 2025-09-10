"use client"

import { useState } from "react"
import { Calendar, Users, MessageSquare, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { HooksModal } from "./modals/HooksModal"

interface Meeting {
  id: string
  readaiId: string
  title?: string
  summary?: string
  processedStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  processedAt?: string
  createdAt: string
  contentHooks: Array<{
    id: string
    hook: string
    pillar?: string
    posts: Array<{
      id: string
      content: string
      status: string
    }>
  }>
}

interface MeetingCardProps {
  meeting: Meeting
  onReprocess: (meetingId: string) => void
  onDelete: (meetingId: string) => void
}

export function MeetingCard({ meeting, onReprocess, onDelete }: MeetingCardProps) {
  const [showHooksModal, setShowHooksModal] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completed'
      case 'PROCESSING': return 'Processing'
      case 'FAILED': return 'Failed'
      default: return 'Pending'
    }
  }

  const totalPosts = meeting.contentHooks?.reduce((total, hook) => 
    total + (hook.posts?.length || 0), 0
  ) || 0

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {meeting.title || 'Untitled Meeting'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {formatDateTime(meeting.createdAt)}
              </span>
            </div>
          </div>
          <Badge className={`${getStatusColor(meeting.processedStatus)} border-0`}>
            {getStatusText(meeting.processedStatus)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHooksModal(true)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors"
              disabled={!meeting.contentHooks?.length}
            >
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className={`text-sm ${meeting.contentHooks?.length ? 'text-blue-600 hover:text-blue-700 cursor-pointer' : 'text-gray-600'}`}>
                {meeting.contentHooks?.length || 0} hooks
              </span>
            </button>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {totalPosts} posts
              </span>
            </div>
          </div>
          
          {meeting.summary && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {meeting.summary}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onReprocess(meeting.id)}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reprocess
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(meeting.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>

      {/* Hooks Modal */}
      <HooksModal
        isOpen={showHooksModal}
        onClose={() => setShowHooksModal(false)}
        hooks={meeting.contentHooks || []}
        meetingTitle={meeting.title}
      />
    </Card>
  )
}