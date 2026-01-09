const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres', // Start with default database
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initializeDB = async () => {
  try {
    // Check if 'planer' database exists
    const res = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'planer'");
    if (res.rowCount === 0) {
      console.log("Creating database 'planer'...");
      await pool.query("CREATE DATABASE planer");
    }

    // Connect to 'planer' database
    const planerPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    // Create users table
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(50),
        deadline TIMESTAMP,
        status VARCHAR(50) DEFAULT 'To Do',
        start_time VARCHAR(10),
        duration INTEGER,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create subtasks table
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create player_stats table
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        current_exp INTEGER DEFAULT 0,
        max_exp INTEGER DEFAULT 100,
        health INTEGER DEFAULT 100,
        avatar_url TEXT,
        total_xp INTEGER DEFAULT 0,
        focus_total_sessions INTEGER DEFAULT 0,
        focus_total_minutes INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database tables verified.");
    return planerPool;
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
};

module.exports = { initializeDB };
