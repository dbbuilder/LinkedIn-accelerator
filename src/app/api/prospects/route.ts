import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Join with venture to filter by user's ventures
    const result = await sql`
      SELECT p.id, p.clerk_id, p.venture_id, p.linkedin_url, p.name,
             p.title, p.company, p.profile_summary, p.followers_count,
             p.avg_post_likes, p.avg_post_comments, p.criticality_score,
             p.relevance_score, p.reach_score, p.proximity_score,
             p.reciprocity_score, p.gap_fill_score, p.discovered_at,
             p.last_updated_at
      FROM prospect p
      JOIN venture v ON p.venture_id = v.id
      WHERE v.clerk_id = ${userId}
      ORDER BY p.criticality_score DESC NULLS LAST, p.discovered_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/prospects error:', error);
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
      linkedin_url,
      name,
      title,
      company,
      profile_summary,
      followers_count,
      avg_post_likes,
      avg_post_comments,
    } = body;

    // Validate required fields
    if (!venture_id) {
      return NextResponse.json(
        { error: 'venture_id is required' },
        { status: 400 }
      );
    }

    if (!linkedin_url) {
      return NextResponse.json(
        { error: 'linkedin_url is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    if (!linkedin_url.includes('linkedin.com')) {
      return NextResponse.json(
        { error: 'linkedin_url must be a valid LinkedIn profile URL (must contain linkedin.com)' },
        { status: 400 }
      );
    }

    // Verify venture exists and belongs to user
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

    try {
      // Insert prospect
      const result = await sql`
        INSERT INTO prospect (
          clerk_id, venture_id, linkedin_url, name, title, company,
          profile_summary, followers_count, avg_post_likes, avg_post_comments
        )
        VALUES (
          ${userId}, ${venture_id}, ${linkedin_url}, ${name || null},
          ${title || null}, ${company || null}, ${profile_summary || null},
          ${followers_count || null}, ${avg_post_likes || null},
          ${avg_post_comments || null}
        )
        RETURNING id, clerk_id, venture_id, linkedin_url, name, title, company,
                  profile_summary, followers_count, avg_post_likes,
                  avg_post_comments, criticality_score, relevance_score,
                  reach_score, proximity_score, reciprocity_score,
                  gap_fill_score, discovered_at, last_updated_at
      `;

      return NextResponse.json(result.rows[0], { status: 201 });
    } catch (dbError: any) {
      if (dbError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A prospect with this LinkedIn URL already exists' },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('POST /api/prospects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
