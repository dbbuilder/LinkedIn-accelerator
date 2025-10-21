import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye, Mail, Check, Clock } from 'lucide-react'
import Link from 'next/link'
import { serverFetchJSON } from '@/lib/api'

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

async function getProspects(): Promise<Prospect[]> {
  const prospects = await serverFetchJSON<Prospect[]>('/api/prospects')
  return prospects || []
}

function getEngagementBadge(level: string) {
  switch (level.toLowerCase()) {
    case 'high':
      return <Badge variant="success">High</Badge>
    case 'medium':
      return <Badge variant="warning">Medium</Badge>
    case 'low':
      return <Badge variant="secondary">Low</Badge>
    default:
      return <Badge variant="outline">{level}</Badge>
  }
}

export default async function ProspectsPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const prospects = await getProspects()

  const stats = {
    total: prospects.length,
    high: prospects.filter((p) => p.engagement_level.toLowerCase() === 'high').length,
    contacted: prospects.filter((p) => p.last_outreach).length,
    pending: prospects.filter((p) => !p.last_outreach).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Network Prospects</h1>
          <p className="text-muted-foreground mt-1">
            Track and engage with your professional network
          </p>
        </div>
        <Link href="/prospects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Prospects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contacted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects Table */}
      {prospects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No prospects yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start building your professional network
                </p>
              </div>
              <Link href="/prospects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Prospect
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Prospects</CardTitle>
            <CardDescription>
              {prospects.length} {prospects.length === 1 ? 'prospect' : 'prospects'} in your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{prospect.full_name}</span>
                        <a
                          href={prospect.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{prospect.company || '—'}</TableCell>
                    <TableCell>{prospect.job_title || '—'}</TableCell>
                    <TableCell>{getEngagementBadge(prospect.engagement_level)}</TableCell>
                    <TableCell>
                      {prospect.last_outreach ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Check className="h-3 w-3 text-green-600" />
                          {new Date(prospect.last_outreach).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Not contacted
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/prospects/${prospect.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/prospects/${prospect.id}#outreach`}>
                          <Button variant="ghost" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
