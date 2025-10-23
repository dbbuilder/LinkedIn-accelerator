/**
 * Suggestion Agent
 * Provides intelligent suggestions for venture setup, topics, and next steps
 */

import type {
  CompletionRequest,
  CompletionResponse,
  AIProvider,
} from '../types'
import { z } from 'zod'

// =====================================================
// Type Definitions
// =====================================================

export const WebsiteInsightsSchema = z.object({
  industry: z.string(),
  targetAudience: z.array(z.string()),
  brandVoice: z.string(),
  contentThemes: z.array(z.string()),
  competitors: z.array(z.string()).optional(),
  mission: z.string().optional(),
})

export type WebsiteInsights = z.infer<typeof WebsiteInsightsSchema>

export const TopicSuggestionSchema = z.object({
  topic: z.string(),
  rationale: z.string(),
  matchScore: z.number().min(0).max(100),
  engagementPotential: z.enum(['low', 'medium', 'high']),
  suggestedTone: z.enum(['professional', 'casual', 'inspirational', 'technical']),
})

export type TopicSuggestion = z.infer<typeof TopicSuggestionSchema>

export interface VentureContext {
  ventureName: string
  industry?: string
  targetAudience?: string[]
  website?: string
}

export interface AnalyzeVentureInput {
  ventureName: string
  website?: string
  description?: string
}

// =====================================================
// Suggestion Agent
// =====================================================

export class SuggestionAgent {
  private provider: AIProvider
  private model: string
  private temperature: number

  constructor(provider: AIProvider, model: string = 'gpt-4o-mini', temperature: number = 0.3) {
    this.provider = provider
    this.model = model
    this.temperature = temperature // Lower temperature for more focused suggestions
  }

  /**
   * Analyzes a venture (with optional website) and provides intelligent insights
   */
  async analyzeVenture(input: AnalyzeVentureInput): Promise<WebsiteInsights> {
    const systemPrompt = `You are an expert business analyst and LinkedIn content strategist.
Your job is to analyze a business and provide actionable insights for their LinkedIn content strategy.

Analyze the provided information and return a JSON object with:
- industry: The primary industry category
- targetAudience: Array of 3-5 specific audience personas (e.g., "Software Developers", "CTOs", "Tech Leaders")
- brandVoice: Description of the appropriate brand voice (1 sentence)
- contentThemes: Array of 5-7 content themes that would resonate with their audience
- mission: Brief mission statement if discernible (optional)

Be specific and actionable. Focus on what will perform well on LinkedIn.`

    const userPrompt = `Analyze this business:

Business Name: ${input.ventureName}
${input.website ? `Website: ${input.website}` : ''}
${input.description ? `Description: ${input.description}` : ''}

${!input.website && !input.description ?
  'Note: Limited information provided. Use the business name to infer likely industry and audience.' :
  ''}

Return ONLY a valid JSON object matching this structure:
{
  "industry": "string",
  "targetAudience": ["persona1", "persona2", "persona3"],
  "brandVoice": "string",
  "contentThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "mission": "string (optional)"
}`

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.temperature,
      maxTokens: 1000,
      stream: false
    }

    const response = await this.provider.complete(request)

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return WebsiteInsightsSchema.parse(parsed)
  }

  /**
   * Suggests content topics based on venture context
   */
  async suggestTopics(context: VentureContext, count: number = 5): Promise<TopicSuggestion[]> {
    const systemPrompt = `You are a LinkedIn content strategist specializing in high-engagement topics.
Your job is to suggest specific, actionable content topics that will perform well for this business.

Consider:
- Current trends in the industry
- What resonates with the target audience
- Topics with proven engagement on LinkedIn
- Unique angles that differentiate from competitors

Return a JSON array of topic suggestions with scoring and reasoning.`

    const userPrompt = `Suggest ${count} content topics for:

Business: ${context.ventureName}
Industry: ${context.industry || 'Unknown'}
Target Audience: ${context.targetAudience?.join(', ') || 'General professional audience'}

Return ONLY a valid JSON array matching this structure:
[
  {
    "topic": "Specific, engaging topic (full sentence)",
    "rationale": "Why this topic will work (2-3 sentences)",
    "matchScore": 85 (0-100 how well it matches the business),
    "engagementPotential": "high" (low/medium/high),
    "suggestedTone": "professional" (professional/casual/inspirational/technical)
  }
]

Make topics specific and actionable, not generic. Focus on what will actually perform well.`

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Higher temperature for creative topics
      maxTokens: 2000,
      stream: false
    }

    const response = await this.provider.complete(request)

    // Parse JSON response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return z.array(TopicSuggestionSchema).parse(parsed)
  }

  /**
   * Analyzes generated content and suggests next steps
   */
  async suggestNextSteps(contentDraft: string, ventureContext: VentureContext): Promise<string[]> {
    const systemPrompt = `You are a LinkedIn content strategist helping a user build their content calendar.
Based on content they just created, suggest 3-4 specific, actionable next steps.

Suggestions should be:
- Specific (not "create more content", but "Create a follow-up post about X")
- Actionable (user can do it immediately)
- Strategic (builds on the current content)

Examples:
- "Create a follow-up post diving deeper into the technical implementation"
- "Generate a carousel breaking down these 5 key points visually"
- "Schedule 2 more posts this week on related topics"
- "Create a LinkedIn article expanding on this concept"`

    const userPrompt = `Just created this content:
"${contentDraft.slice(0, 500)}..."

For: ${ventureContext.ventureName} (${ventureContext.industry || 'General'})

Suggest 3-4 specific next steps. Return as a JSON array of strings:
["Step 1", "Step 2", "Step 3"]`

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.temperature,
      maxTokens: 500,
      stream: false
    }

    const response = await this.provider.complete(request)

    // Parse JSON response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    return JSON.parse(jsonMatch[0])
  }

  /**
   * Determines optimal posting schedule based on audience
   */
  async suggestSchedule(ventureContext: VentureContext): Promise<{
    optimalDays: string[]
    optimalTimes: string[]
    reasoning: string
  }> {
    const systemPrompt = `You are a LinkedIn analytics expert specializing in optimal posting times.
Based on the target audience, suggest the best days and times to post for maximum engagement.

Consider:
- When the target audience is most active on LinkedIn
- Industry-specific patterns
- Professional vs consumer audiences

Return specific recommendations with reasoning.`

    const userPrompt = `Suggest optimal posting schedule for:

Business: ${ventureContext.ventureName}
Industry: ${ventureContext.industry || 'Unknown'}
Target Audience: ${ventureContext.targetAudience?.join(', ') || 'General professionals'}

Return ONLY a valid JSON object:
{
  "optimalDays": ["Tuesday", "Thursday"],
  "optimalTimes": ["9:00 AM", "2:00 PM"],
  "reasoning": "Brief explanation (2-3 sentences)"
}`

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.temperature,
      maxTokens: 500,
      stream: false
    }

    const response = await this.provider.complete(request)

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    return JSON.parse(jsonMatch[0])
  }
}
