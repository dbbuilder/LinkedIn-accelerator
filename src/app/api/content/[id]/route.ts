import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type Params = {
  params: {
    id: string;
  };
};

const VALID_STATUSES = [
  'pending_validation',
  'pending_review',
  'approved',
  'rejected',
  'published',
] as const;
type Status = typeof VALID_STATUSES[number];

export async function GET(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: contentId } = params;

    const result = await sql`
      SELECT id, clerk_id, venture_id, topic, original_text, edited_text,
             ai_confidence_score, status, scheduled_publish_at, created_at,
             approved_at, published_at, hashtags
      FROM content_draft
      WHERE id = ${contentId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    if (result.rows[0].clerk_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this content draft' },
        { status: 403 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('GET /api/content/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: contentId } = params;

    // Verify ownership
    const ownershipCheck = await sql`
      SELECT clerk_id
      FROM content_draft
      WHERE id = ${contentId}
    `;

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    if (ownershipCheck.rows[0].clerk_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this content draft' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      topic,
      edited_text,
      ai_confidence_score,
      status,
      scheduled_publish_at,
      hashtags,
    } = body;

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current values
    const current = await sql`
      SELECT topic, edited_text, ai_confidence_score, status,
             scheduled_publish_at, hashtags
      FROM content_draft
      WHERE id = ${contentId}
    `;

    const currentData = current.rows[0];

    // Use provided values or keep current ones
    const newTopic = topic !== undefined ? topic : currentData.topic;
    const newEditedText = edited_text !== undefined ? edited_text : currentData.edited_text;
    const newScore = ai_confidence_score !== undefined ? ai_confidence_score : currentData.ai_confidence_score;
    const newStatus = status !== undefined ? status : currentData.status;
    const newScheduled = scheduled_publish_at !== undefined ? scheduled_publish_at : currentData.scheduled_publish_at;
    const newHashtags = hashtags !== undefined ? JSON.stringify(hashtags) : currentData.hashtags;

    // Update content draft
    const result = await sql`
      UPDATE content_draft
      SET topic = ${newTopic},
          edited_text = ${newEditedText},
          ai_confidence_score = ${newScore},
          status = ${newStatus},
          scheduled_publish_at = ${newScheduled},
          hashtags = ${newHashtags}
      WHERE id = ${contentId}
      RETURNING id, clerk_id, venture_id, topic, original_text, edited_text,
                ai_confidence_score, status, scheduled_publish_at, created_at,
                approved_at, published_at, hashtags
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /api/content/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: contentId } = params;

    // Verify ownership
    const ownershipCheck = await sql`
      SELECT clerk_id
      FROM content_draft
      WHERE id = ${contentId}
    `;

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    if (ownershipCheck.rows[0].clerk_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this content draft' },
        { status: 403 }
      );
    }

    // Delete the draft
    await sql`
      DELETE FROM content_draft
      WHERE id = ${contentId}
    `;

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/content/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
