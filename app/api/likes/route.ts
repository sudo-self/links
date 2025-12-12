// app/api/likes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Use explicit Neon env vars if available, fallback to POSTGRES_URL
const connectionString =
  process.env.likes_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.likes_POSTGRES_URL_NO_SSL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// GET → Return top 10 pages
export async function GET() {
  try {
    await pool.query('SELECT 1'); // keep-alive test for Neon

    const result = await pool.query(
      `SELECT page_id, like_count, updated_at 
       FROM page_stats 
       ORDER BY like_count DESC 
       LIMIT 10`
    );

    return NextResponse.json({
      success: true,
      pages: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error in GET /api/likes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// POST → Increment like count for a given pageId
export async function POST(req: NextRequest) {
  try {
    const { pageId } = await req.json();

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Missing pageId' },
        { status: 400 }
      );
    }

    // insert or increment
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

    return NextResponse.json({
      success: true,
      page: result.rows[0]
    });
  } catch (error) {
    console.error('Error in POST /api/likes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers':
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    }
  });
}
