/**
 * Content Draft [id] API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Endpoints:
 * - GET /api/content/[id] - Get specific draft
 * - PUT /api/content/[id] - Update draft
 * - DELETE /api/content/[id] - Delete draft
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

import { GET, PUT, DELETE } from '../route';
import { sql } from '@vercel/postgres';

const { auth } = require('@clerk/nextjs');
const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Content Draft [id] API', () => {
  const mockParams = { params: { id: 'draft-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/content/[id]', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 if content draft does not exist', async () => {
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

    it('should return 403 if content draft belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Content exists but belongs to different user
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('access');
    });

    it('should return content draft for authenticated user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockDraft = {
        id: 'draft-123',
        clerk_id: 'user_123',
        venture_id: 'venture-123',
        topic: 'AI in Healthcare',
        original_text: 'AI is transforming healthcare...',
        edited_text: 'Updated: AI is transforming healthcare...',
        ai_confidence_score: 0.92,
        status: 'pending_review',
        created_at: new Date('2025-01-01'),
      };

      mockSql.mockResolvedValueOnce({
        rows: [mockDraft],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.topic).toBe('AI in Healthcare');
      expect(data.status).toBe('pending_review');
    });
  });

  describe('PUT /api/content/[id]', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ edited_text: 'Updated content' }),
      });

      // Act
      const response = await PUT(request, mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 if content draft does not exist', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ edited_text: 'Updated content' }),
      });

      // Act
      const response = await PUT(request, mockParams);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 403 if content draft belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ edited_text: 'Updated content' }),
      });

      // Act
      const response = await PUT(request, mockParams);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should update content draft with valid data', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Verify ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Get current values
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            topic: 'Old Topic',
            edited_text: 'Old content',
            ai_confidence_score: 0.5,
            status: 'pending_validation',
            scheduled_publish_at: null,
            hashtags: [],
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Update draft
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'draft-123',
            clerk_id: 'user_123',
            venture_id: 'venture-123',
            topic: 'Updated Topic',
            original_text: 'Original content',
            edited_text: 'Updated content',
            status: 'pending_review',
            created_at: new Date('2025-01-01'),
          },
        ],
        command: 'UPDATE',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({
          topic: 'Updated Topic',
          edited_text: 'Updated content',
          status: 'pending_review',
        }),
      });

      // Act
      const response = await PUT(request, mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.topic).toBe('Updated Topic');
      expect(data.edited_text).toBe('Updated content');
    });

    it('should validate status enum on update', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid_status' }),
      });

      // Act
      const response = await PUT(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('status');
    });
  });

  describe('DELETE /api/content/[id]', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await DELETE(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 if content draft does not exist', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      const response = await DELETE(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 403 if content draft belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await DELETE(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should delete content draft successfully', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Verify ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Delete draft
      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await DELETE(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(204);
    });
  });
});
