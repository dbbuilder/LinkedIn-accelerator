'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Sparkles, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Venture {
  id: string
  venture_name: string
}

interface GeneratedContent {
  postText: string
  characterCount: number
  altText?: string
}

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [ventures, setVentures] = useState<Venture[]>([])
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [streamedText, setStreamedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    venture_id: '',
    tone: 'professional',
    topic: '',
    maxLength: 1500,
    useStreaming: false,
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

  async function handleGenerateStreaming() {
    setStreaming(true)
    setStreamedText('')
    setGeneratedContent(null)

    try {
      const response = await fetch('/api/dev-auth/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          tone: formData.tone,
          maxLength: formData.maxLength,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            try {
              const data = JSON.parse(jsonStr)
              if (data.delta) {
                fullText += data.delta
                setStreamedText(fullText)
              } else if (data.done) {
                setGeneratedContent({
                  postText: fullText,
                  characterCount: fullText.length,
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  async function handleGenerateNonStreaming() {
    setLoading(true)
    setGeneratedContent(null)

    try {
      const response = await fetch('/api/dev-auth/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          tone: formData.tone,
          maxLength: formData.maxLength,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data.draft)
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.useStreaming) {
      await handleGenerateStreaming()
    } else {
      await handleGenerateNonStreaming()
    }
  }

  async function handleSaveToDatabase() {
    if (!generatedContent) return

    setLoading(true)
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venture_id: formData.venture_id,
          topic: formData.topic,
          original_text: generatedContent.postText,
          edited_text: generatedContent.postText,
          status: 'pending_review',
        }),
      })

      if (response.ok) {
        const content = await response.json()
        router.push(`/content/${content.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save content. Please try again.')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyToClipboard() {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.postText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Content Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create professional LinkedIn content in seconds
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Content Parameters</CardTitle>
            <CardDescription>
              Tell us what you want to create
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

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="e.g., The future of AI in software development"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Be specific to get better results
                </p>
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
                  <option value="technical">Technical</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLength">Max Length (characters)</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={formData.maxLength}
                  onChange={(e) =>
                    setFormData({ ...formData, maxLength: parseInt(e.target.value) })
                  }
                  min={500}
                  max={3000}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1,200-1,800 for optimal engagement
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useStreaming"
                  checked={formData.useStreaming}
                  onChange={(e) =>
                    setFormData({ ...formData, useStreaming: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="useStreaming" className="text-sm font-normal cursor-pointer">
                  Enable real-time streaming (watch it write!)
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading || streaming}
                className="w-full"
              >
                {loading || streaming ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              {generatedContent || streamedText
                ? `${(generatedContent?.characterCount || streamedText.length).toLocaleString()} characters`
                : 'Your content will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {streaming && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  Writing in real-time...
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap border rounded-lg p-4 min-h-[400px] bg-muted/50">
                  {streamedText}
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </div>
              </div>
            )}

            {!streaming && generatedContent && (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap border rounded-lg p-4 min-h-[400px]">
                  {generatedContent.postText}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveToDatabase}
                    disabled={loading}
                    className="flex-1"
                  >
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}

            {!streaming && !generatedContent && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Fill in the form and click Generate to create AI-powered content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
