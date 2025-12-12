// app/api/likes/[pageId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const connectionString =
  process.env.likes_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.likes_POSTGRES_URL_NO_SSL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Helper to unwrap the promise for type compatibility
type Params = { params: Promise<{ pageId: string }> };

export async function GET(req: NextRequest, context: Params) {
  const { pageId } = await context.params; // unwrap promise

  if (!pageId) {
    return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT page_id, like_count, updated_at 
       FROM page_stats 
       WHERE page_id = $1
       LIMIT 1`,
      [pageId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        page: { page_id: pageId, like_count: 0, updated_at: null },
      });
    }

    return NextResponse.json({ success: true, page: result.rows[0] });
  } catch (error) {
    console.error('Error in GET /api/likes/[pageId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST → Increment like count
export async function POST(req: NextRequest, context: Params) {
  const { pageId } = await context.params;

  if (!pageId) {
    return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO page_stats (page_id, like_count)
      VALUES ($1, 1)
      ON CONFLICT (page_id)
      DO UPDATE SET like_count = page_stats.like_count + 1,
                    updated_at = NOW()
      RETURNING page_id, like_count, updated_at
      `,
      [pageId]
    );

    return NextResponse.json({ success: true, page: result.rows[0] });
  } catch (error) {
    console.error('Error in POST /api/likes/[pageId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// OPTIONS → CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, X-CSRF-Token, X-Requested-With, Accept',
    },
  });
}

