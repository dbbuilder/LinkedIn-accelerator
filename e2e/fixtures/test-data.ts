/**
 * Test Data Fixtures
 *
 * Reusable test data for E2E tests
 */

export const testVentures = {
  techConsulting: {
    name: 'TechFlow Consulting',
    website: 'https://techflow.example.com',
    description: 'Enterprise software consulting and cloud architecture services',
    expectedIndustry: 'Technology',
  },
  healthTech: {
    name: 'HealthVision AI',
    website: 'https://healthvision.example.com',
    description: 'AI-powered healthcare diagnostics and patient monitoring solutions',
    expectedIndustry: 'Healthcare',
  },
  fintech: {
    name: 'FinanceX Platform',
    description: 'Modern fintech platform for SMB accounting and financial management',
    expectedIndustry: 'Finance',
  },
}

export const testProspects = {
  cto: {
    fullName: 'Sarah Chen',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    company: 'TechCorp Inc',
    jobTitle: 'Chief Technology Officer',
    engagementLevel: 'high',
    notes: 'Interested in cloud migration and AI implementation',
  },
  founder: {
    fullName: 'Michael Rodriguez',
    linkedinUrl: 'https://linkedin.com/in/mrodriguez',
    company: 'StartupXYZ',
    jobTitle: 'Founder & CEO',
    engagementLevel: 'medium',
    notes: 'Looking for strategic partnership opportunities',
  },
  director: {
    fullName: 'Emily Johnson',
    linkedinUrl: 'https://linkedin.com/in/emilyjohnson',
    company: 'Enterprise Solutions LLC',
    jobTitle: 'Director of Engineering',
    engagementLevel: 'low',
  },
}

export const testContentTopics = {
  aiTrends: {
    topic: 'The Future of AI in Software Development',
    tone: 'professional' as const,
    expectedKeywords: ['AI', 'artificial intelligence', 'development', 'future'],
  },
  cloudMigration: {
    topic: 'Cloud Migration Best Practices for Enterprises',
    tone: 'technical' as const,
    expectedKeywords: ['cloud', 'migration', 'enterprise', 'best practices'],
  },
  thoughtLeadership: {
    topic: 'Building High-Performance Teams in Tech',
    tone: 'inspirational' as const,
    expectedKeywords: ['team', 'leadership', 'performance', 'tech'],
  },
}

// Mock AI responses for testing
export const mockAIResponses = {
  ventureAnalysis: {
    industry: 'Technology Consulting',
    targetAudience: ['CTOs', 'VPs of Engineering', 'Tech Leaders'],
    brandVoice: 'Professional, authoritative, forward-thinking',
    contentThemes: ['Cloud Architecture', 'Digital Transformation', 'AI Integration', 'Team Building'],
  },
  contentGeneration: {
    content: `The landscape of software development is undergoing a transformative shift powered by artificial intelligence. As we look toward the future, AI is not just a tool but a collaborative partner in the development process.

Key areas where AI is making significant impact:

1. **Code Generation & Assistance**: AI-powered IDEs and copilots are accelerating development cycles by suggesting context-aware code completions and identifying potential bugs before they reach production.

2. **Automated Testing**: Machine learning algorithms can now generate comprehensive test suites, predict where bugs are most likely to occur, and even suggest optimal testing strategies.

3. **DevOps & Operations**: AI-driven monitoring and incident response systems can detect anomalies, predict system failures, and even auto-remediate issues without human intervention.

The future isn't about AI replacing developers—it's about empowering them to focus on creative problem-solving while AI handles repetitive tasks.

What changes are you seeing in your development workflows?

#AI #SoftwareDevelopment #Technology #Innovation`,
    characterCount: 950,
    wordCount: 150,
  },
  topicSuggestions: [
    {
      topic: 'How to Build Scalable Cloud Infrastructure',
      rationale: 'Aligns with your cloud architecture expertise',
      targetAudience: 'CTOs and Engineering Leaders',
    },
    {
      topic: 'Digital Transformation: Beyond the Buzzword',
      rationale: 'Addresses common pain points in your target market',
      targetAudience: 'Business Leaders and Decision Makers',
    },
    {
      topic: 'AI Integration Strategies for Legacy Systems',
      rationale: 'Hot topic with practical value for enterprises',
      targetAudience: 'Technical Architects and Engineers',
    },
  ],
}

// User credentials for testing (these should be test accounts only)
export const testUser = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

// API endpoints for direct testing
export const apiEndpoints = {
  ventures: '/api/ventures',
  content: '/api/content',
  prospects: '/api/prospects',
  aiAnalyze: '/api/dev-auth/ai/analyze-venture',
  aiGenerate: '/api/dev-auth/ai/generate',
  aiSuggestTopics: '/api/dev-auth/ai/suggest-topics',
}
