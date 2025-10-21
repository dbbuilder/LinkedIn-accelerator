/**
 * AI Content Generation API Route
 * Generates LinkedIn posts using Writing Agent with streaming support
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
 * POST /api/ai/generate
 * Generate LinkedIn content with AI
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Parse and validate request
    const body = await request.json()
    const validatedInput = GenerateRequestSchema.parse(body)

    // 3. Initialize AI provider and agent
    const provider = new OpenAIProvider()
    const agent = new WritingAgent(provider, 'gpt-4o-mini', 0.7)

    // 4. Check if streaming is requested
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

    // 5. Non-streaming: Generate complete response
    const draft = await agent.generate(validatedInput)

    return NextResponse.json({
      success: true,
      draft,
      metadata: {
        model: 'gpt-4o-mini',
        provider: 'openai',
        tone: validatedInput.tone,
        characterCount: draft.characterCount
      }
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
 * POST /api/ai/generate/revise
 * Revise existing content based on feedback
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Parse request
    const { originalDraft, feedback } = await request.json()

    if (!originalDraft || !feedback) {
      return NextResponse.json(
        { error: 'originalDraft and feedback are required' },
        { status: 400 }
      )
    }

    // 3. Initialize AI and revise
    const provider = new OpenAIProvider()
    const agent = new WritingAgent(provider)

    const revisedDraft = await agent.revise(originalDraft, feedback)

    return NextResponse.json({
      success: true,
      draft: revisedDraft,
      metadata: {
        model: 'gpt-4o-mini',
        provider: 'openai',
        revised: true
      }
    })
  } catch (error: any) {
    console.error('AI revision error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revise content',
        message: error.message
      },
      { status: 500 }
    )
  }
}
