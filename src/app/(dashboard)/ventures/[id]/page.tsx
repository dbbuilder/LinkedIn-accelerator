import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Palette } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetchJSON } from '@/lib/api'

interface Venture {
  id: string
  venture_name: string
  industry: string
  target_audience: string
  unique_value_prop: string
  key_offerings: string
  created_at: string
}

interface BrandGuide {
  id: string
  voice_tone: string
  key_themes: string[]
  content_pillars: string[]
  communication_style: string
  created_at: string
}

async function getVenture(ventureId: string): Promise<Venture | null> {
  return serverFetchJSON<Venture>(`/api/ventures/${ventureId}`)
}

async function getBrandGuide(ventureId: string): Promise<BrandGuide | null> {
  return serverFetchJSON<BrandGuide>(`/api/ventures/${ventureId}/brand-guide`)
}

export default async function VentureDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const venture = await getVenture(params.id)

  if (!venture) {
    notFound()
  }

  const brandGuide = await getBrandGuide(params.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ventures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{venture.venture_name}</h1>
          <p className="text-muted-foreground mt-1">
            {venture.industry}
          </p>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Venture
        </Button>
      </div>

      {/* Venture Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Venture Information</CardTitle>
            <CardDescription>Core details about this venture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Audience</h4>
              <p className="text-sm">{venture.target_audience}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Unique Value Proposition</h4>
              <p className="text-sm">{venture.unique_value_prop}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Key Offerings</h4>
              <p className="text-sm">{venture.key_offerings}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
              <p className="text-sm">{new Date(venture.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Brand Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Guide
            </CardTitle>
            <CardDescription>
              {brandGuide ? 'Your brand identity and guidelines' : 'No brand guide set yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {brandGuide ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Voice & Tone</h4>
                  <p className="text-sm">{brandGuide.voice_tone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandGuide.key_themes.map((theme, index) => (
                      <Badge key={index} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Content Pillars</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandGuide.content_pillars.map((pillar, index) => (
                      <Badge key={index} variant="outline">
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Communication Style</h4>
                  <p className="text-sm">{brandGuide.communication_style}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a brand guide to establish consistent messaging
                </p>
                <Button variant="outline">
                  <Palette className="h-4 w-4 mr-2" />
                  Create Brand Guide
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content Performance</CardTitle>
          <CardDescription>
            Content generated for this venture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            No content generated yet. Create content in the Content section.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
