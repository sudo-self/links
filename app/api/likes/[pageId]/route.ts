// app/api/likes/[pageId]/route.ts

import { pool } from "@/lib/init-db";

// GET: Return total likes for a page
export async function GET(
  req: Request,
  { params }: { params: { pageId: string } }
) {
  const { pageId } = params;

  if (!pageId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing pageId" }),
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS like_count FROM page_likes WHERE page_id = $1',
      [pageId]
    );

    const likeCount = parseInt(result.rows[0].like_count, 10);

    return new Response(
      JSON.stringify({ success: true, page_id: pageId, like_count }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/likes error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Database error" }),
      { status: 500 }
    );
  }
}

// POST: Increment like for a page for a unique user
export async function POST(
  req: Request,
  { params }: { params: { pageId: string } }
) {
  const { pageId } = params;

  if (!pageId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing pageId" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const userHash = body.user_hash;

    if (!userHash) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing user_hash" }),
        { status: 400 }
      );
    }

    // Insert page into page_stats if it doesn't exist
    await pool.query(
      'INSERT INTO page_stats (page_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [pageId]
    );

    // Try to insert a like (unique by user_hash and page_id)
    const likeResult = await pool.query(
      `INSERT INTO page_likes (page_id, user_hash)
       VALUES ($1, $2)
       ON CONFLICT (page_id, user_hash) DO NOTHING
       RETURNING *`,
      [pageId, userHash]
    );

    // Get updated like count
    const countResult = await pool.query(
      'SELECT COUNT(*) AS like_count FROM page_likes WHERE page_id = $1',
      [pageId]
    );

    const likeCount = parseInt(countResult.rows[0].like_count, 10);

    return new Response(
      JSON.stringify({
        success: true,
        page_id: pageId,
        liked: likeResult.rowCount > 0, // true if this POST added a like
        like_count: likeCount,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/likes error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Database error" }),
      { status: 500 }
    );
  }
}

// OPTIONS: Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
