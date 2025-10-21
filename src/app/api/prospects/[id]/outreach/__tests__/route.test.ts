/**
 * Prospect Outreach API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - POST /api/prospects/[id]/outreach - Create outreach task
 * - Phase enum: like, comment, connect
 * - Status default: pending_approval
 * - Can include AI-generated message
 * - Only owner can create outreach for their prospects
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

describe('Prospect Outreach API', () => {
  const mockParams = { params: { id: 'prospect-123' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/prospects/[id]/outreach', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'comment',
          generated_message: 'Great insights on AI!',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should require phase field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          generated_message: 'Great insights on AI!',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('phase');
    });

    it('should validate phase enum values', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'invalid_phase', // Invalid
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('phase');
      expect(data.error).toContain('like, comment, connect');
    });

    it('should return 404 if prospect does not exist', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Prospect doesn't exist
      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'comment',
          generated_message: 'Great insights!',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Prospect not found');
    });

    it('should return 403 if prospect belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Prospect exists but belongs to different user
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'comment',
          generated_message: 'Great insights!',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('access');
    });

    it('should create outreach task with valid data', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      // Verify prospect ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert outreach task
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'outreach-1',
            prospect_id: 'prospect-123',
            phase: 'comment',
            generated_message: 'Great insights on AI!',
            edited_message: null,
            status: 'pending_approval',
            scheduled_at: null,
            created_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'comment',
          generated_message: 'Great insights on AI!',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.phase).toBe('comment');
      expect(data.generated_message).toBe('Great insights on AI!');
      expect(data.status).toBe('pending_approval');
    });

    it('should use default status of pending_approval', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      // Verify prospect ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert outreach task
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'outreach-1',
            prospect_id: 'prospect-123',
            phase: 'like',
            status: 'pending_approval', // Default
            created_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'like',
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('pending_approval');
    });

    it('should allow scheduled_at to be set', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const scheduledDate = new Date('2025-02-01T10:00:00Z');

      // Verify prospect ownership
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: userId }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert outreach task
      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'outreach-1',
            prospect_id: 'prospect-123',
            phase: 'connect',
            generated_message: 'Would love to connect!',
            status: 'pending_approval',
            scheduled_at: scheduledDate,
            created_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          phase: 'connect',
          generated_message: 'Would love to connect!',
          scheduled_at: scheduledDate.toISOString(),
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.scheduled_at).toBeTruthy();
    });
  });
});
