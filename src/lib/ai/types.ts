/**
 * AI Provider Types and Interfaces
 * Unified types for multi-provider AI system
 */

import { z } from 'zod'

// =====================================================
// Provider Names
// =====================================================
export type ProviderName = 'openai' | 'anthropic' | 'google' | 'openrouter'

// =====================================================
// Message Types (OpenAI Format - Standard)
// =====================================================
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.any().optional()
})

export type Message = z.infer<typeof MessageSchema>

// =====================================================
// Tool/Function Calling Types
// =====================================================
export const ToolParameterSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.string(), z.any()),
  required: z.array(z.string()).optional()
})

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: ToolParameterSchema
})

export type Tool = z.infer<typeof ToolSchema>

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string  // JSON string
  }
}

// =====================================================
// Completion Request/Response
// =====================================================
export const CompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  tools: z.array(ToolSchema).optional(),
  stream: z.boolean().default(false)
})

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface CompletionResponse {
  content: string
  model: string
  usage: TokenUsage
  finishReason: 'stop' | 'length' | 'tool_calls'
  toolCalls?: ToolCall[]
  provider: ProviderName
}

export interface CompletionChunk {
  delta: string
  finishReason?: 'stop' | 'length' | 'tool_calls'
}

// =====================================================
// Model Configuration
// =====================================================
export interface ModelConfig {
  id: string
  name: string
  provider: ProviderName
  contextWindow: number
  costPer1kInput: number  // USD
  costPer1kOutput: number  // USD
  supportsTools: boolean
  supportsStreaming: boolean
  recommended?: boolean
}

// =====================================================
// Provider Interface
// =====================================================
export interface AIProvider {
  name: ProviderName
  models: ModelConfig[]

  /**
   * Complete a prompt (non-streaming)
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>

  /**
   * Stream a completion
   */
  stream(request: CompletionRequest): AsyncIterable<CompletionChunk>

  /**
   * Estimate tokens for a text
   */
  estimateTokens(text: string): number

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage: TokenUsage, model: string): number

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>
}

// =====================================================
// Agent Types
// =====================================================
export type AgentType = 'research' | 'planning' | 'writing' | 'revision'

export interface AgentConfig {
  type: AgentType
  model: string
  temperature: number
  provider?: ProviderName
  systemPrompt: string
}

// =====================================================
// Content Generation Types
// =====================================================
export const ContentGenerationRequestSchema = z.object({
  ventureId: z.string().uuid(),
  topic: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'inspirational', 'technical']),
  contentType: z.enum(['post', 'article', 'thought_leadership']),
  keywords: z.array(z.string()).optional()
})

export type ContentGenerationRequest = z.infer<typeof ContentGenerationRequestSchema>

// Research Agent Output
export const ResearchResultSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  insights: z.array(z.object({
    point: z.string(),
    whyItMatters: z.string(),
    source: z.string().url().optional()
  })),
  competitors: z.array(z.object({
    name: z.string(),
    url: z.string().url().optional(),
    angle: z.string()
  })).optional(),
  confidence: z.number().min(0).max(1)
})

export type ResearchResult = z.infer<typeof ResearchResultSchema>

// Planning Agent Output
export const ContentPlanSchema = z.object({
  hook: z.string(),
  outline: z.array(z.string()),
  cta: z.string(),
  hashtags: z.array(z.string()),
  estimatedLength: z.number(),
  brandRulesApplied: z.array(z.string())
})

export type ContentPlan = z.infer<typeof ContentPlanSchema>

// Writing Agent Output
export const ContentDraftSchema = z.object({
  postText: z.string(),
  altText: z.string().optional(),
  suggestedImage: z.string().optional(),
  variants: z.array(z.string()).optional(),
  characterCount: z.number()
})

export type ContentDraft = z.infer<typeof ContentDraftSchema>

// =====================================================
// Metrics and Logging
// =====================================================
export interface AgentMetrics {
  requestId: string
  sessionId?: string
  agentType: AgentType
  provider: ProviderName
  model: string

  timing: {
    startedAt: Date
    completedAt: Date
    durationMs: number
  }

  usage: TokenUsage

  cost: {
    amount: number
    currency: 'USD'
  }

  success: boolean
  error?: string
}

// =====================================================
// Error Types
// =====================================================
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: ProviderName,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export class RateLimitError extends AIProviderError {
  constructor(provider: ProviderName, public retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, 'RATE_LIMIT', true)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public validationErrors: z.ZodError) {
    super(message)
    this.name = 'ValidationError'
  }
}
