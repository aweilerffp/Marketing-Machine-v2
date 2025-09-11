"use client"

import { MessageSquare, Tag, FileText } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"

interface Hook {
  id: string
  hook: string
  pillar?: string
  posts: Array<{
    id: string
    content: string
    status: string
  }>
}

interface HooksModalProps {
  isOpen: boolean
  onClose: () => void
  hooks: Hook[]
  meetingTitle?: string
}

export function HooksModal({ isOpen, onClose, hooks, meetingTitle }: HooksModalProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Content Hooks</DialogTitle>
              <DialogDescription>
                {meetingTitle ? `From: ${meetingTitle}` : 'Meeting content hooks'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] bg-white">
          {hooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hooks yet</h3>
              <p className="text-gray-600">Hooks will appear here when the meeting is processed.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {hooks.map((hook, index) => (
                <div key={hook.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  {/* Hook Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Hook #{index + 1}</span>
                      {hook.pillar && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-purple-600" />
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                            {hook.pillar}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FileText className="h-3 w-3" />
                      {hook.posts.length} post{hook.posts.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Hook Content */}
                  <div className="bg-gray-50 rounded-md p-3 mb-3">
                    <p className="text-sm text-gray-800 leading-relaxed">{hook.hook}</p>
                  </div>

                  {/* Associated Posts */}
                  {hook.posts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Generated Posts
                      </h4>
                      <div className="grid gap-2">
                        {hook.posts.map((post) => (
                          <div key={post.id} className="flex items-start justify-between p-2 bg-white border border-gray-100 rounded">
                            <p className="text-xs text-gray-600 flex-1 mr-2 line-clamp-2">
                              {post.content ? post.content.substring(0, 100) + '...' : 'No content available'}
                            </p>
                            <Badge className={`${getStatusColor(post.status)} text-xs border-0`}>
                              {post.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 bg-white">
          <div className="text-sm text-gray-600">
            {hooks.length} hook{hooks.length !== 1 ? 's' : ''} • {hooks.reduce((total, hook) => total + hook.posts.length, 0)} total posts
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}