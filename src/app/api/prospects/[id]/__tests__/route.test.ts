/**
 * Prospect [id] API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Endpoints:
 * - GET /api/prospects/[id] - Get specific prospect with scores
 */

// Mock dependencies BEFORE imports
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  },
}));

import { GET } from '../route';
import { sql } from '@vercel/postgres';

const { auth } = require('@clerk/nextjs');
const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Prospect [id] API', () => {
  const mockParams = { params: { id: 'prospect-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/prospects/[id]', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 if prospect does not exist', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('should return 404 if prospect belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Query filters by clerk_id, so returns empty for different user's prospect
      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('should return prospect with all scores', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockProspect = {
        id: 'prospect-123',
        clerk_id: 'user_123',
        venture_id: 'venture-1',
        linkedin_url: 'https://linkedin.com/in/john-doe',
        name: 'John Doe',
        title: 'CTO',
        company: 'TechCorp',
        profile_summary: 'Experienced technology leader...',
        followers_count: 5000,
        avg_post_likes: 150,
        avg_post_comments: 25,
        criticality_score: 0.92,
        relevance_score: 0.88,
        reach_score: 0.85,
        proximity_score: 0.75,
        reciprocity_score: 0.70,
        gap_fill_score: 0.65,
        discovered_at: new Date('2025-01-01'),
        last_updated_at: new Date('2025-01-15'),
      };

      mockSql.mockResolvedValueOnce({
        rows: [mockProspect],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('John Doe');
      expect(data.criticality_score).toBe(0.92);
      expect(data.relevance_score).toBe(0.88);
      expect(data.reach_score).toBe(0.85);
    });

    it('should join with venture to verify ownership', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(mockSql).toHaveBeenCalled();
      const sqlParts = mockSql.mock.calls[0][0];
      const fullQuery = sqlParts.join('');
      expect(fullQuery).toContain('JOIN venture');
      expect(fullQuery).toContain('clerk_id');
    });
  });
});
