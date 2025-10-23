/**
 * DEVELOPMENT ONLY - Topic Suggestions API Route (No Auth)
 * Suggests content topics based on venture context
 */

import { NextRequest, NextResponse } from 'next/server'
import { OpenAIProvider } from '@/lib/ai/providers/openai-provider'
import { SuggestionAgent } from '@/lib/ai/agents/suggestion-agent'
import { z } from 'zod'

// Only allow in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('dev-auth endpoint should never be loaded in production')
}

const SuggestTopicsRequestSchema = z.object({
  ventureName: z.string().min(1),
  industry: z.string().optional(),
  targetAudience: z.array(z.string()).optional(),
  count: z.number().min(1).max(10).default(5),
})

/**
 * POST /api/dev-auth/ai/suggest-topics
 * Get personalized topic suggestions
 */
export async function POST(request: NextRequest) {
  try {
    // Development environment check
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validatedInput = SuggestTopicsRequestSchema.parse(body)

    // Initialize AI provider and agent
    const provider = new OpenAIProvider()
    const agent = new SuggestionAgent(provider, 'gpt-4o-mini', 0.7)

    // Get topic suggestions
    const topics = await agent.suggestTopics(validatedInput, validatedInput.count)

    return NextResponse.json({
      success: true,
      topics,
      warning: 'DEV MODE - No authentication required'
    })
  } catch (error: any) {
    console.error('Topic suggestion error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to suggest topics',
        message: error.message
      },
      { status: 500 }
    )
  }
}
