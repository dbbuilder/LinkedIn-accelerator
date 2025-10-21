import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, tool_name, category, official_url, created_at
      FROM tool
      ORDER BY tool_name ASC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/tc3d/tools error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
