# AI Agent Research Prompt
## For Gathering Insights on Multi-Agent Systems for LinkedIn Content Generation

---

## Context

I'm building an AI-powered LinkedIn content generation platform with a multi-agent architecture. The system needs to:

1. **Research** trending topics and gather context
2. **Plan** content structure based on brand guidelines
3. **Write** professional LinkedIn posts
4. **Communicate** with external systems (prospect discovery, engagement tracking)

The architecture uses:
- Multiple AI providers (OpenAI, Anthropic, Google, OpenRouter)
- PostgreSQL database for persistence
- Next.js/TypeScript backend
- Real-time user interaction

---

## Research Questions

### 1. Agent Architecture & Design Patterns

**Question for AI Systems:**

> "What are the current best practices (as of 2025) for designing multi-agent AI systems where agents need to:
>
> - Execute specialized tasks autonomously (research, planning, writing)
> - Coordinate with each other (pass context between agents)
> - Maintain conversation history and state
> - Communicate with external systems (APIs, databases, web scraping)
> - Handle failures gracefully with fallback mechanisms
>
> Please provide:
> 1. Modern architectural patterns (LangGraph, AutoGPT, CrewAI, etc.)
> 2. State management approaches
> 3. Inter-agent communication protocols
> 4. Error handling and retry strategies
> 5. Real-world examples from production systems"

---

### 2. Agent Orchestration & Coordination

**Question for AI Systems:**

> "How should I orchestrate multiple AI agents in a content generation pipeline where:
>
> **Research Agent** needs to:
> - Search web for trending topics (optional)
> - Analyze competitor content
> - Extract key insights and talking points
> - Pass structured data to Planning Agent
>
> **Planning Agent** needs to:
> - Receive research from Research Agent
> - Apply brand voice guidelines from database
> - Structure content flow (hook, body, CTA)
> - Generate content outline for Writing Agent
>
> **Writing Agent** needs to:
> - Receive plan from Planning Agent
> - Generate polished LinkedIn post
> - Optimize for engagement
> - Return final content with metadata
>
> What are the best patterns for:
> 1. Passing data between agents (shared memory, message queues, database)
> 2. Sequential vs parallel execution
> 3. Conditional branching (if research fails, skip to planning with defaults)
> 4. Cost optimization (caching, token management)
> 5. Response streaming to user"

---

### 3. External Communication & Tool Use

**Question for AI Systems:**

> "For an agentic system that needs to interact with external resources, what are best practices for:
>
> **Prospect Discovery:**
> - LinkedIn API integration (or web scraping if API unavailable)
> - Real-time profile analysis
> - Engagement scoring (relevance, reach, proximity)
> - Database persistence of prospect data
>
> **Tool Use Patterns:**
> - When to use function calling vs direct API calls
> - How to handle API rate limits
> - Caching strategies for expensive operations
> - Error recovery when external APIs fail
>
> **Async Operations:**
> - Background jobs for long-running tasks
> - Webhook patterns for external updates
> - Real-time progress updates to UI
>
> Please provide code examples or architectural diagrams if possible."

---

### 4. State Management & Memory

**Question for AI Systems:**

> "In a multi-agent system for content generation, how should I handle:
>
> **Short-term Memory:**
> - Conversation context within a single generation session
> - Intermediate results between agent handoffs
> - User feedback and corrections
>
> **Long-term Memory:**
> - Brand guidelines and user preferences
> - Historical content performance
> - Prospect interaction history
> - Tool usage patterns
>
> **Context Windows:**
> - Managing token limits across agent chains
> - Summarization strategies for long contexts
> - Selective context injection based on relevance
>
> Specific to:
> - LangChain/LangGraph approaches
> - Vector databases for semantic search
> - PostgreSQL for structured data
> - Redis for session state"

---

### 5. Multi-Provider Strategy

**Question for AI Systems:**

> "I'm building a system that supports multiple LLM providers (OpenAI GPT-4o-mini, Anthropic Claude, Google Gemini, OpenRouter). What are best practices for:
>
> **Provider Abstraction:**
> - Unified interface design
> - Request/response normalization
> - Handling provider-specific features (system prompts, tool use formats)
>
> **Intelligent Routing:**
> - Task-to-model matching (research vs creative writing)
> - Cost optimization (use cheaper models for simple tasks)
> - Fallback chains (if primary fails, try secondary)
> - Performance tracking per provider
>
> **Provider-Specific Optimizations:**
> - Anthropic's long context windows
> - OpenAI's function calling
> - Google's multimodal capabilities
> - Token counting differences
>
> Are there existing libraries or frameworks that handle this well?"

---

### 6. Production Considerations

**Question for AI Systems:**

