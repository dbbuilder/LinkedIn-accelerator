/**
 * Content Draft API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Users can only access/modify their own content drafts
 * - Content must belong to a venture owned by the user
 * - Status enum: pending_validation, pending_review, approved, rejected, published
 * - original_text is required on creation
 * - AI confidence score must be between 0 and 1
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

describe('Content Draft API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/content', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return empty array when user has no content drafts', async () => {
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

    it('should return content drafts for authenticated user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockDrafts = [
        {
          id: 'draft-123',
          clerk_id: 'user_123',
          venture_id: 'venture-123',
          topic: 'AI in Healthcare',
          original_text: 'AI is transforming healthcare...',
          edited_text: null,
          ai_confidence_score: 0.92,
          status: 'pending_review',
          created_at: new Date('2025-01-01'),
        },
        {
          id: 'draft-456',
          clerk_id: 'user_123',
          venture_id: 'venture-123',
          topic: 'Cloud Migration',
          original_text: 'Moving to the cloud...',
          edited_text: 'Updated: Moving to the cloud...',
          ai_confidence_score: 0.85,
          status: 'approved',
          created_at: new Date('2025-01-02'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockDrafts,
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
      expect(data[0].topic).toBe('AI in Healthcare');
      expect(data[1].status).toBe('approved');
    });

    it('should filter content by clerk_id for multi-tenant isolation', async () => {
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
      expect(fullQuery).toContain('clerk_id');
      expect(mockSql.mock.calls[0][1]).toBe(testUserId);
    });
  });

  describe('POST /api/content', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should require original_text field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          // original_text is missing
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('original_text');
    });

    it('should reject empty original_text', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: '   ', // Empty/whitespace
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('original_text');
    });

    it('should validate AI confidence score is between 0 and 1', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // NOTE: No SQL mock needed - validation happens before DB check

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
          ai_confidence_score: 1.5, // Invalid - must be <= 1
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('ai_confidence_score');
      expect(data.error).toContain('0 and 1');
    });

    it('should validate status enum values', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // NOTE: No SQL mock needed - validation happens before DB check

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
          status: 'invalid_status', // Invalid status
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('status');
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

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Venture not found');

      // Verify INSERT was NOT called (only 1 SQL call for venture check)
      expect(mockSql).toHaveBeenCalledTimes(1);
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

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('access');
    });

    it('should create content draft with valid data', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const newDraft = {
        venture_id: 'venture-123',
        topic: 'AI in Healthcare',
        original_text: 'Artificial intelligence is transforming healthcare...',
        ai_confidence_score: 0.92,
      };

      // Verify venture ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert content draft
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'draft-123',
            clerk_id: userId,
            ...newDraft,
            edited_text: null,
            status: 'pending_validation',
            scheduled_publish_at: null,
            created_at: new Date(),
            approved_at: null,
            published_at: null,
            hashtags: [],
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify(newDraft),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.topic).toBe('AI in Healthcare');
      expect(data.ai_confidence_score).toBe(0.92);
      expect(data.status).toBe('pending_validation');
    });

    it('should use default status of pending_validation', async () => {
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

      // Insert content draft
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'draft-123',
            clerk_id: userId,
            venture_id: 'venture-123',
            original_text: 'Test content',
            status: 'pending_validation', // Default
            created_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost/api/content', {
        method: 'POST',
        body: JSON.stringify({
          venture_id: 'venture-123',
          original_text: 'Test content',
          // No status provided
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('pending_validation');
    });
  });
});
