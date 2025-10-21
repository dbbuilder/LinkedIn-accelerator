/**
 * OpenAI Provider Implementation
 * Default provider using GPT-4o-mini for cost-effective content generation
 */

import { ChatOpenAI } from '@langchain/openai'
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  CompletionChunk,
  ModelConfig,
  TokenUsage,
  ProviderName
} from '../types'
import { AIProviderError, RateLimitError } from '../types'

export class OpenAIProvider implements AIProvider {
  name: ProviderName = 'openai'
  private apiKey: string

  models: ModelConfig[] = [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      contextWindow: 128000,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
      supportsTools: true,
      supportsStreaming: true,
      recommended: true  // Default model
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      contextWindow: 128000,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
      supportsTools: true,
      supportsStreaming: true
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      contextWindow: 128000,
      costPer1kInput: 0.01,
      costPer1kOutput: 0.03,
      supportsTools: true,
      supportsStreaming: true
    }
  ]

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  /**
   * Complete a prompt (non-streaming)
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const llm = new ChatOpenAI({
        modelName: request.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        openAIApiKey: this.apiKey,
        streaming: false
      })

      const messages = request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))

      const response = await llm.invoke(messages)

      // Extract usage information
      const tokenUsage = response.response_metadata?.tokenUsage as any
      const usage: TokenUsage = {
        promptTokens: tokenUsage?.promptTokens || 0,
        completionTokens: tokenUsage?.completionTokens || 0,
        totalTokens: tokenUsage?.totalTokens || 0
      }

      return {
        content: response.content as string,
        model: request.model,
        usage,
        finishReason: this.mapFinishReason(response.response_metadata?.finish_reason as string),
        provider: this.name
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Stream a completion
   */
  async *stream(request: CompletionRequest): AsyncIterable<CompletionChunk> {
    try {
      const llm = new ChatOpenAI({
        modelName: request.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        openAIApiKey: this.apiKey,
        streaming: true
      })

      const messages = request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }))

      const stream = await llm.stream(messages)

      for await (const chunk of stream) {
        yield {
          delta: chunk.content as string,
          finishReason: chunk.response_metadata?.finish_reason
            ? this.mapFinishReason(chunk.response_metadata.finish_reason as string)
            : undefined
        }
      }
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Estimate tokens for a text (rough approximation)
   * GPT models: ~4 characters per token
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage: TokenUsage, model: string): number {
    const modelConfig = this.models.find(m => m.id === model)
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`)
    }

    const inputCost = (usage.promptTokens / 1000) * modelConfig.costPer1kInput
    const outputCost = (usage.completionTokens / 1000) * modelConfig.costPer1kOutput

    return inputCost + outputCost
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple test call with minimal tokens
      const llm = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        maxTokens: 5,
        openAIApiKey: this.apiKey
      })

      await llm.invoke([{ role: 'user', content: 'test' }])
      return true
    } catch (error) {
      console.error('OpenAI provider not available:', error)
      return false
    }
  }

  /**
   * Map OpenAI finish reasons to our standard format
   */
  private mapFinishReason(reason?: string): 'stop' | 'length' | 'tool_calls' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'function_call':
      case 'tool_calls':
        return 'tool_calls'
      case 'content_filter':
      default:
        return 'stop'
    }
  }

  /**
   * Handle errors from OpenAI API
   */
  private handleError(error: any): never {
    // Rate limiting
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after'])
        : undefined
      throw new RateLimitError(this.name, retryAfter)
    }

    // Authentication
    if (error.status === 401 || error.code === 'invalid_api_key') {
      throw new AIProviderError(
        'Invalid OpenAI API key',
        this.name,
        'AUTH_ERROR',
        false
      )
    }

    // Context length exceeded
    if (error.code === 'context_length_exceeded') {
      throw new AIProviderError(
        'Context length exceeded. Reduce input or use a model with larger context window.',
        this.name,
        'CONTEXT_LENGTH_EXCEEDED',
        false
      )
    }

    // Generic error
    throw new AIProviderError(
      error.message || 'Unknown OpenAI error',
      this.name,
      error.code,
      error.status >= 500  // 5xx errors are retryable
    )
  }
}
