import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: contentId } = params;

    // Verify ownership and get current status
    const ownershipCheck = await sql`
      SELECT clerk_id, status
      FROM content_draft
      WHERE id = ${contentId}
    `;

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    const draft = ownershipCheck.rows[0];

    if (draft.clerk_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this content draft' },
        { status: 403 }
      );
    }

    // Check if already approved or published
    if (draft.status === 'approved') {
      return NextResponse.json(
        { error: 'Content draft is already approved' },
        { status: 400 }
      );
    }

    if (draft.status === 'published') {
      return NextResponse.json(
        { error: 'Content draft is already published' },
        { status: 400 }
      );
    }

    // Update status to approved and set approved_at timestamp
    const result = await sql`
      UPDATE content_draft
      SET status = 'approved',
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ${contentId}
      RETURNING id, clerk_id, venture_id, topic, original_text, edited_text,
                ai_confidence_score, status, scheduled_publish_at, created_at,
                approved_at, published_at, hashtags
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('POST /api/content/[id]/approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
