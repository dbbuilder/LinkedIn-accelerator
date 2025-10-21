'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewVenturePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    venture_name: '',
    industry: '',
    target_audience: '',
    unique_value_prop: '',
    key_offerings: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/ventures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const venture = await response.json()
        router.push(`/ventures/${venture.id}`)
      } else {
        alert('Failed to create venture. Please try again.')
      }
    } catch (error) {
      console.error('Error creating venture:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ventures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Venture</h1>
          <p className="text-muted-foreground mt-1">
            Define your professional venture
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Venture Details</CardTitle>
          <CardDescription>
            Provide information about your professional venture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="venture_name">Venture Name *</Label>
              <Input
                id="venture_name"
                value={formData.venture_name}
                onChange={(e) =>
                  setFormData({ ...formData, venture_name: e.target.value })
                }
                placeholder="e.g., Tech Consulting Services"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="e.g., Technology, Healthcare, Finance"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience *</Label>
              <Textarea
                id="target_audience"
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
                placeholder="Describe who you serve..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unique_value_prop">Unique Value Proposition *</Label>
              <Textarea
                id="unique_value_prop"
                value={formData.unique_value_prop}
                onChange={(e) =>
                  setFormData({ ...formData, unique_value_prop: e.target.value })
                }
                placeholder="What makes you different?"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_offerings">Key Offerings *</Label>
              <Textarea
                id="key_offerings"
                value={formData.key_offerings}
                onChange={(e) =>
                  setFormData({ ...formData, key_offerings: e.target.value })
                }
                placeholder="What services or products do you offer?"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Venture'}
              </Button>
              <Link href="/ventures">
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
