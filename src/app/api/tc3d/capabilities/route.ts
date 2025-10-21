import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

const VALID_SOURCES = [
  'github_analysis',
  'self_reported',
  'engagement',
  'manual',
] as const;
type Source = typeof VALID_SOURCES[number];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await sql`
      SELECT id, clerk_id, tool_id, task_id, score, source,
             created_at, updated_at
      FROM capability_score
      WHERE clerk_id = ${userId}
      ORDER BY updated_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/tc3d/capabilities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      tool_id,
      task_id = null,
      score,
      source = 'self_reported',
    } = body;

    // Validate required fields
    if (!tool_id) {
      return NextResponse.json(
        { error: 'tool_id is required' },
        { status: 400 }
      );
    }

    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: 'score is required' },
        { status: 400 }
      );
    }

    // Validate score range
    if (score < 0 || score > 1) {
      return NextResponse.json(
        { error: 'score must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Validate source enum
    if (source && !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: `source must be one of: ${VALID_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert capability (ON CONFLICT handles both create and update)
    const result = await sql`
      INSERT INTO capability_score (
        clerk_id, tool_id, task_id, score, source
      )
      VALUES (
        ${userId}, ${tool_id}, ${task_id}, ${score}, ${source}
      )
      ON CONFLICT (clerk_id, tool_id, task_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        source = EXCLUDED.source,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, clerk_id, tool_id, task_id, score, source,
                created_at, updated_at
    `;

    const capability = result.rows[0];
    // If created_at equals updated_at, it's a new insert (201), otherwise it's an update (200)
    const isNewRecord = new Date(capability.created_at).getTime() === new Date(capability.updated_at).getTime();

    return NextResponse.json(capability, { status: isNewRecord ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/tc3d/capabilities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
