/**
 * DEVELOPMENT ONLY - Venture Analysis API Route (No Auth)
 * Analyzes a venture and provides intelligent suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { OpenAIProvider } from '@/lib/ai/providers/openai-provider'
import { SuggestionAgent } from '@/lib/ai/agents/suggestion-agent'
import { z } from 'zod'

// Only allow in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('dev-auth endpoint should never be loaded in production')
}

const AnalyzeVentureRequestSchema = z.object({
  ventureName: z.string().min(1),
  website: z.string().url().optional(),
  description: z.string().optional(),
})

/**
 * POST /api/dev-auth/ai/analyze-venture
 * Analyze a venture and return suggestions
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
    const validatedInput = AnalyzeVentureRequestSchema.parse(body)

    // Initialize AI provider and agent
    const provider = new OpenAIProvider()
    const agent = new SuggestionAgent(provider, 'gpt-4o-mini', 0.3)

    // Analyze venture
    const insights = await agent.analyzeVenture(validatedInput)

    return NextResponse.json({
      success: true,
      insights,
      warning: 'DEV MODE - No authentication required'
    })
  } catch (error: any) {
    console.error('Venture analysis error:', error)

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
        error: 'Failed to analyze venture',
        message: error.message
      },
      { status: 500 }
    )
  }
}
