import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type Params = {
  params: {
    id: string;
  };
};

const VALID_TONES = ['technical', 'conversational', 'authoritative', 'casual'] as const;
type Tone = typeof VALID_TONES[number];

export async function GET(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: ventureId } = params;

    // Verify venture exists and belongs to user
    const ventureResult = await sql`
      SELECT clerk_id
      FROM venture
      WHERE id = ${ventureId}
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

    // Get brand guide
    const brandGuideResult = await sql`
      SELECT id, venture_id, tone, audience, content_pillars, negative_keywords,
             posting_frequency, auto_approval_threshold, target_platforms,
             created_at, updated_at
      FROM brand_guide
      WHERE venture_id = ${ventureId}
    `;

    if (brandGuideResult.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(brandGuideResult.rows[0]);
  } catch (error) {
    console.error('GET /api/ventures/[id]/brand-guide error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: ventureId } = params;

    // Verify venture exists and belongs to user
    const ventureResult = await sql`
      SELECT clerk_id
      FROM venture
      WHERE id = ${ventureId}
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

    const body = await request.json();
    const {
      tone,
      audience,
      content_pillars = [],
      negative_keywords = [],
      posting_frequency = 3,
      auto_approval_threshold = 0.90,
      target_platforms = ['linkedin', 'devto', 'portfolio'],
    } = body;

    // Validate required fields
    if (!tone) {
      return NextResponse.json(
        { error: 'tone is required' },
        { status: 400 }
      );
    }

    if (!audience) {
      return NextResponse.json(
        { error: 'audience is required' },
        { status: 400 }
      );
    }

    // Validate tone enum
    if (!VALID_TONES.includes(tone)) {
      return NextResponse.json(
        { error: `tone must be one of: ${VALID_TONES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate audience is array
    if (!Array.isArray(audience)) {
      return NextResponse.json(
        { error: 'audience must be an array' },
        { status: 400 }
      );
    }

    // Upsert brand guide (ON CONFLICT handles both create and update)
    const result = await sql`
      INSERT INTO brand_guide (
        venture_id, tone, audience, content_pillars, negative_keywords,
        posting_frequency, auto_approval_threshold, target_platforms
      )
      VALUES (
        ${ventureId}, ${tone}, ${JSON.stringify(audience)},
        ${JSON.stringify(content_pillars)}, ${JSON.stringify(negative_keywords)},
        ${posting_frequency}, ${auto_approval_threshold}, ${JSON.stringify(target_platforms)}
      )
      ON CONFLICT (venture_id)
      DO UPDATE SET
        tone = EXCLUDED.tone,
        audience = EXCLUDED.audience,
        content_pillars = EXCLUDED.content_pillars,
        negative_keywords = EXCLUDED.negative_keywords,
        posting_frequency = EXCLUDED.posting_frequency,
        auto_approval_threshold = EXCLUDED.auto_approval_threshold,
        target_platforms = EXCLUDED.target_platforms,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, venture_id, tone, audience, content_pillars, negative_keywords,
                posting_frequency, auto_approval_threshold, target_platforms,
                created_at, updated_at
    `;

    const brandGuide = result.rows[0];
    // If created_at equals updated_at, it's a new insert (201), otherwise it's an update (200)
    const isNewRecord = new Date(brandGuide.created_at).getTime() === new Date(brandGuide.updated_at).getTime();

    return NextResponse.json(brandGuide, { status: isNewRecord ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/ventures/[id]/brand-guide error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
