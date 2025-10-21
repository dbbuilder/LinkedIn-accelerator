-- LinkedIn Accelerator Database Schema (API-Aligned)
-- PostgreSQL Database for AI-Powered Professional Content Platform
-- Created: 2025-01-21
-- Updated: 2025-10-21 (aligned with API route expectations)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENTURES
-- Professional ventures/projects that users manage
-- =====================================================
CREATE TABLE IF NOT EXISTS venture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) NOT NULL,
    venture_name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clerk_id, venture_name)
);

CREATE INDEX idx_venture_clerk_id ON venture(clerk_id);
CREATE INDEX idx_venture_created_at ON venture(created_at DESC);

-- =====================================================
-- BRAND GUIDES
-- Brand identity and messaging guidelines per venture
-- =====================================================
CREATE TABLE IF NOT EXISTS brand_guide (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venture_id UUID NOT NULL REFERENCES venture(id) ON DELETE CASCADE,
    tone VARCHAR(100) NOT NULL DEFAULT 'professional',
    audience TEXT,
    content_pillars TEXT[],
    negative_keywords TEXT[],
    posting_frequency INTEGER DEFAULT 3,
    auto_approval_threshold DECIMAL(3,2) DEFAULT 0.90,
    target_platforms TEXT[] DEFAULT '{"linkedin","devto","portfolio"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(venture_id)
);

CREATE INDEX idx_brand_guide_venture_id ON brand_guide(venture_id);

-- =====================================================
-- CONTENT DRAFTS
-- AI-generated LinkedIn content
-- =====================================================
CREATE TABLE IF NOT EXISTS content_draft (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) NOT NULL,
    venture_id UUID NOT NULL REFERENCES venture(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    original_text TEXT NOT NULL,
    edited_text TEXT,
    ai_confidence_score DECIMAL(3,2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_validation',
    scheduled_publish_at TIMESTAMP WITH TIME ZONE,
    hashtags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    CHECK (status IN ('pending_validation', 'pending_review', 'approved', 'rejected', 'published'))
);

CREATE INDEX idx_content_clerk_id ON content_draft(clerk_id);
CREATE INDEX idx_content_venture_id ON content_draft(venture_id);
CREATE INDEX idx_content_status ON content_draft(status);
CREATE INDEX idx_content_created_at ON content_draft(created_at DESC);

-- =====================================================
-- PROSPECTS
-- Network connections and leads
-- =====================================================
CREATE TABLE IF NOT EXISTS prospect (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) NOT NULL,
    venture_id UUID NOT NULL REFERENCES venture(id) ON DELETE CASCADE,
    linkedin_url TEXT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    profile_summary TEXT,
    followers_count INTEGER,
    avg_post_likes INTEGER,
    avg_post_comments INTEGER,
    criticality_score DECIMAL(3,2),
    relevance_score DECIMAL(3,2),
    reach_score DECIMAL(3,2),
    proximity_score DECIMAL(3,2),
    reciprocity_score DECIMAL(3,2),
    gap_fill_score DECIMAL(3,2),
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prospect_clerk_id ON prospect(clerk_id);
CREATE INDEX idx_prospect_venture_id ON prospect(venture_id);
CREATE INDEX idx_prospect_criticality_score ON prospect(criticality_score DESC);
CREATE INDEX idx_prospect_discovered_at ON prospect(discovered_at DESC);

-- =====================================================
-- TC3D: TOOLS
-- Tools and technologies (global reference data)
-- =====================================================
CREATE TABLE IF NOT EXISTS tool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    official_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool_category ON tool(category);
CREATE INDEX idx_tool_name ON tool(tool_name);

-- =====================================================
-- TC3D: CAPABILITY_SCORE
-- User's professional capabilities and skill scores
-- =====================================================
CREATE TABLE IF NOT EXISTS capability_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) NOT NULL,
    tool_id UUID NOT NULL REFERENCES tool(id) ON DELETE CASCADE,
    task_id UUID,
    score DECIMAL(3,2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clerk_id, tool_id, task_id),
    CHECK (source IN ('github_analysis', 'self_reported', 'engagement', 'manual'))
);

CREATE INDEX idx_capability_score_clerk_id ON capability_score(clerk_id);
CREATE INDEX idx_capability_score_tool_id ON capability_score(tool_id);
CREATE INDEX idx_capability_score_source ON capability_score(source);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_guide_updated_at BEFORE UPDATE ON brand_guide
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_updated_at BEFORE UPDATE ON prospect
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capability_score_updated_at BEFORE UPDATE ON capability_score
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
