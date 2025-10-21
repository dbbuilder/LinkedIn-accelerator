/**
 * TC3D Tiers API Tests
 * Following TDD: Write tests FIRST, then implement to pass
 *
 * Business Rules:
 * - Tiers are global entities (competency levels)
 * - No authentication required for GET (public reference data)
 * - Returns tiers ordered by order_index
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

describe('TC3D Tiers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tc3d/tiers', () => {
    it('should return empty array when no tiers exist', async () => {
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

    it('should return all tiers ordered by order_index', async () => {
      // Arrange
      const mockTiers = [
        {
          id: 'tier-1',
          tier_name: 'Novice',
          description: 'Just getting started',
          color_hex: '#EF4444',
          order_index: 1,
          created_at: new Date('2025-01-01'),
        },
        {
          id: 'tier-2',
          tier_name: 'Intermediate',
          description: 'Building confidence',
          color_hex: '#F59E0B',
          order_index: 2,
          created_at: new Date('2025-01-02'),
        },
        {
          id: 'tier-3',
          tier_name: 'Expert',
          description: 'Deep mastery',
          color_hex: '#10B981',
          order_index: 3,
          created_at: new Date('2025-01-03'),
        },
      ];

      mockSql.mockResolvedValue({
        rows: mockTiers,
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
      expect(data[0].tier_name).toBe('Novice');
      expect(data[0].order_index).toBe(1);
      expect(data[1].order_index).toBe(2);
      expect(data[2].order_index).toBe(3);
    });

    it('should order tiers by order_index', async () => {
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
      expect(fullQuery).toContain('order_index');
    });
  });
});
