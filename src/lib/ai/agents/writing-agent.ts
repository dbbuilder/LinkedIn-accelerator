/**
 * Writing Agent
 * Generates polished LinkedIn content based on topic and brand guidelines
 */

import type {
  CompletionRequest,
  CompletionResponse,
  AIProvider,
  ContentDraft
} from '../types'
import { ContentDraftSchema, ValidationError } from '../types'
import { z } from 'zod'

export interface WritingAgentInput {
  topic: string
  tone: 'professional' | 'casual' | 'inspirational' | 'technical'
  brandVoice?: string
  outline?: string[]
  maxLength?: number
}

export class WritingAgent {
  private provider: AIProvider
  private model: string
  private temperature: number

  constructor(provider: AIProvider, model: string = 'gpt-4o-mini', temperature: number = 0.7) {
    this.provider = provider
    this.model = model
    this.temperature = temperature
  }

  /**
   * Generate LinkedIn content
   */
  async generate(input: WritingAgentInput): Promise<ContentDraft> {
    const systemPrompt = this.buildSystemPrompt(input)
    const userPrompt = this.buildUserPrompt(input)

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.temperature,
      maxTokens: 2000,
      stream: false
    }

    const response = await this.provider.complete(request)

    // Parse and validate the response
    return this.parseResponse(response, input)
  }

  /**
   * Stream LinkedIn content generation
   */
  async *generateStream(input: WritingAgentInput): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt(input)
    const userPrompt = this.buildUserPrompt(input)

    const request: CompletionRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.temperature,
      maxTokens: 2000,
      stream: true
    }

    for await (const chunk of this.provider.stream(request)) {
      yield chunk.delta
    }
  }

  /**
   * Build system prompt based on tone and brand voice
   */
  private buildSystemPrompt(input: WritingAgentInput): string {
    const toneInstructions = {
      professional: 'authoritative, polished, and business-focused. Use industry terminology appropriately.',
      casual: 'conversational, relatable, and approachable. Use contractions and speak directly to the reader.',
      inspirational: 'motivating, aspirational, and emotionally resonant. Focus on growth and possibility.',
      technical: 'precise, detailed, and analytical. Include specific technical insights and data.'
    }

    return `You are an expert LinkedIn content writer specializing in high-engagement professional posts.

# Your Writing Style
- Tone: ${input.tone} - ${toneInstructions[input.tone]}
${input.brandVoice ? `- Brand Voice: ${input.brandVoice}` : ''}
- Always use active voice, never passive
- Write scannable content with line breaks every 1-2 sentences
- Start with a strong hook that creates curiosity or addresses a pain point
- Use storytelling and specific examples when possible
- End with a clear, actionable CTA (Call-To-Action)

# LinkedIn Best Practices
- Optimal length: 1,200-1,800 characters for maximum engagement
- Use line breaks for readability
- Include 1-3 relevant emojis maximum (optional, use sparingly)
- Add 3-5 relevant hashtags at the end
- First line must hook readers (appears in feed preview)

# Content Structure
1. Hook (1-2 sentences) - Grab attention
2. Context (1-2 sentences) - Set the stage
3. Main Points (3-4 sentences) - Core value/insights
4. Example/Story (2-3 sentences) - Make it concrete
5. Takeaway (1 sentence) - Key lesson
6. CTA (1 sentence) - What should readers do?
7. Hashtags (3-5)

# Rules
- Never use clickbait or misleading hooks
- Be authentic and genuine
- Provide real value in every post
- Avoid clichés and overused phrases
- Do not use more than 3 emojis total`
  }

  /**
   * Build user prompt with specific requirements
   */
  private buildUserPrompt(input: WritingAgentInput): string {
    let prompt = `Write a LinkedIn post about: ${input.topic}\n\n`

    if (input.outline && input.outline.length > 0) {
      prompt += `Follow this outline:\n${input.outline.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n`
    }

    if (input.maxLength) {
      prompt += `Maximum length: ${input.maxLength} characters\n\n`
    }

    prompt += `Generate the complete LinkedIn post now. Return ONLY the post text, no additional commentary.`

    return prompt
  }

  /**
   * Parse and validate the response
   */
  private parseResponse(response: CompletionResponse, input: WritingAgentInput): ContentDraft {
    const postText = response.content.trim()
    const characterCount = postText.length

    // Create draft object
    const draft: ContentDraft = {
      postText,
      characterCount,
      altText: `LinkedIn post about ${input.topic}`,
      suggestedImage: undefined,
      variants: []
    }

    // Validate using Zod schema
    try {
      return ContentDraftSchema.parse(draft)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid content draft format', error)
      }
      throw error
    }
  }

  /**
   * Revise content based on feedback
   */
  async revise(originalDraft: string, feedback: string): Promise<ContentDraft> {
    const request: CompletionRequest = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn content editor. Revise the post based on the feedback while maintaining professional quality and engagement.'
        },
        {
          role: 'user',
          content: `Original Post:\n${originalDraft}\n\nFeedback:\n${feedback}\n\nProvide the revised post. Return ONLY the improved post text, no additional commentary.`
        }
      ],
      temperature: this.temperature,
      maxTokens: 2000,
      stream: false
    }

    const response = await this.provider.complete(request)

    return {
      postText: response.content.trim(),
      characterCount: response.content.trim().length,
      altText: 'Revised LinkedIn post',
      variants: []
    }
  }
}
