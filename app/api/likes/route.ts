// app/api/likes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.likes_POSTGRES_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET /api/likes
export async function GET(req: NextRequest) {
  try {
    // Simple test query to ensure DB connection
    await pool.query('SELECT 1');

    // Fetch top 10 pages by like_count
    const result = await pool.query(
      'SELECT page_id, like_count, updated_at FROM page_stats ORDER BY like_count DESC LIMIT 10'
    );

    return NextResponse.json({
      success: true,
      pages: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error in likes API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// OPTIONS /api/likes — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // 204 No Content is preferred for preflight
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
