/**
 * TC3D Tools API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Tools are global entities (shared across all users)
 * - No authentication required for GET (public reference data)
 * - Returns all tools with their categories
 */

// Mock dependencies BEFORE imports
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
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

const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('TC3D Tools API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tc3d/tools', () => {
    it('should return empty array when no tools exist', async () => {
      // Arrange
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

    it('should return all tools with categories', async () => {
      // Arrange
      const mockTools = [
        {
          id: 'tool-1',
          tool_name: 'React',
          category: 'library',
          official_url: 'https://react.dev',
          created_at: new Date('2025-01-01'),
        },
        {
          id: 'tool-2',
          tool_name: 'Next.js',
          category: 'framework',
          official_url: 'https://nextjs.org',
          created_at: new Date('2025-01-02'),
        },
        {
          id: 'tool-3',
          tool_name: 'TypeScript',
          category: 'language',
          official_url: 'https://www.typescriptlang.org',
          created_at: new Date('2025-01-03'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockTools,
        command: 'SELECT',
        rowCount: 3,
        fields: [],
      } as any);

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(3);
      expect(data[0].tool_name).toBe('React');
      expect(data[0].category).toBe('library');
      expect(data[1].category).toBe('framework');
      expect(data[2].category).toBe('language');
    });

    it('should order tools alphabetically by name', async () => {
      // Arrange
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
      expect(fullQuery).toContain('tool_name');
    });
  });
});
