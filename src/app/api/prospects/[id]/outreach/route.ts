import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type Params = {
  params: {
    id: string;
  };
};

const VALID_PHASES = ['like', 'comment', 'connect'] as const;
type Phase = typeof VALID_PHASES[number];

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id: prospectId } = params;

    const body = await request.json();
    const {
      phase,
      generated_message,
      edited_message,
      scheduled_at,
      status = 'pending_approval',
    } = body;

    // Validate required fields
    if (!phase) {
      return NextResponse.json(
        { error: 'phase is required' },
        { status: 400 }
      );
    }

    // Validate phase enum
    if (!VALID_PHASES.includes(phase)) {
      return NextResponse.json(
        { error: `phase must be one of: ${VALID_PHASES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify prospect exists and user has access (through venture ownership)
    const prospectCheck = await sql`
      SELECT p.id, v.clerk_id
      FROM prospect p
      JOIN venture v ON p.venture_id = v.id
      WHERE p.id = ${prospectId}
    `;

    if (prospectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    if (prospectCheck.rows[0].clerk_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have access to this prospect' },
        { status: 403 }
      );
    }

    // Insert outreach task
    const result = await sql`
      INSERT INTO outreach_task (
        prospect_id, phase, generated_message, edited_message,
        status, scheduled_at
      )
      VALUES (
        ${prospectId}, ${phase}, ${generated_message || null},
        ${edited_message || null}, ${status}, ${scheduled_at || null}
      )
      RETURNING id, prospect_id, phase, generated_message, edited_message,
                status, scheduled_at, executed_at, created_at, error_message
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/prospects/[id]/outreach error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
