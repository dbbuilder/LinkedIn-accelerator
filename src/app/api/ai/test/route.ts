/**
 * Test endpoint to verify AI route is accessible
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI route is accessible',
    timestamp: new Date().toISOString()
  })
}
