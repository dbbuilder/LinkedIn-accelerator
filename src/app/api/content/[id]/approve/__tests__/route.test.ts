/**
 * Content Draft Approve API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - POST /api/content/[id]/approve - Approve a draft
 * - Sets status to 'approved'
 * - Sets approved_at timestamp
 * - Only the owner can approve their drafts
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

import { POST } from '../route';
import { sql } from '@vercel/postgres';

const { auth } = require('@clerk/nextjs');
const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Content Draft Approve API', () => {
  const mockParams = { params: { id: 'draft-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/content/[id]/approve', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

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
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('should return 403 if content draft belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456', status: 'pending_review' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('access');
    });

    it('should approve content draft successfully', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Verify ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123', status: 'pending_review' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const approvedAt = new Date();

      // Update to approved
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'draft-123',
            clerk_id: 'user_123',
            venture_id: 'venture-123',
            topic: 'AI in Healthcare',
            original_text: 'Content here...',
            status: 'approved',
            approved_at: approvedAt,
            created_at: new Date('2025-01-01'),
          },
        ],
        command: 'UPDATE',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('approved');
      expect(data.approved_at).toBeTruthy();
    });

    it('should return 400 if draft is already approved', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123', status: 'approved' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already approved');
    });

    it('should return 400 if draft is already published', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123', status: 'published' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already published');
    });
  });
});
