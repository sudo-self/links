export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
  ssl: { rejectUnauthorized: false },
});

// GET → Return page like
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await context.params; // await the Promise
  if (!pageId)
    return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT page_id, like_count, updated_at
     FROM page_stats
     WHERE page_id = $1
     LIMIT 1`,
    [pageId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ success: true, page: { page_id: pageId, like_count: 0, updated_at: null } });
  }

  return NextResponse.json({ success: true, page: rows[0] });
}

// POST → Increment like
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await context.params; // await the Promise
  if (!pageId)
    return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });

  const { rows } = await pool.query(
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

  return NextResponse.json({ success: true, page: rows[0] });
}

// OPTIONS → CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, X-Requested-With, Accept',
    },
  });
}
