import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, task_name, description, category, created_at
      FROM task
      ORDER BY category ASC, task_name ASC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/tc3d/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
