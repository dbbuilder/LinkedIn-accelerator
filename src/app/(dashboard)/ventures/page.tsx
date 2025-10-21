import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { serverFetchJSON } from '@/lib/api'

interface Venture {
  id: string
  venture_name: string
  industry: string
  target_audience: string
  unique_value_prop: string
  created_at: string
  has_brand_guide?: boolean
}

async function getVentures(): Promise<Venture[]> {
  const ventures = await serverFetchJSON<Venture[]>('/api/ventures')
  return ventures || []
}

export default async function VenturesPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const ventures = await getVentures()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Ventures</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional ventures and brand identities
          </p>
        </div>
        <Link href="/ventures/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Venture
          </Button>
        </Link>
      </div>

      {/* Ventures Table */}
      {ventures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No ventures yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first venture to start building your professional brand
                </p>
              </div>
              <Link href="/ventures/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Venture
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Ventures</CardTitle>
            <CardDescription>
              {ventures.length} {ventures.length === 1 ? 'venture' : 'ventures'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venture Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Brand Guide</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventures.map((venture) => (
                  <TableRow key={venture.id}>
                    <TableCell className="font-medium">
                      {venture.venture_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{venture.industry}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {venture.target_audience}
                    </TableCell>
                    <TableCell>
                      {venture.has_brand_guide ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Not Set</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(venture.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/ventures/${venture.id}`}>
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
