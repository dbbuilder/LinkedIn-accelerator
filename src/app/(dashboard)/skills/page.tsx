import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Code, Wrench } from 'lucide-react'
import { serverFetchJSON } from '@/lib/api'

interface Tool {
  id: string
  tool_name: string
  category: string
  official_url: string
  created_at: string
}

interface Capability {
  id: string
  capability_name: string
  proficiency_level: string
  years_experience: number
  created_at: string
}

async function getTools(): Promise<Tool[]> {
  const tools = await serverFetchJSON<Tool[]>('/api/tc3d/tools', { requireAuth: false })
  return tools || []
}

async function getCapabilities(): Promise<Capability[]> {
  const capabilities = await serverFetchJSON<Capability[]>('/api/tc3d/capabilities', { requireAuth: false })
  return capabilities || []
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    language: 'bg-blue-100 text-blue-800 border-blue-200',
    framework: 'bg-green-100 text-green-800 border-green-200',
    library: 'bg-purple-100 text-purple-800 border-purple-200',
    tool: 'bg-orange-100 text-orange-800 border-orange-200',
    platform: 'bg-pink-100 text-pink-800 border-pink-200',
    database: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  }
  return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getProficiencyBadge(level: string) {
  switch (level.toLowerCase()) {
    case 'expert':
      return <Badge variant="success">Expert</Badge>
    case 'advanced':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Advanced</Badge>
    case 'intermediate':
      return <Badge variant="warning">Intermediate</Badge>
    case 'beginner':
      return <Badge variant="secondary">Beginner</Badge>
    default:
      return <Badge variant="outline">{level}</Badge>
  }
}

export default async function SkillsPage() {
  const [tools, capabilities] = await Promise.all([getTools(), getCapabilities()])

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    const category = tool.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(tool)
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Skills & Technologies</h1>
        <p className="text-muted-foreground mt-1">
          Your technical capabilities and tool expertise (TC3D)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tools & Technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Core Capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capabilities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(toolsByCategory).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Core Capabilities
            </CardTitle>
            <CardDescription>
              Your professional skills and expertise levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => (
                <div
                  key={capability.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{capability.capability_name}</h4>
                    {getProficiencyBadge(capability.proficiency_level)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {capability.years_experience} {capability.years_experience === 1 ? 'year' : 'years'} experience
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools by Category */}
      <div className="space-y-6">
        {Object.keys(toolsByCategory).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No tools configured</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add tools and technologies to showcase your expertise
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {category}
                </CardTitle>
                <CardDescription>
                  {categoryTools.length} {categoryTools.length === 1 ? 'tool' : 'tools'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {categoryTools.map((tool) => (
                    <a
                      key={tool.id}
                      href={tool.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium hover:shadow-md transition-all ${getCategoryColor(
                        tool.category
                      )}`}
                    >
                      {tool.tool_name}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
