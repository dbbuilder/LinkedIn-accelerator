# AI Integration Architecture
## Multi-Provider Agentic System for LinkedIn Content Generation

---

## 🎯 Core Design Principles

1. **Provider Agnostic**: Seamless switching between OpenAI, Anthropic, Google, and OpenRouter
2. **Modular Architecture**: Each component is independently testable and replaceable
3. **Agent-First Design**: Autonomous agents that research, plan, and execute
4. **Future-Proof**: Easy to add new providers, models, and capabilities
5. **Cost-Optimized**: Intelligent model selection based on task complexity

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Request                             │
│          "Generate LinkedIn post about AI trends"            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Content Generation Orchestrator                 │
│  - Request validation                                        │
│  - Context gathering (venture, brand guide)                  │
│  - Agent coordination                                        │
│  - Quality assurance                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Research │  │ Planning │  │ Writing  │
│  Agent   │  │  Agent   │  │  Agent   │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │              │
      ▼             ▼              ▼
┌─────────────────────────────────────────┐
│        AI Provider Abstraction Layer    │
│  - Unified interface                    │
│  - Request normalization                │
│  - Response standardization             │
│  - Error handling & retries             │
│  - Token tracking & cost management     │
└────────┬────┬────────┬────────┬─────────┘
         │    │        │        │
    ┌────┘    │        │        └────┐
    ▼         ▼        ▼             ▼
┌────────┐ ┌─────┐ ┌────────┐  ┌─────────┐
│ OpenAI │ │Anthr│ │ Google │  │OpenRoute│
│GPT-4o  │ │opic │ │ Gemini │  │   r     │
│ mini   │ │Claud│ │ Flash  │  │ (Multi) │
└────────┘ └─────┘ └────────┘  └─────────┘
```

---

## 🤖 Agent System Architecture

### 1. Research Agent
**Purpose**: Gather context and trends before content creation

**Capabilities**:
- Web search integration (optional)
- Trend analysis
- Topic research
- Competitor analysis
- Industry insights

**Workflow**:
```typescript
async research(topic: string, industry: string) {
  1. Analyze topic relevance
  2. Gather recent trends (if web search enabled)
  3. Identify key talking points
  4. Return structured research data
}
```

### 2. Planning Agent
**Purpose**: Structure content before writing

**Capabilities**:
- Content outline generation
- Hook/intro planning
- Key points identification
- CTA (Call-to-Action) planning
- Hashtag strategy

**Workflow**:
```typescript
async plan(research: ResearchData, brandGuide: BrandGuide) {
  1. Analyze research insights
  2. Apply brand voice/tone
  3. Structure content flow
  4. Identify engagement opportunities
  5. Return content plan
}
```

### 3. Writing Agent
**Purpose**: Generate final content

**Capabilities**:
- Professional copywriting
- Brand voice adherence
- Multiple format support (posts, articles, threads)
- Engagement optimization
- Character limit management

**Workflow**:
```typescript
async write(plan: ContentPlan, preferences: UserPreferences) {
  1. Generate draft from plan
  2. Apply brand voice
  3. Optimize for engagement
  4. Format for LinkedIn
  5. Return polished content
}
```

### 4. Review Agent (Future)
**Purpose**: Quality assurance and improvement suggestions

**Capabilities**:
- Content quality scoring
- Brand alignment checking
- Engagement prediction
- Improvement suggestions
- A/B variant generation

---

## 📁 File Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── core/
│   │   │   ├── types.ts              # Shared types and interfaces
│   │   │   ├── config.ts             # AI configuration
│   │   │   └── errors.ts             # Custom error classes
│   │   │
│   │   ├── providers/
│   │   │   ├── base.ts               # Abstract base provider
│   │   │   ├── openai.ts             # OpenAI implementation
│   │   │   ├── anthropic.ts          # Claude implementation
│   │   │   ├── google.ts             # Gemini implementation
│   │   │   ├── openrouter.ts         # OpenRouter implementation
│   │   │   └── index.ts              # Provider factory
│   │   │
│   │   ├── agents/
│   │   │   ├── base-agent.ts         # Abstract base agent
│   │   │   ├── research-agent.ts     # Research capabilities
│   │   │   ├── planning-agent.ts     # Content planning
│   │   │   ├── writing-agent.ts      # Content generation
│   │   │   └── index.ts              # Agent exports
│   │   │
│   │   ├── orchestrator/
│   │   │   ├── content-orchestrator.ts  # Main orchestrator
│   │   │   ├── task-queue.ts         # Task management
│   │   │   └── quality-checker.ts    # QA utilities
│   │   │
│   │   ├── prompts/
│   │   │   ├── templates/
│   │   │   │   ├── research.ts       # Research prompts
│   │   │   │   ├── planning.ts       # Planning prompts
│   │   │   │   └── writing.ts        # Writing prompts
│   │   │   └── builder.ts            # Prompt construction
│   │   │
│   │   └── utils/
│   │       ├── token-counter.ts      # Token estimation
│   │       ├── cost-calculator.ts    # Cost tracking
│   │       ├── retry-handler.ts      # Retry logic
│   │       └── cache.ts              # Response caching
│   │
│   └── api.ts                        # Existing API helper
│
└── app/
    └── api/
        └── ai/
            ├── generate/route.ts     # Main generation endpoint
            ├── research/route.ts     # Research endpoint
            └── providers/route.ts    # Provider status
```

