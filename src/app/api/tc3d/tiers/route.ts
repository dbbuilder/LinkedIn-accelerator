import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, tier_name, description, color_hex, order_index, created_at
      FROM tier
      ORDER BY order_index ASC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/tc3d/tiers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
