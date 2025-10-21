/**
 * Prospects API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Prospects belong to a venture (and indirectly to a user via venture)
 * - linkedin_url is unique across all prospects
 * - Scores (criticality, relevance, reach, etc.) must be between 0 and 1
 * - User can only access prospects for their own ventures
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

import { GET, POST } from '../route';
import { sql } from '@vercel/postgres';

const { auth } = require('@clerk/nextjs');
const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Prospects API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/prospects', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return empty array when user has no prospects', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('should return prospects for authenticated user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockProspects = [
        {
          id: 'prospect-1',
          clerk_id: 'user_123',
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
          title: 'CTO',
          company: 'TechCorp',
          criticality_score: 0.92,
          relevance_score: 0.85,
          reach_score: 0.78,
          discovered_at: new Date('2025-01-01'),
        },
        {
          id: 'prospect-2',
          clerk_id: 'user_123',
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/jane-smith',
          name: 'Jane Smith',
          title: 'VP Engineering',
          company: 'DevOps Inc',
          criticality_score: 0.88,
          relevance_score: 0.90,
          reach_score: 0.72,
          discovered_at: new Date('2025-01-02'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockProspects,
        command: 'SELECT',
        rowCount: 2,
        fields: [],
      } as any);

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('John Doe');
      expect(data[0].criticality_score).toBe(0.92);
    });

    it('should filter prospects by clerk_id through venture join', async () => {
      // Arrange
      const testUserId = 'user_abc123';
      (auth as jest.Mock).mockReturnValue({ userId: testUserId });

      mockSql.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      await GET();

      // Assert
      expect(mockSql).toHaveBeenCalled();
      const sqlParts = mockSql.mock.calls[0][0];
      const fullQuery = sqlParts.join('');
      expect(fullQuery).toContain('JOIN venture');
      expect(fullQuery).toContain('clerk_id');
    });

    it('should order prospects by criticality score descending', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      await GET();

      // Assert
      expect(mockSql).toHaveBeenCalled();
      const sqlParts = mockSql.mock.calls[0][0];
      const fullQuery = sqlParts.join('');
      expect(fullQuery).toContain('ORDER BY');
      expect(fullQuery).toContain('criticality_score');
      expect(fullQuery).toContain('DESC');
    });
  });

  describe('POST /api/prospects', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should require venture_id field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('venture_id');
    });

    it('should require linkedin_url field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('linkedin_url');
    });

    it('should validate linkedin_url format', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          linkedin_url: 'not-a-valid-url',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('linkedin_url');
      expect(data.error).toContain('linkedin.com');
    });

    it('should return 404 if venture does not exist', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture doesn't exist
      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Venture not found');
    });

    it('should return 403 if venture belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture exists but belongs to different user
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('access');
    });

    it('should create prospect with valid data', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const newProspect = {
        venture_id: 'venture-1',
        linkedin_url: 'https://linkedin.com/in/john-doe',
        name: 'John Doe',
        title: 'CTO',
        company: 'TechCorp',
        profile_summary: 'Experienced technology leader...',
      };

      // Verify venture ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert prospect
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'prospect-1',
            clerk_id: userId,
            ...newProspect,
            criticality_score: null,
            discovered_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(newProspect),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('John Doe');
      expect(data.linkedin_url).toBe('https://linkedin.com/in/john-doe');
    });

    it('should return 409 if linkedin_url already exists', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      // Verify venture ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert fails with duplicate key error
      const duplicateError: any = new Error('Duplicate key');
      duplicateError.code = '23505'; // PostgreSQL unique violation
      mockSql.mockRejectedValueOnce(duplicateError);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-1',
          linkedin_url: 'https://linkedin.com/in/john-doe',
          name: 'John Doe',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });
  });
});
