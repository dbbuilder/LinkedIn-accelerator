'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, ExternalLink, Send } from 'lucide-react'
import Link from 'next/link'

interface Prospect {
  id: string
  full_name: string
  linkedin_url: string
  company?: string
  job_title?: string
  engagement_level: string
  notes?: string
  last_outreach?: string
  created_at: string
}

interface OutreachRecord {
  id: string
  message: string
  sent_at: string
}

function getEngagementBadge(level: string) {
  switch (level.toLowerCase()) {
    case 'high':
      return <Badge variant="success">High Engagement</Badge>
    case 'medium':
      return <Badge variant="warning">Medium Engagement</Badge>
    case 'low':
      return <Badge variant="secondary">Low Engagement</Badge>
    default:
      return <Badge variant="outline">{level}</Badge>
  }
}

export default function ProspectDetailPage() {
  const params = useParams()
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [outreachHistory, setOutreachHistory] = useState<OutreachRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch prospect details
        const prospectRes = await fetch(`/api/prospects/${params.id}`)
        if (prospectRes.ok) {
          const data = await prospectRes.json()
          setProspect(data)
        }

        // Fetch outreach history
        const outreachRes = await fetch(`/api/prospects/${params.id}/outreach`)
        if (outreachRes.ok) {
          const data = await outreachRes.json()
          setOutreachHistory(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  async function handleSendOutreach(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/prospects/${params.id}/outreach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (response.ok) {
        const newOutreach = await response.json()
        setOutreachHistory([newOutreach, ...outreachHistory])
        setMessage('')

        // Update last_outreach timestamp
        if (prospect) {
          setProspect({
            ...prospect,
            last_outreach: newOutreach.sent_at,
          })
        }
      }
    } catch (error) {
      console.error('Failed to send outreach:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading prospect...</p>
        </div>
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h3 className="font-semibold text-lg">Prospect not found</h3>
          <Link href="/prospects">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prospects
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
        <Link href="/prospects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{prospect.full_name}</h1>
            {getEngagementBadge(prospect.engagement_level)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              {prospect.job_title && prospect.company
                ? `${prospect.job_title} at ${prospect.company}`
                : prospect.job_title || prospect.company || 'No position information'}
            </p>
            <a
              href={prospect.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              View Profile
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Prospect Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prospect Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Engagement Level</Label>
                <div className="mt-1">{getEngagementBadge(prospect.engagement_level)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Contact</Label>
                <p className="text-sm mt-1">
                  {prospect.last_outreach
                    ? new Date(prospect.last_outreach).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Never contacted'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Added</Label>
                <p className="text-sm mt-1">
                  {new Date(prospect.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {prospect.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{prospect.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Outreach Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Send New Outreach */}
          <Card id="outreach">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Outreach Message
              </CardTitle>
              <CardDescription>
                Track your communication with this prospect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOutreach} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your outreach message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be logged in your outreach history
                  </p>
                </div>
                <Button type="submit" disabled={sending || !message.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Logging...' : 'Log Outreach'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Outreach History */}
          <Card>
            <CardHeader>
              <CardTitle>Outreach History</CardTitle>
              <CardDescription>
                {outreachHistory.length} {outreachHistory.length === 1 ? 'message' : 'messages'} sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {outreachHistory.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No outreach messages yet. Send your first message above.
                </div>
              ) : (
                <div className="space-y-4">
                  {outreachHistory.map((record) => (
                    <div
                      key={record.id}
                      className="border-l-2 border-primary pl-4 py-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(record.sent_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{record.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