---

## 🔌 Provider Implementation

### Base Provider Interface

```typescript
// src/lib/ai/providers/base.ts
export interface AIProvider {
  name: ProviderName
  models: ModelConfig[]

  // Core methods
  complete(request: CompletionRequest): Promise<CompletionResponse>
  stream(request: CompletionRequest): AsyncIterable<CompletionChunk>

  // Utility methods
  estimateTokens(text: string): number
  calculateCost(tokens: number, model: string): number
  isAvailable(): Promise<boolean>
}

export interface CompletionRequest {
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  metadata?: Record<string, unknown>
}

export interface CompletionResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter'
  metadata?: Record<string, unknown>
}
```

### OpenAI Provider (Default)

```typescript
// src/lib/ai/providers/openai.ts
import OpenAI from 'openai'

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const
  private client: OpenAI

  models = [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      contextWindow: 128000,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
      recommended: true  // Default model
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01
    }
  ]

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stop: request.stopSequences
    })

    return this.normalizeResponse(response)
  }

  // ... implementation
}
```

### Anthropic Provider

```typescript
// src/lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const
  private client: Anthropic

  models = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      contextWindow: 200000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      contextWindow: 200000,
      costPer1kInput: 0.0008,
      costPer1kOutput: 0.004
    }
  ]

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Convert OpenAI-style messages to Anthropic format
    const { system, messages } = this.convertMessages(request.messages)

    const response = await this.client.messages.create({
      model: request.model,
      system,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7
    })

    return this.normalizeResponse(response)
  }

  // ... implementation
}
```

---

## 🎛️ Configuration System

```typescript
// src/lib/ai/core/config.ts
export interface AIConfig {
  defaultProvider: ProviderName
  defaultModel: string
  fallbackProviders: ProviderName[]

  // Provider credentials
  providers: {
    openai?: {
      apiKey: string
      organization?: string
    }
    anthropic?: {
      apiKey: string
    }
    google?: {
      apiKey: string
    }
    openrouter?: {
      apiKey: string
    }
  }

  // Agent settings
  agents: {
    research: {
      enabled: boolean
      model?: string  // Override default
      temperature?: number
    }
    planning: {
      enabled: boolean
      model?: string
      temperature?: number
    }
    writing: {
      model?: string
      temperature?: number
    }
  }

  // Features
  features: {
    webSearch: boolean
    caching: boolean
    streaming: boolean
  }

  // Limits
  limits: {
    maxTokensPerRequest: number
    maxCostPerGeneration: number
    rateLimitPerMinute: number
  }
}

// Environment-based configuration
export function getAIConfig(): AIConfig {
  return {
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER as ProviderName) || 'openai',
    defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4o-mini',
    fallbackProviders: ['anthropic', 'google'],

    providers: {
      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID
      } : undefined,

      anthropic: process.env.ANTHROPIC_API_KEY ? {
        apiKey: process.env.ANTHROPIC_API_KEY
      } : undefined,

      google: process.env.GOOGLE_AI_API_KEY ? {
        apiKey: process.env.GOOGLE_AI_API_KEY
      } : undefined,

      openrouter: process.env.OPENROUTER_API_KEY ? {
        apiKey: process.env.OPENROUTER_API_KEY
      } : undefined
    },

    agents: {
      research: {
        enabled: process.env.AI_RESEARCH_ENABLED !== 'false',
        temperature: 0.3  // Lower for factual research
      },
      planning: {
        enabled: true,
        temperature: 0.5  // Moderate for structure
      },
      writing: {
        temperature: 0.7  // Higher for creative content
      }
    },

    features: {
      webSearch: false,  // Future feature
      caching: true,
      streaming: false  // Future feature
    },

    limits: {
      maxTokensPerRequest: 4096,
      maxCostPerGeneration: 0.10,  // $0.10 max per generation
      rateLimitPerMinute: 60
    }
  }
}
```

