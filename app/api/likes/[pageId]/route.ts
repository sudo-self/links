import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const { pageId } = await params;
    
    const result = await pool.query(
      'SELECT page_id, like_count FROM page_stats WHERE page_id = $1',
      [pageId]
    );
    
    if (result.rows.length === 0) {

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
  { params }: { params: { pageId: string } }
) {
  const client = await pool.connect();
  
  try {
    const { pageId } = await params;
    const userHash = request.headers.get('x-forwarded-for') || 'anonymous';
    
    await client.query('BEGIN');
    
 
    const pageCheck = await client.query(
      'SELECT page_id FROM page_stats WHERE page_id = $1',
      [pageId]
    );
    
    if (pageCheck.rows.length === 0) {
   
      await client.query(
        'INSERT INTO page_stats (page_id, like_count) VALUES ($1, $2)',
        [pageId, 1]
      );
    } else {
 
      await client.query(
        'UPDATE page_stats SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP WHERE page_id = $1',
        [pageId]
      );
    }
    

    await client.query(
      'INSERT INTO page_likes (page_id, user_hash) VALUES ($1, $2) ON CONFLICT (page_id, user_hash) DO NOTHING',
      [pageId, userHash]
    );
    
    await client.query('COMMIT');
    

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
  { params }: { params: { pageId: string } }
) {
  const client = await pool.connect();
  
  try {
    const { pageId } = await params;
    const userHash = request.headers.get('x-forwarded-for') || 'anonymous';
    
    await client.query('BEGIN');
    

    const deleteResult = await client.query(
      'DELETE FROM page_likes WHERE page_id = $1 AND user_hash = $2 RETURNING id',
      [pageId, userHash]
    );
    
    if (deleteResult.rows.length > 0) {

      await client.query(
        'UPDATE page_stats SET like_count = GREATEST(like_count - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE page_id = $1',
        [pageId]
      );
    }
    
    await client.query('COMMIT');
    

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
