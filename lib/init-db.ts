import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Create page_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_stats (
        page_id VARCHAR(255) PRIMARY KEY,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create page_likes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_likes (
        id SERIAL PRIMARY KEY,
        page_id VARCHAR(255) REFERENCES page_stats(page_id) ON DELETE CASCADE,
        user_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_id, user_hash)
      )
    `);
    
    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_likes_page_id ON page_likes(page_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_likes_user_hash ON page_likes(user_hash)
    `);
    
    console.log('✅ Database tables created/verified');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    client.release();
  }
}

// Run initialization
initializeDatabase();

