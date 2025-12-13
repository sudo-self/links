// app/api/likes/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/init-db';

// Helper function to get user hash from cookies
function getUserHash(req: NextRequest): string {
  const userHashCookie = req.cookies.get('user_hash')?.value;
  if (userHashCookie) {
    return userHashCookie;
  }
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

// FIXED: Added req parameter to GET function
export async function GET(req: NextRequest) {
  try {
    const { rows } = await pool.query(
      `SELECT page_id, like_count
       FROM page_stats
       ORDER BY like_count DESC
       LIMIT 10`
    );
    
    const response = NextResponse.json({ success: true, pages: rows });
    
    // Ensure user hash cookie exists
    if (!req.cookies.get('user_hash')) {
      const userHash = getUserHash(req);
      response.cookies.set('user_hash', userHash, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pageId } = await req.json();

    if (!pageId) return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });

    const userHash = getUserHash(req);

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

    // track per-user like
    await pool.query(
      `
      INSERT INTO page_likes (page_id, user_hash)
      VALUES ($1, $2)
      ON CONFLICT (page_id, user_hash) DO NOTHING
      `,
      [pageId, userHash]
    );

    const response = NextResponse.json({ 
      success: true, 
      page: result.rows[0],
      hasLiked: true
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { pageId } = await req.json();

    if (!pageId) return NextResponse.json({ success: false, error: 'Missing pageId' }, { status: 400 });

    const userHash = getUserHash(req);

    // Check if user has liked
    const existingLike = await pool.query(
      `SELECT 1 FROM page_likes 
       WHERE page_id = $1 AND user_hash = $2
       LIMIT 1`,
      [pageId, userHash]
    );

    if (existingLike.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User has not liked this page',
        hasLiked: false
      });
    }

    // Remove user's like
    await pool.query(
      `DELETE FROM page_likes 
       WHERE page_id = $1 AND user_hash = $2`,
      [pageId, userHash]
    );

    // Decrement page like count
    const result = await pool.query(
      `
      UPDATE page_stats 
      SET like_count = GREATEST(0, like_count - 1)
      WHERE page_id = $1
      RETURNING page_id, like_count
      `,
      [pageId]
    );

    const response = NextResponse.json({ 
      success: true, 
      page: result.rows[0],
      hasLiked: false
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
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
