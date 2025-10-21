import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

const VALID_STATUSES = [
  'pending_validation',
  'pending_review',
  'approved',
  'rejected',
  'published',
] as const;
type Status = typeof VALID_STATUSES[number];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const result = await sql`
      SELECT id, clerk_id, venture_id, topic, original_text, edited_text,
             ai_confidence_score, status, scheduled_publish_at, created_at,
             approved_at, published_at, hashtags
      FROM content_draft
      WHERE clerk_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/content error:', error);
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
      venture_id,
      topic,
      original_text,
      edited_text,
      ai_confidence_score,
      status = 'pending_validation',
      scheduled_publish_at,
      hashtags = [],
    } = body;

    // Validate required fields
    if (!original_text || original_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'original_text is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate AI confidence score
    if (
      ai_confidence_score !== undefined &&
      (ai_confidence_score < 0 || ai_confidence_score > 1)
    ) {
      return NextResponse.json(
        { error: 'ai_confidence_score must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Validate status enum
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // If venture_id is provided, verify it exists and belongs to user
    if (venture_id) {
      const ventureResult = await sql`
        SELECT clerk_id
        FROM venture
        WHERE id = ${venture_id}
      `;

      if (ventureResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Venture not found' },
          { status: 404 }
        );
      }

      if (ventureResult.rows[0].clerk_id !== userId) {
        return NextResponse.json(
          { error: 'You do not have access to this venture' },
          { status: 403 }
        );
      }
    }

    // Insert content draft
    const result = await sql`
      INSERT INTO content_draft (
        clerk_id, venture_id, topic, original_text, edited_text,
        ai_confidence_score, status, scheduled_publish_at, hashtags
      )
      VALUES (
        ${userId}, ${venture_id || null}, ${topic || null},
        ${original_text.trim()}, ${edited_text || null},
        ${ai_confidence_score || null}, ${status},
        ${scheduled_publish_at || null}, ${JSON.stringify(hashtags)}
      )
      RETURNING id, clerk_id, venture_id, topic, original_text, edited_text,
                ai_confidence_score, status, scheduled_publish_at, created_at,
                approved_at, published_at, hashtags
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
