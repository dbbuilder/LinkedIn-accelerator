import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye, Check, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { serverFetchJSON } from '@/lib/api'

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

async function getContent(): Promise<ContentDraft[]> {
  const content = await serverFetchJSON<ContentDraft[]>('/api/content')
  return content || []
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

export default async function ContentPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const content = await getContent()

  const stats = {
    total: content.length,
    draft: content.filter((c) => c.status === 'draft').length,
    approved: content.filter((c) => c.status === 'approved').length,
    rejected: content.filter((c) => c.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review your AI-generated LinkedIn content
          </p>
        </div>
        <Link href="/content/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      {content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No content yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate your first LinkedIn post using AI
                </p>
              </div>
              <Link href="/content/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Post
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Content</CardTitle>
            <CardDescription>
              {content.length} {content.length === 1 ? 'post' : 'posts'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {item.topic}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.content_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.tone}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/content/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
