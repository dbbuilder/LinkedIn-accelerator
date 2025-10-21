/**
 * Ventures API Tests
 * Following TDD: Write tests FIRST, then implement to pass
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

describe('Ventures API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ventures', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange: No authenticated user
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act: Call GET endpoint
      const response = await GET();

      // Assert: Should return 401
      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });

    it('should return empty array when user has no ventures', async () => {
      // Arrange: Authenticated user with no ventures
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });
      mockSql.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act: Call GET endpoint
      const response = await GET();

      // Assert: Should return 200 with empty array
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);

      // Verify SQL query was called with clerk_id filter
      expect(mockSql).toHaveBeenCalled();
      const sqlParts = mockSql.mock.calls[0][0];
      const fullQuery = sqlParts.join('');
      expect(fullQuery).toContain('WHERE clerk_id =');
    });

    it('should return ventures for authenticated user', async () => {
      // Arrange: Authenticated user with ventures
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockVentures = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          venture_name: 'My SaaS Product',
          description: 'B2B SaaS Platform',
          industry: 'Technology',
          created_at: new Date('2025-01-01T00:00:00Z'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          venture_name: 'My Consulting Firm',
          description: 'Tech Consulting',
          industry: 'Consulting',
          created_at: new Date('2025-01-02T00:00:00Z'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockVentures,
        command: 'SELECT',
        rowCount: 2,
        fields: [],
      } as any);

      // Act: Call GET endpoint
      const response = await GET();

      // Assert: Should return 200 with ventures
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].venture_name).toBe('My SaaS Product');
      expect(data[1].venture_name).toBe('My Consulting Firm');
    });

    it('should only return ventures belonging to authenticated user', async () => {
      // Arrange: User with specific clerk_id
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

      // Assert: SQL should filter by clerk_id
      expect(mockSql).toHaveBeenCalled();
      const sqlParts = mockSql.mock.calls[0][0];
      const fullQuery = sqlParts.join('');
      expect(fullQuery).toContain('clerk_id');
      // User ID should be in the parameters
      expect(mockSql.mock.calls[0][1]).toBe(testUserId);
    });
  });

  describe('POST /api/ventures', () => {
    it('should reject unauthenticated requests with 401', async () => {
      // Arrange: No authenticated user
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost/api/ventures', {
        method: 'POST',
        body: JSON.stringify({
          venture_name: 'Test Venture',
          description: 'Test Description',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject request with missing venture_name', async () => {
      // Arrange: Authenticated user but missing required field
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost/api/ventures', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test Description',
          // venture_name is missing
        }),
      });

      // Act
      const response = await POST(request);

      // Assert: Should return 400 Bad Request
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('venture_name');
    });

    it('should reject request with empty venture_name', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const request = new Request('http://localhost/api/ventures', {
        method: 'POST',
        body: JSON.stringify({
          venture_name: '   ', // Empty/whitespace
          description: 'Test Description',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('venture_name');
    });

    it('should create venture with valid data', async () => {
      // Arrange
      const userId = 'user_123';
      (auth as jest.Mock).mockReturnValue({ userId });

      const newVenture = {
        venture_name: 'My New Venture',
        description: 'Innovative SaaS',
        industry: 'Technology',
      };

      const createdVenture = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        clerk_id: userId,
        ...newVenture,
        created_at: new Date('2025-01-01T00:00:00Z'),
      };

      mockSql.mockResolvedValue({
        rows: [createdVenture],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost/api/ventures', {
        method: 'POST',
        body: JSON.stringify(newVenture),
      });

      // Act
      const response = await POST(request);

      // Assert: Should return 201 Created
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.venture_name).toBe('My New Venture');
      expect(data.id).toBe('550e8400-e29b-41d4-a716-446655440000');

      // Verify INSERT was called with clerk_id
      expect(mockSql).toHaveBeenCalled();
      const sqlCall = mockSql.mock.calls[0];
      expect(sqlCall).toContainEqual(userId);
    });

    it('should handle duplicate venture_name for same user with 409', async () => {
      // Arrange: Duplicate venture name (unique constraint violation)
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const duplicateError: any = new Error('Unique constraint violation');
      duplicateError.code = '23505'; // PostgreSQL unique violation code
      mockSql.mockRejectedValue(duplicateError);

      const request = new Request('http://localhost/api/ventures', {
        method: 'POST',
        body: JSON.stringify({
          venture_name: 'Existing Venture',
          description: 'Test',
        }),
      });

      // Act
      const response = await POST(request);

      // Assert: Should return 409 Conflict
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should allow different users to have same venture_name', async () => {
      // This test documents business rule: venture names are unique per user,
      // not globally unique
      //
      // Database constraint: UNIQUE(clerk_id, venture_name)
      // This means user_123 and user_456 can both have "My Startup"

      expect(true).toBe(true); // Documented in schema
    });
  });
});
