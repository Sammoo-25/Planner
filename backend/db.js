const { Pool } = require('pg');
require('dotenv').config();

const isProduction = () => String(process.env.NODE_ENV).toLowerCase() === 'production';

// TLS settings for the pg pools. Only applies to DATABASE_URL; the DB_* path (compose) is plain TCP.
// Verified TLS is the default; weakening is explicit, dev-only opt-in.
const sslConfig = () => {
  const insecure = process.env.DB_SSL_INSECURE === 'true';
  const disabled = process.env.DB_SSL === 'false';
  if (isProduction() && (insecure || disabled)) {
    throw new Error('FATAL: DB_SSL_INSECURE / DB_SSL=false are not allowed when NODE_ENV=production.');
  }
  if (!process.env.DATABASE_URL) return false;
  if (disabled) return false;
  if (insecure) return { rejectUnauthorized: false };
  const ssl = { rejectUnauthorized: true };
  // PEM may be passed on one line with literal "\n" escapes
  if (process.env.DB_SSL_CA) ssl.ca = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  return ssl;
};

const DB_NAME_PATTERN = /^[a-z_][a-z0-9_]{0,62}$/;
const resolveDbName = () => {
  const name = process.env.DB_NAME || 'planer';
  if (!DB_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid DB_NAME "${name}": must match ${DB_NAME_PATTERN}`);
  }
  return name;
};

const SSL_URL_PARAMS = ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl'];

// pg-connection-string values override the Pool `ssl` option, so URL ssl params would silently win
const stripSslParams = (rawUrl) => {
  const url = new URL(rawUrl);
  const present = SSL_URL_PARAMS.filter((p) => url.searchParams.has(p));
  if (present.length === 0) return rawUrl;
  present.forEach((p) => url.searchParams.delete(p));
  console.warn('DATABASE_URL ssl* query parameters are ignored; use DB_SSL_CA / DB_SSL / DB_SSL_INSECURE instead.');
  return url.toString();
};

const dbUrl = (database) =>
  process.env.DATABASE_URL
    ? stripSslParams(process.env.DATABASE_URL)
    : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${database}`;

const DUPLICATE_DATABASE = '42P04';

// Without DATABASE_URL we connect to the maintenance DB first and create the target DB if missing
const ensureDatabase = async (dbName) => {
  const adminPool = new Pool({ connectionString: dbUrl('postgres'), ssl: sslConfig() });
  try {
    const res = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Creating database '${dbName}'...`);
      // Identifiers can't be parameterized; dbName is validated and quoted here
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }
  } catch (err) {
    // Another replica created it between our check and CREATE
    if (err.code !== DUPLICATE_DATABASE) throw err;
  } finally {
    await adminPool.end().catch(() => {});
  }
};

const initializeDB = async () => {
  try {
    const dbName = process.env.DATABASE_URL ? null : resolveDbName();
    if (dbName) await ensureDatabase(dbName);

    const planerPool = new Pool({ connectionString: dbUrl(dbName), ssl: sslConfig() });

    // --- Core tables (unchanged) ---

    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // --- AI Agent infrastructure tables ---

    // Persists completed focus sessions (previously only in localStorage)
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
        duration_minutes INTEGER NOT NULL,
        xp_earned INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agent-generated daily quest board
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS daily_quests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        xp_reward INTEGER NOT NULL DEFAULT 0,
        condition_type VARCHAR(50),
        condition_value JSONB,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Persisted achievement unlocks
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        achievement_key VARCHAR(100) NOT NULL,
        achievement_title VARCHAR(255) NOT NULL,
        achievement_description TEXT,
        xp_reward INTEGER DEFAULT 0,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_key)
      )
    `);

    // User preferences for agent personalization
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        timezone VARCHAR(50) DEFAULT 'UTC',
        focus_duration_minutes INTEGER DEFAULT 25,
        daily_quest_count INTEGER DEFAULT 5,
        difficulty VARCHAR(20) DEFAULT 'Normal',
        companion_name VARCHAR(100) DEFAULT 'Sage',
        notifications_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Gamification event log — input for Game Balancer and Analytics agents
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agent conversation history per user
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS agent_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id UUID NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        agent_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Habit definitions and tracking
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        frequency VARCHAR(20) DEFAULT 'daily',
        target_count INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_checked_in TIMESTAMP,
        xp_reward INTEGER DEFAULT 15,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Individual habit check-in records
    await planerPool.query(`
      CREATE TABLE IF NOT EXISTS habit_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // --- Performance indexes ---

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_status
        ON tasks(user_id, status)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_deadline
        ON tasks(deadline) WHERE deadline IS NOT NULL
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_focus_sessions_user
        ON focus_sessions(user_id, completed_at)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_user_type
        ON events(user_id, event_type, created_at)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_quests_user_expires
        ON daily_quests(user_id, expires_at)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_conversations_user
        ON agent_conversations(user_id, created_at)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_habits_user_active
        ON habits(user_id, is_active)
    `);

    await planerPool.query(`
      CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit
        ON habit_checkins(habit_id, checked_in_at)
    `);

    console.log("Database tables verified.");
    return planerPool;
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
};

module.exports = { initializeDB, sslConfig, resolveDbName, stripSslParams };
