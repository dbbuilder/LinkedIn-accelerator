/**
 * DEVELOPMENT ONLY - AI Content Generation API Route (No Auth)
 * WARNING: This endpoint bypasses authentication and should NEVER be deployed to production
 */

import { NextRequest, NextResponse } from 'next/server'
import { OpenAIProvider } from '@/lib/ai/providers/openai-provider'
import { WritingAgent } from '@/lib/ai/agents/writing-agent'
import { z } from 'zod'

// Request validation schema
const GenerateRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  tone: z.enum(['professional', 'casual', 'inspirational', 'technical']),
  brandVoice: z.string().optional(),
  outline: z.array(z.string()).optional(),
  maxLength: z.number().optional(),
  stream: z.boolean().optional().default(false)
})

/**
 * POST /api/dev-auth/ai/generate
 * Generate LinkedIn content with AI (NO AUTH - DEV ONLY)
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
    const validatedInput = GenerateRequestSchema.parse(body)

    // Initialize AI provider and agent
    const provider = new OpenAIProvider()
    const agent = new WritingAgent(provider, 'gpt-4o-mini', 0.7)

    // Check if streaming is requested
    if (validatedInput.stream) {
      // Return Server-Sent Events stream
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of agent.generateStream(validatedInput)) {
              // Send chunk as SSE
              const data = `data: ${JSON.stringify({ delta: chunk })}\n\n`
              controller.enqueue(encoder.encode(data))
            }

            // Send completion signal
            const doneSignal = `data: ${JSON.stringify({ done: true })}\n\n`
            controller.enqueue(encoder.encode(doneSignal))
            controller.close()
          } catch (error: any) {
            // Send error and close
            const errorSignal = `data: ${JSON.stringify({ error: error.message })}\n\n`
            controller.enqueue(encoder.encode(errorSignal))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    // Non-streaming: Generate complete response
    const draft = await agent.generate(validatedInput)

    return NextResponse.json({
      success: true,
      draft,
      metadata: {
        model: 'gpt-4o-mini',
        provider: 'openai',
        tone: validatedInput.tone,
        characterCount: draft.characterCount
      },
      warning: 'DEV MODE - No authentication required'
    })
  } catch (error: any) {
    console.error('AI generation error:', error)

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

    // Handle AI provider errors
    if (error.name === 'AIProviderError') {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          provider: error.provider,
          retryable: error.retryable
        },
        { status: error.retryable ? 503 : 500 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dev-auth/ai/generate
 * Health check endpoint
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/dev-auth/ai/generate',
    warning: 'DEV MODE - No authentication required',
    env: process.env.NODE_ENV,
    openai_configured: !!process.env.OPENAI_API_KEY
  })
}
