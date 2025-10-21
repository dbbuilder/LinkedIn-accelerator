'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Venture {
  id: string
  venture_name: string
}

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ventures, setVentures] = useState<Venture[]>([])
  const [formData, setFormData] = useState({
    venture_id: '',
    content_type: 'post',
    tone: 'professional',
    topic: '',
    keywords: '',
  })

  useEffect(() => {
    async function fetchVentures() {
      try {
        const response = await fetch('/api/ventures')
        if (response.ok) {
          const data = await response.json()
          setVentures(data)
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, venture_id: data[0].id }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch ventures:', error)
      }
    }
    fetchVentures()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const content = await response.json()
        router.push(`/content/${content.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate content. Please try again.')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (ventures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Generate Content</h1>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-lg">No Ventures Found</h3>
              <p className="text-sm text-muted-foreground">
                You need to create a venture before generating content
              </p>
              <Link href="/ventures/new">
                <Button>Create Your First Venture</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
        <div>
          <h1 className="text-3xl font-bold">Generate New Content</h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered LinkedIn content
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Content Parameters</CardTitle>
          <CardDescription>
            Specify what you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="venture_id">Venture *</Label>
              <Select
                id="venture_id"
                value={formData.venture_id}
                onChange={(e) =>
                  setFormData({ ...formData, venture_id: e.target.value })
                }
                required
              >
                {ventures.map((venture) => (
                  <option key={venture.id} value={venture.id}>
                    {venture.venture_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type *</Label>
                <Select
                  id="content_type"
                  value={formData.content_type}
                  onChange={(e) =>
                    setFormData({ ...formData, content_type: e.target.value })
                  }
                  required
                >
                  <option value="post">LinkedIn Post</option>
                  <option value="article">Article</option>
                  <option value="thought_leadership">Thought Leadership</option>
                  <option value="announcement">Announcement</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone *</Label>
                <Select
                  id="tone"
                  value={formData.tone}
                  onChange={(e) =>
                    setFormData({ ...formData, tone: e.target.value })
                  }
                  required
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                  <option value="conversational">Conversational</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                placeholder="e.g., Latest industry trends in AI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (optional)</Label>
              <Textarea
                id="keywords"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="Comma-separated keywords to include..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add specific keywords or themes you want included
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>
              <Link href="/content">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
