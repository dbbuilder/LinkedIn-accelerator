/**
 * TC3D Capabilities API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Capabilities are per-user (clerk_id scoped)
 * - Score must be between 0 and 1
 * - Source enum: github_analysis, self_reported, engagement, manual
 * - Unique constraint: (clerk_id, tool_id, task_id)
 * - POST creates or updates (upsert pattern)
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

describe('TC3D Capabilities API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tc3d/capabilities', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return empty array when user has no capabilities', async () => {
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

    it('should return capabilities for authenticated user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockCapabilities = [
        {
          id: 'cap-1',
          clerk_id: 'user_123',
          tool_id: 'tool-1',
          task_id: 'task-1',
          score: 0.85,
          source: 'github_analysis',
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-01'),
        },
        {
          id: 'cap-2',
          clerk_id: 'user_123',
          tool_id: 'tool-2',
          task_id: null,
          score: 0.92,
          source: 'self_reported',
          created_at: new Date('2025-01-02'),
          updated_at: new Date('2025-01-02'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockCapabilities,
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
      expect(data[0].score).toBe(0.85);
      expect(data[0].source).toBe('github_analysis');
    });

    it('should filter capabilities by clerk_id for multi-tenant isolation', async () => {
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

  describe('POST /api/tc3d/capabilities', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          score: 0.85,
          source: 'self_reported',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should require tool_id field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          score: 0.85,
          source: 'self_reported',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('tool_id');
    });

    it('should require score field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          source: 'self_reported',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('score');
    });

    it('should validate score is between 0 and 1', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          score: 1.5, // Invalid
          source: 'self_reported',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('score');
      expect(data.error).toContain('0 and 1');
    });

    it('should validate source enum values', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          score: 0.85,
          source: 'invalid_source', // Invalid
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('source');
      expect(data.error).toContain('github_analysis');
    });

    it('should create new capability with valid data', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const newCapability = {
        tool_id: 'tool-1',
        task_id: 'task-1',
        score: 0.85,
        source: 'self_reported',
      };

      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'cap-1',
            clerk_id: userId,
            ...newCapability,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(newCapability),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.score).toBe(0.85);
      expect(data.source).toBe('self_reported');
    });

    it('should update existing capability via upsert', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const updateCapability = {
        tool_id: 'tool-1',
        task_id: 'task-1',
        score: 0.92, // Updated score
        source: 'github_analysis',
      };

      const now = new Date();
      const earlier = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago

      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'cap-1',
            clerk_id: userId,
            ...updateCapability,
            created_at: earlier,
            updated_at: now,
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(updateCapability),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.score).toBe(0.92);
      expect(new Date(data.created_at).getTime()).toBeLessThan(new Date(data.updated_at).getTime());
    });

    it('should use default source of self_reported', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'cap-1',
            clerk_id: userId,
            tool_id: 'tool-1',
            task_id: null,
            score: 0.75,
            source: 'self_reported', // Default
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          score: 0.75,
          // No source provided
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.source).toBe('self_reported');
    });

    it('should allow task_id to be null', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      mockSql.mockResolvedValueOnce({
        rows: [
          {
            id: 'cap-1',
            clerk_id: userId,
            tool_id: 'tool-1',
            task_id: null, // General capability for tool, not task-specific
            score: 0.80,
            source: 'self_reported',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: 'tool-1',
          task_id: null,
          score: 0.80,
          source: 'self_reported',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.task_id).toBeNull();
    });
  });
});