---

## 🚀 Usage Example

```typescript
// In API route: /api/content (POST)
import { ContentOrchestrator } from '@/lib/ai/orchestrator/content-orchestrator'

export async function POST(request: Request) {
  const { venture_id, topic, tone, content_type } = await request.json()

  // Initialize orchestrator
  const orchestrator = new ContentOrchestrator({
    provider: 'openai',  // or user preference
    model: 'gpt-4o-mini'
  })

  // Generate content with full agent pipeline
  const result = await orchestrator.generateContent({
    ventureId: venture_id,
    topic,
    tone,
    contentType: content_type,
    userId: auth.userId
  })

  // Save to database
  const content = await sql`
    INSERT INTO content_draft (...)
    VALUES (...)
    RETURNING *
  `

  return NextResponse.json(content)
}
```

---

## 📊 Monitoring & Observability

```typescript
// Track all AI operations
interface AIMetrics {
  requestId: string
  provider: ProviderName
  model: string
  operation: 'research' | 'planning' | 'writing'

  timing: {
    startedAt: Date
    completedAt: Date
    durationMs: number
  }

  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }

  cost: {
    amount: number
    currency: 'USD'
  }

  success: boolean
  error?: string
}
```

---

## 🔄 Migration Path

### Phase 1: Basic OpenAI Integration (Week 1)
- [ ] Implement base provider interface
- [ ] OpenAI provider with gpt-4o-mini
- [ ] Simple content generation (no agents)
- [ ] Save to database with AI metadata

### Phase 2: Agent System (Week 2)
- [ ] Implement base agent class
- [ ] Research agent
- [ ] Planning agent
- [ ] Writing agent
- [ ] Orchestrator coordination

### Phase 3: Multi-Provider Support (Week 3)
- [ ] Anthropic provider (Claude)
- [ ] Google provider (Gemini)
- [ ] OpenRouter provider
- [ ] Provider fallback logic
- [ ] Cost optimization

### Phase 4: Advanced Features (Week 4)
- [ ] Streaming responses
- [ ] Response caching
- [ ] A/B testing variants
- [ ] Quality scoring
- [ ] User feedback loop

---

## 📝 Environment Variables

Add to `.env.local`:

```env
# AI Configuration
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
AI_RESEARCH_ENABLED=true

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_ORG_ID=org-xxxxx (optional)

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Google
GOOGLE_AI_API_KEY=xxxxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxx
```

---

## 🎓 Best Practices Research

Based on industry-leading agentic frameworks:

1. **LangChain/LangGraph Approach**
   - Graph-based agent orchestration
   - State management between agents
   - Tool use and function calling

2. **AutoGPT/BabyAGI Pattern**
   - Task decomposition
   - Autonomous execution
   - Self-critique and improvement

3. **Microsoft Semantic Kernel**
   - Plugin-based architecture
   - Memory and context management
   - Multi-model orchestration

4. **OpenAI Swarm Pattern**
   - Lightweight agent coordination
   - Handoffs between specialists
   - Minimal abstraction

**Our Approach**: Hybrid of Swarm (simplicity) + LangGraph (structure) + Semantic Kernel (modularity)

---

This architecture provides maximum flexibility while maintaining simplicity for future growth!
