/**
 * Ventures API Route
 * Implements CRUD operations for ventures with Clerk authentication
 *
 * TDD: This implementation is driven by tests in __tests__/route.test.ts
 */

import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

/**
 * GET /api/ventures
 * Returns all ventures for the authenticated user
 */
export async function GET() {
  try {
    // 1. Authenticate via Clerk
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Query Railway PostgreSQL with explicit filtering by clerk_id
    const result = await sql`
      SELECT id, venture_name, description, industry, created_at
      FROM venture
      WHERE clerk_id = ${userId}
      ORDER BY created_at DESC
    `;

    // 3. Return ventures
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/ventures error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ventures
 * Creates a new venture for the authenticated user
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate via Clerk
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { venture_name, description, industry } = body;

    // Validate required fields
    if (!venture_name || venture_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'venture_name is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 3. Insert into database
    try {
      const result = await sql`
        INSERT INTO venture (clerk_id, venture_name, description, industry)
        VALUES (${userId}, ${venture_name.trim()}, ${description || null}, ${industry || null})
        RETURNING id, clerk_id, venture_name, description, industry, created_at
      `;

      // 4. Return created venture with 201 status
      return NextResponse.json(result.rows[0], { status: 201 });
    } catch (dbError: any) {
      // Handle unique constraint violation (duplicate venture name for user)
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'A venture with this name already exists' },
          { status: 409 }
        );
      }
      throw dbError; // Re-throw other database errors
    }
  } catch (error) {
    console.error('POST /api/ventures error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
