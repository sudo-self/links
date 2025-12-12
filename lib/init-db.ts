// lib/init-db.ts

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initializeDatabase() {
  try {
    // Create page_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_stats (
        page_id VARCHAR(255) PRIMARY KEY,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create page_likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_likes (
        id SERIAL PRIMARY KEY,
        page_id VARCHAR(255) REFERENCES page_stats(page_id) ON DELETE CASCADE,
        user_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_id, user_hash)
      )
    `);

    // Create indexes for faster queries
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_likes_page_id ON page_likes(page_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_page_likes_user_hash ON page_likes(user_hash)`);

    // Create trigger function to auto-update updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to page_stats table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_page_stats'
        ) THEN
          CREATE TRIGGER trg_update_page_stats
          BEFORE UPDATE ON page_stats
          FOR EACH ROW
          EXECUTE PROCEDURE update_updated_at_column();
        END IF;
      END;
      $$;
    `);

    console.log('Database tables and triggers created/verified');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Run initialization if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Initialization complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Initialization failed:', err);
      process.exit(1);
    });
}

export { pool };

