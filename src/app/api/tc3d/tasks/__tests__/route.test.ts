/**
 * TC3D Tasks API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Tasks are global entities (things you can do with tools)
 * - No authentication required for GET (public reference data)
 * - Returns tasks grouped by category
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

describe('TC3D Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tc3d/tasks', () => {
    it('should return empty array when no tasks exist', async () => {
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

    it('should return all tasks with categories', async () => {
      // Arrange
      const mockTasks = [
        {
          id: 'task-1',
          task_name: 'Build REST API',
          description: 'Create RESTful endpoints',
          category: 'feature',
          created_at: new Date('2025-01-01'),
        },
        {
          id: 'task-2',
          task_name: 'Implement Authentication',
          description: 'Add auth middleware',
          category: 'pattern',
          created_at: new Date('2025-01-02'),
        },
        {
          id: 'task-3',
          task_name: 'Setup CI/CD Pipeline',
          description: 'Automate deployments',
          category: 'infrastructure',
          created_at: new Date('2025-01-03'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockTasks,
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
      expect(data[0].task_name).toBe('Build REST API');
      expect(data[0].category).toBe('feature');
      expect(data[1].category).toBe('pattern');
      expect(data[2].category).toBe('infrastructure');
    });

    it('should order tasks by category then name', async () => {
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
      expect(fullQuery).toContain('category');
      expect(fullQuery).toContain('task_name');
    });
  });
});
