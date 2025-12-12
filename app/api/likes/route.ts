import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env['likes_POSTGRES_URL'] || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET() {
  try {
    // Test connection
    await pool.query('SELECT 1');
    
    // Get top pages by likes
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
      error: 'Database connection error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { pageId } = await request.json();
    
    if (!pageId) {
      return NextResponse.json({ 
        success: false, 
        error: 'pageId is required'
      }, { status: 400 });
    }
    
    const userHash = request.headers.get('x-forwarded-for') || 'anonymous';
    
    await client.query('BEGIN');
    
    // Check if page exists
    const pageCheck = await client.query(
      'SELECT page_id FROM page_stats WHERE page_id = $1',
      [pageId]
    );
    
    if (pageCheck.rows.length === 0) {
      // Create page if it doesn't exist
      await client.query(
        'INSERT INTO page_stats (page_id, like_count) VALUES ($1, $2)',
        [pageId, 1]
      );
    } else {
      // Update existing page
      await client.query(
        'UPDATE page_stats SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP WHERE page_id = $1',
        [pageId]
      );
    }
    
    // Record the like
    await client.query(
      'INSERT INTO page_likes (page_id, user_hash) VALUES ($1, $2) ON CONFLICT (page_id, user_hash) DO NOTHING',
      [pageId, userHash]
    );
    
    await client.query('COMMIT');
    
    // Get updated count
    const result = await client.query(
      'SELECT like_count FROM page_stats WHERE page_id = $1',
      [pageId]
    );
    
    return NextResponse.json({ 
      success: true, 
      likes: result.rows[0]?.like_count || 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding like:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    client.release();
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
