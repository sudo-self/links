import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env['likes_POSTGRES_URL'] || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    
    const result = await pool.query(
      'SELECT page_id, like_count FROM page_stats WHERE page_id = $1',
      [pageId]
    );
    
    if (result.rows.length === 0) {
      // Page doesn't exist yet, create it
      await pool.query(
        'INSERT INTO page_stats (page_id, like_count) VALUES ($1, $2)',
        [pageId, 0]
      );
      
      return NextResponse.json({ 
        success: true, 
        page_id: pageId,
        likes: 0,
        hasLiked: false
      });
    }
    
    const page = result.rows[0];
    
    // Check if user has liked this page (using IP as identifier for demo)
    const userHash = request.headers.get('x-forwarded-for') || 'anonymous';
    const likeCheck = await pool.query(
      'SELECT id FROM page_likes WHERE page_id = $1 AND user_hash = $2',
      [pageId, userHash]
    );
    
    return NextResponse.json({ 
      success: true, 
      page_id: page.page_id,
      likes: page.like_count,
      hasLiked: likeCheck.rows.length > 0
    });
  } catch (error) {
    console.error('Error fetching page likes:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { pageId } = await params;
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { pageId } = await params;
    const userHash = request.headers.get('x-forwarded-for') || 'anonymous';
    
    await client.query('BEGIN');
    
    // Remove the like record
    const deleteResult = await client.query(
      'DELETE FROM page_likes WHERE page_id = $1 AND user_hash = $2 RETURNING id',
      [pageId, userHash]
    );
    
    if (deleteResult.rows.length > 0) {
      // Only decrement if a like was actually removed
      await client.query(
        'UPDATE page_stats SET like_count = GREATEST(like_count - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE page_id = $1',
        [pageId]
      );
    }
    
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
    console.error('Error removing like:', error);
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
