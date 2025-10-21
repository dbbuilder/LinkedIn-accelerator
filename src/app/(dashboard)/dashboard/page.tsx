import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  FileText,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { serverFetchJSON } from '@/lib/api'

interface Venture {
  id: string
  venture_name: string
}

interface ContentDraft {
  id: string
  topic: string
  status: 'draft' | 'approved' | 'rejected'
  created_at: string
}

interface Prospect {
  id: string
  full_name: string
  company?: string
  job_title?: string
  engagement_level: string
}

async function getDashboardData() {
  const [ventures, content, prospects] = await Promise.all([
    serverFetchJSON<Venture[]>('/api/ventures'),
    serverFetchJSON<ContentDraft[]>('/api/content'),
    serverFetchJSON<Prospect[]>('/api/prospects'),
  ])

  return {
    ventures: ventures || [],
    content: content || [],
    prospects: prospects || [],
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Pending review'
    case 'approved':
      return 'Ready to publish'
    case 'rejected':
      return 'Needs revision'
    default:
      return status
  }
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const { ventures, content, prospects } = await getDashboardData()

  const stats = {
    totalContent: content.length,
    pendingContent: content.filter((c) => c.status === 'draft').length,
    totalProspects: prospects.length,
    highEngagement: prospects.filter((p) => p.engagement_level.toLowerCase() === 'high').length,
    totalVentures: ventures.length,
  }

  const recentContent = content.slice(0, 3)
  const topProspects = prospects
    .filter((p) => p.engagement_level.toLowerCase() === 'high')
    .slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground mt-1">
          Here is what is happening with your professional brand today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingContent > 0
                ? `${stats.pendingContent} pending review`
                : 'No pending reviews'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProspects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.highEngagement > 0
                ? `${stats.highEngagement} high engagement`
                : 'Total prospects'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ventures</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVentures}</div>
            <p className="text-xs text-muted-foreground">
              Professional ventures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalContent + stats.totalProspects}
            </div>
            <p className="text-xs text-muted-foreground">
              Total activity items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Content
            </CardTitle>
            <CardDescription>
              Your latest AI-generated drafts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentContent.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No content yet. Generate your first post!
              </div>
            ) : (
              <div className="space-y-3">
                {recentContent.map((item) => (
                  <Link key={item.id} href={`/content/${item.id}`}>
                    <div className="flex items-start space-x-3 p-3 bg-accent/50 rounded-md hover:bg-accent transition-colors">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{item.topic}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === 'approved'
                                ? 'success'
                                : item.status === 'rejected'
                                ? 'destructive'
                                : 'warning'
                            }
                            className="text-xs"
                          >
                            {getStatusText(item.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/content">
              <Button variant="outline" className="w-full">
                View All Content
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top Prospects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Prospects
            </CardTitle>
            <CardDescription>
              High-priority network targets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProspects.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No high-engagement prospects yet
              </div>
            ) : (
              <div className="space-y-3">
                {topProspects.map((prospect) => (
                  <Link key={prospect.id} href={`/prospects/${prospect.id}`}>
                    <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-md hover:bg-accent transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {getInitials(prospect.full_name)}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{prospect.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {prospect.job_title && prospect.company
                            ? `${prospect.job_title} at ${prospect.company}`
                            : prospect.job_title || prospect.company || 'No details'}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/prospects">
              <Button variant="outline" className="w-full">
                View All Prospects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/content/new">
              <Button className="w-full h-auto py-6 flex-col space-y-2" variant="outline">
                <FileText className="h-6 w-6" />
                <span>Generate Content</span>
              </Button>
            </Link>

            <Link href="/prospects/new">
              <Button className="w-full h-auto py-6 flex-col space-y-2" variant="outline">
                <Users className="h-6 w-6" />
                <span>Add Prospect</span>
              </Button>
            </Link>

            <Link href="/ventures/new">
              <Button className="w-full h-auto py-6 flex-col space-y-2" variant="outline">
                <Target className="h-6 w-6" />
                <span>New Venture</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
