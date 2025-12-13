export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
  ssl: { rejectUnauthorized: false },
});

// Helper function to get user hash from cookies
function getUserHash(req: NextRequest): string {
  // Try to get user hash from cookie
  const userHashCookie = req.cookies.get('user_hash')?.value;
  
  if (userHashCookie) {
    return userHashCookie;
  }
  
  // Generate a new user hash
  const newUserHash = 'user_' + Math.random().toString(36).substr(2, 9);
  return newUserHash;
}

// GET → Return page like count and whether current user has liked
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });
    }

    // Get user hash
    const userHash = getUserHash(req);
    
    // Get page stats
    const pageStatsResult = await pool.query(
      `SELECT page_id, like_count, updated_at
       FROM page_stats
       WHERE page_id = $1
       LIMIT 1`,
      [pageId]
    );

    let pageStats;
    if (pageStatsResult.rows.length === 0) {
      // Create initial entry if not exists
      const createResult = await pool.query(
        `INSERT INTO page_stats (page_id, like_count)
         VALUES ($1, 0)
         RETURNING page_id, like_count, updated_at`,
        [pageId]
      );
      pageStats = createResult.rows[0];
    } else {
      pageStats = pageStatsResult.rows[0];
    }

    // Check if current user has liked this page
    const userLikeResult = await pool.query(
      `SELECT 1 FROM page_likes 
       WHERE page_id = $1 AND user_hash = $2
       LIMIT 1`,
      [pageId, userHash]
    );

    const hasLiked = userLikeResult.rows.length > 0;

    const response = NextResponse.json({
      success: true,
      likes: pageStats.like_count,
      hasLiked,
      page: pageStats
    });

    // Set user hash cookie if not present
    if (!req.cookies.get('user_hash')) {
      response.cookies.set('user_hash', userHash, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Error in GET likes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST → Add a like from current user
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });
    }

    // Get user hash
    const userHash = getUserHash(req);

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert or update page_stats
      const pageStatsResult = await client.query(
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

      // Check if user has already liked
      const existingLike = await client.query(
        `SELECT 1 FROM page_likes 
         WHERE page_id = $1 AND user_hash = $2
         LIMIT 1`,
        [pageId, userHash]
      );

      if (existingLike.rows.length === 0) {
        // Record the user's like
        await client.query(
          `INSERT INTO page_likes (page_id, user_hash)
           VALUES ($1, $2)`,
          [pageId, userHash]
        );
      }

      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        likes: pageStatsResult.rows[0].like_count,
        hasLiked: true,
        page: pageStatsResult.rows[0]
      });

      // Set user hash cookie if not present
      if (!req.cookies.get('user_hash')) {
        response.cookies.set('user_hash', userHash, {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      }

      return response;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error in POST likes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE → Remove a like from current user
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });
    }

    // Get user hash
    const userHash = getUserHash(req);

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user has liked
      const existingLike = await client.query(
        `SELECT 1 FROM page_likes 
         WHERE page_id = $1 AND user_hash = $2
         LIMIT 1`,
        [pageId, userHash]
      );

      if (existingLike.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: 'User has not liked this page',
          hasLiked: false
        });
      }

      // Remove user's like
      await client.query(
        `DELETE FROM page_likes 
         WHERE page_id = $1 AND user_hash = $2`,
        [pageId, userHash]
      );

      // Decrement page like count (but not below 0)
      const pageStatsResult = await client.query(
        `
        UPDATE page_stats 
        SET like_count = GREATEST(0, like_count - 1),
            updated_at = NOW()
        WHERE page_id = $1
        RETURNING page_id, like_count, updated_at
        `,
        [pageId]
      );

      await client.query('COMMIT');

      const response = NextResponse.json({
        success: true,
        likes: pageStatsResult.rows[0]?.like_count || 0,
        hasLiked: false,
        page: pageStatsResult.rows[0]
      });

      // Set user hash cookie if not present
      if (!req.cookies.get('user_hash')) {
        response.cookies.set('user_hash', userHash, {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      }

      return response;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error in DELETE likes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, X-Requested-With, Accept',
    },
  });
}
