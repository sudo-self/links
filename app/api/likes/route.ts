// app/api/likes/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/init-db';

export async function GET() {
  const { rows } = await pool.query(
    `SELECT page_id, like_count
     FROM page_stats
     ORDER BY like_count DESC
     LIMIT 10`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { pageId, userHash } = await req.json();

  if (!pageId) return NextResponse.json({ error: 'Missing pageId' }, { status: 400 });
  if (!userHash) return NextResponse.json({ error: 'Missing userHash' }, { status: 400 });

  try {
    const result = await pool.query(
      `
      INSERT INTO page_stats (page_id, like_count)
      VALUES ($1, 1)
      ON CONFLICT (page_id)
      DO UPDATE SET like_count = page_stats.like_count + 1
      RETURNING page_id, like_count
      `,
      [pageId]
    );

    // track per-user like (optional)
    await pool.query(
      `
      INSERT INTO page_likes (page_id, user_hash)
      VALUES ($1, $2)
      ON CONFLICT (page_id, user_hash) DO NOTHING
      `,
      [pageId, userHash]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

