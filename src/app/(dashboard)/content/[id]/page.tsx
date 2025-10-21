'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, X, Copy, Clock } from 'lucide-react'
import Link from 'next/link'

interface ContentDraft {
  id: string
  venture_id: string
  content_type: string
  tone: string
  topic: string
  generated_content: string
  status: 'draft' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="success" className="flex items-center gap-1 w-fit">
          <Check className="h-3 w-3" />
          Approved
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <X className="h-3 w-3" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="warning" className="flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3" />
          Draft
        </Badge>
      )
  }
}

export default function ContentDetailPage() {
  const params = useParams()
  const [content, setContent] = useState<ContentDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/content/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setContent(data)
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [params.id])

  async function handleApprove() {
    if (!content) return

    setActionLoading('approve')
    try {
      const response = await fetch(`/api/content/${content.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      })

      if (response.ok) {
        const updated = await response.json()
        setContent(updated)
      }
    } catch (error) {
      console.error('Failed to approve content:', error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    if (!content) return

    setActionLoading('reject')
    try {
      const response = await fetch(`/api/content/${content.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: false }),
      })

      if (response.ok) {
        const updated = await response.json()
        setContent(updated)
      }
    } catch (error) {
      console.error('Failed to reject content:', error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCopy() {
    if (!content) return

    await navigator.clipboard.writeText(content.generated_content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h3 className="font-semibold text-lg">Content not found</h3>
          <Link href="/content">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Content Review</h1>
            {getStatusBadge(content.status)}
          </div>
          <p className="text-muted-foreground mt-1">{content.topic}</p>
        </div>
        {content.status === 'draft' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={actionLoading !== null}
            >
              <X className="h-4 w-4 mr-2" />
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading !== null}
            >
              <Check className="h-4 w-4 mr-2" />
              {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted p-6 rounded-lg whitespace-pre-wrap font-sans">
                  {content.generated_content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                <Badge variant="outline">{content.content_type}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Tone</h4>
                <Badge variant="secondary">{content.tone}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Topic</h4>
                <p className="text-sm">{content.topic}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                <p className="text-sm">
                  {new Date(content.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {content.approved_at && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    {content.status === 'approved' ? 'Approved' : 'Rejected'}
                  </h4>
                  <p className="text-sm">
                    {new Date(content.approved_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {content.status === 'approved' && (
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This content has been approved. You can now:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Copy and post to LinkedIn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Schedule for later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Generate similar content</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
