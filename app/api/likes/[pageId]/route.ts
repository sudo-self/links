import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET() {
  try {
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}