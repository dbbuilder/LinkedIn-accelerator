/**
 * Brand Guide API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - One brand guide per venture (UNIQUE constraint on venture_id)
 * - Users can only access/modify their own ventures' brand guides
 * - Tone must be one of: technical, conversational, authoritative, casual
 * - POST creates or updates (upsert behavior)
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

describe('Brand Guide API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ventures/[id]/brand-guide', () => {
    const mockParams = { params: { id: 'venture-123' } };

    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 if venture belongs to different user', async () => {
      // Arrange: User trying to access another user's venture
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture exists but belongs to different user
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }], // Different user
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

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Venture not found');
    });

    it('should return null if brand guide does not exist for venture', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture exists (owned by user)
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Brand guide doesn't exist
      mockSql.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeNull();
    });

    it('should return brand guide for valid venture', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const mockBrandGuide = {
        id: 'brand-guide-123',
        venture_id: 'venture-123',
        tone: 'technical',
        audience: ['developers', 'CTOs'],
        content_pillars: ['AI', 'Cloud', 'Security'],
        negative_keywords: ['politics', 'religion'],
        posting_frequency: 3,
        auto_approval_threshold: 0.90,
        target_platforms: ['linkedin', 'devto'],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      };

      // Venture exists
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Brand guide exists
      mockSql.mockResolvedValueOnce({
        rows: [mockBrandGuide],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Act
      const response = await GET(new Request('http://localhost'), mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tone).toBe('technical');
      expect(data.audience).toEqual(['developers', 'CTOs']);
      expect(data.posting_frequency).toBe(3);
    });
  });

  describe('POST /api/ventures/[id]/brand-guide', () => {
    const mockParams = { params: { id: 'venture-123' } };

    it('should reject unauthenticated requests with 401', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ tone: 'technical' }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 if venture belongs to different user', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture belongs to different user
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_456' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ tone: 'technical' }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate tone enum values', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      // Venture exists
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tone: 'invalid-tone', // Invalid tone
          audience: ['developers'],
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('tone');
      expect(data.error).toContain('technical, conversational, authoritative, casual');
    });

    it('should require tone field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          audience: ['developers'], // tone is missing
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('tone is required');
    });

    it('should require audience field', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tone: 'technical', // audience is missing
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('audience is required');
    });

    it('should validate audience is array', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          tone: 'technical',
          audience: 'developers', // Should be array
        }),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('audience must be an array');
    });

    it('should create new brand guide with valid data', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const newBrandGuide = {
        tone: 'technical' as const,
        audience: ['developers', 'CTOs'],
        content_pillars: ['AI', 'Cloud'],
        negative_keywords: ['politics'],
        posting_frequency: 5,
        auto_approval_threshold: 0.85,
        target_platforms: ['linkedin', 'devto'],
      };

      // Venture exists
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Insert brand guide (upsert)
      mockSql.mockResolvedValueOnce({
        rows: [{
          id: 'brand-guide-123',
          venture_id: 'venture-123',
          ...newBrandGuide,
          created_at: new Date(),
          updated_at: new Date(),
        }],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(newBrandGuide),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.tone).toBe('technical');
      expect(data.audience).toEqual(['developers', 'CTOs']);
      expect(data.posting_frequency).toBe(5);
    });

    it('should update existing brand guide (upsert)', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const updatedBrandGuide = {
        tone: 'conversational' as const,
        audience: ['startup founders'],
        content_pillars: ['Growth', 'Product'],
        negative_keywords: [],
        posting_frequency: 7,
        auto_approval_threshold: 0.95,
        target_platforms: ['linkedin'],
      };

      // Venture exists
      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      // Update brand guide (upsert updates existing)
      mockSql.mockResolvedValueOnce({
        rows: [{
          id: 'brand-guide-123',
          venture_id: 'venture-123',
          ...updatedBrandGuide,
          created_at: new Date('2025-01-01'),
          updated_at: new Date(),
        }],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(updatedBrandGuide),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tone).toBe('conversational');
      expect(data.posting_frequency).toBe(7);
    });

    it('should use default values for optional fields', async () => {
      // Arrange
      (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

      const minimalBrandGuide = {
        tone: 'casual' as const,
        audience: ['general public'],
        // Optional fields not provided - should use defaults
      };

      mockSql.mockResolvedValueOnce({
        rows: [{ clerk_id: 'user_123' }],
        command: 'SELECT',
        rowCount: 1,
        fields: [],
      } as any);

      mockSql.mockResolvedValueOnce({
        rows: [{
          id: 'brand-guide-123',
          venture_id: 'venture-123',
          ...minimalBrandGuide,
          content_pillars: [],
          negative_keywords: [],
          posting_frequency: 3, // Default
          auto_approval_threshold: 0.90, // Default
          target_platforms: ['linkedin', 'devto', 'portfolio'], // Default
          created_at: new Date(),
          updated_at: new Date(),
        }],
        command: 'INSERT',
        rowCount: 1,
        fields: [],
      } as any);

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(minimalBrandGuide),
      });

      // Act
      const response = await POST(request, mockParams);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.posting_frequency).toBe(3);
      expect(data.auto_approval_threshold).toBe(0.90);
      expect(data.target_platforms).toEqual(['linkedin', 'devto', 'portfolio']);
    });
  });
});