> "For deploying a multi-agent content generation system to production, what should I consider for:
>
> **Monitoring & Observability:**
> - Tracking agent performance (latency, success rate)
> - Cost per generation
> - Quality metrics (user approval rates)
> - Debug logging and tracing across agents
>
> **Scalability:**
> - Concurrent user sessions
> - Rate limiting and queuing
> - Database connection pooling
> - Caching strategies
>
> **Security:**
> - API key management
> - User data isolation
> - Prompt injection prevention
> - Output sanitization
>
> **User Experience:**
> - Streaming responses
> - Progress indicators
> - Cancellation handling
> - A/B testing different agent configurations"

---

### 7. Specific Framework Comparison

**Question for AI Systems:**

> "Please compare these frameworks for building multi-agent systems in 2025:
>
> 1. **LangChain/LangGraph**
>    - Best use cases
>    - Learning curve
>    - Production readiness
>
> 2. **Microsoft Semantic Kernel**
>    - Plugin architecture
>    - Multi-model support
>    - TypeScript/JavaScript support
>
> 3. **CrewAI**
>    - Agent collaboration patterns
>    - Task delegation
>    - Role-based agents
>
> 4. **AutoGPT/BabyAGI**
>    - Autonomous execution
>    - Goal-driven behavior
>    - Limitations
>
> 5. **OpenAI Swarm Pattern**
>    - Lightweight coordination
>    - Handoff mechanisms
>    - Minimal abstraction
>
> 6. **Custom Implementation**
>    - When to build from scratch
>    - Core components needed
>    - Maintenance overhead
>
> For a LinkedIn content generation platform, which would you recommend and why?"

---

### 8. Prompt Engineering for Agents

**Question for AI Systems:**

> "What are best practices for crafting prompts for specialized agents:
>
> **Research Agent:**
> - How to structure prompts for factual, unbiased research
> - Temperature settings for consistency
> - Output format specification (JSON schema)
>
> **Planning Agent:**
> - Balancing creativity with brand guidelines
> - Incorporating user preferences
> - Structured output for downstream consumption
>
> **Writing Agent:**
> - Voice and tone preservation
> - Engagement optimization techniques
> - Character limits and formatting
>
> **Cross-cutting Concerns:**
> - System prompts vs user prompts
> - Few-shot examples
> - Chain-of-thought reasoning
> - Self-critique and revision loops"

---

## How to Use This Prompt

### For ChatGPT/Claude/Gemini:
Copy any section above and paste it directly into the chat interface. You can ask for:
- Code examples
- Architectural diagrams
- Specific library recommendations
- Production case studies

### For Web Search:
Use these search queries derived from the questions:

```
"multi-agent AI systems 2025 best practices"
"LangGraph vs CrewAI agent coordination"
"AI agent state management patterns"
"multi-LLM provider abstraction layer"
"production AI agent monitoring observability"
"OpenAI Swarm pattern implementation"
"AI agent tool use function calling 2025"
"autonomous agent orchestration frameworks"
"AI agent memory context management"
"LinkedIn content generation AI agents"
```

### For Documentation Research:
- LangChain/LangGraph: https://python.langchain.com/docs/
- Microsoft Semantic Kernel: https://learn.microsoft.com/en-us/semantic-kernel/
- CrewAI: https://docs.crewai.com/
- OpenAI Cookbook: https://cookbook.openai.com/
- Anthropic Claude: https://docs.anthropic.com/

---

## What to Look For

When gathering insights, pay special attention to:

✅ **2025 Updates**: Ignore outdated 2022-2023 patterns
✅ **Production Examples**: Real-world case studies, not just tutorials
✅ **Cost Considerations**: Token usage, API costs, optimization strategies
✅ **TypeScript/JavaScript**: Node.js implementations (we're using Next.js)
✅ **Scalability**: Patterns that work for multiple concurrent users
✅ **Error Handling**: Graceful degradation and fallback strategies
✅ **Developer Experience**: Easy to debug, maintain, and extend

---

## Expected Outcomes

After research, you should have clarity on:

1. **Architecture Decision**: Which framework/pattern to use
2. **Agent Communication**: How agents pass data and coordinate
3. **External Integration**: Best practices for API calls, web scraping
4. **State Management**: Where to store context, memory, and state
5. **Provider Strategy**: How to abstract and switch between LLM providers
6. **Production Readiness**: Monitoring, scaling, security considerations

---

## Next Steps After Research

1. Create `RESEARCH-FINDINGS.md` with summarized insights
2. Update `AI-ARCHITECTURE.md` with chosen patterns
3. Create proof-of-concept for agent coordination
4. Implement base provider abstraction layer
5. Build first agent (Writing Agent as it's simplest)
6. Add orchestrator to coordinate agents
7. Integrate with existing API routes

---

**Note**: This is for a production system, not a demo. Prioritize:
- Reliability over features
- Observability over complexity
- Maintainability over cleverness
- User experience over technical sophistication
