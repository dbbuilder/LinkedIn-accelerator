import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: prospectId } = params;

    // Join with venture to verify ownership
    const result = await sql`
      SELECT p.id, p.clerk_id, p.venture_id, p.linkedin_url, p.name,
             p.title, p.company, p.profile_summary, p.followers_count,
             p.avg_post_likes, p.avg_post_comments, p.criticality_score,
             p.relevance_score, p.reach_score, p.proximity_score,
             p.reciprocity_score, p.gap_fill_score, p.discovered_at,
             p.last_updated_at
      FROM prospect p
      JOIN venture v ON p.venture_id = v.id
      WHERE p.id = ${prospectId} AND v.clerk_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('GET /api/prospects/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
