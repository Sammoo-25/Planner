process.on('uncaughtException', (err) => {
    console.error('Uncaught exception, exiting', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initializeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5005;

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const resolveCorsOrigins = () => {
    const raw = process.env.CORS_ORIGIN;
    if (raw && raw.trim()) return raw.split(',').map((o) => o.trim()).filter(Boolean);
    return process.env.NODE_ENV === 'production' ? [] : DEFAULT_DEV_ORIGINS;
};

// Fail fast on unsafe config instead of running with weak secrets or open CORS
const checkStartupConfig = () => {
    const secret = process.env.JWT_SECRET || '';
    if (secret.length < 32 || secret.startsWith('change-me')) {
        console.error('FATAL: JWT_SECRET must be set, at least 32 characters, and not a "change-me" placeholder (generate with: openssl rand -hex 32).');
        process.exit(1);
    }
    if (process.env.NODE_ENV === 'production' && resolveCorsOrigins().length === 0) {
        console.error('FATAL: CORS_ORIGIN must be set (comma-separated origins) when NODE_ENV=production.');
        process.exit(1);
    }
};

checkStartupConfig();

app.use(cors({ origin: resolveCorsOrigins() }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, async (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        
        try {
            // Verify user actually still exists in DB
            const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user.userId]);
            if (userCheck.rowCount === 0) {
                return res.status(401).json({ message: "User account no longer exists." });
            }
            req.user = user;
            next();
        } catch (dbErr) {
            console.error(dbErr);
            return res.status(500).json({ message: "Server error during authentication" });
        }
    });
};

let db;

// Router for /api
const router = express.Router();

// Auth Routes
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rowCount > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        const token = jwt.sign({ userId: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
        res.status(201).json({ user: newUser.rows[0], token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rowCount === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });
        res.json({ user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Tasks Endpoints
router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.query(`
            SELECT t.*, 
            (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
            (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND is_completed = true) as completed_subtask_count
            FROM tasks t 
            WHERE t.user_id = $1 
            ORDER BY t.created_at DESC
        `, [req.user.userId]);
        res.json(tasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/tasks', authenticateToken, async (req, res) => {
    const { title, category, priority, deadline, status, start_time, duration } = req.body;
    try {
        const newTask = await db.query(
            'INSERT INTO tasks (user_id, title, category, priority, deadline, status, start_time, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.user.userId, title, category, priority, deadline, status, start_time, duration]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
    const { title, category, priority, deadline, status, completed_at, start_time, duration } = req.body;
    try {
        const updatedTask = await db.query(
            'UPDATE tasks SET title = $1, category = $2, priority = $3, deadline = $4, status = $5, completed_at = $6, start_time = $7, duration = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
            [title, category, priority, deadline, status, completed_at, start_time, duration, req.params.id, req.user.userId]
        );
        if (updatedTask.rowCount === 0) return res.status(404).json({ message: "Task not found" });
        res.json(updatedTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- SUBTASKS ROUTES ---

// Get subtasks for a task
router.get('/tasks/:id/subtasks', authenticateToken, async (req, res) => {
    try {
        const subtasks = await db.query(
            'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
            [req.params.id]
        );
        res.json(subtasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Create a new subtask
router.post('/subtasks', authenticateToken, async (req, res) => {
    const { task_id, title } = req.body;
    try {
        const newSubtask = await db.query(
            'INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *',
            [task_id, title]
        );
        res.json(newSubtask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Update subtask (toggle completion or edit title)
router.put('/subtasks/:id', authenticateToken, async (req, res) => {
    const { title, is_completed } = req.body;
    try {
        // Build dynamic query based on what's provided
        let query = 'UPDATE subtasks SET ';
        const values = [];
        let index = 1;

        if (title !== undefined) {
            query += `title = $${index}, `;
            values.push(title);
            index++;
        }
        if (is_completed !== undefined) {
            query += `is_completed = $${index}, `;
            values.push(is_completed);
            index++;
        }

        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ` WHERE id = $${index} RETURNING *`;
        values.push(req.params.id);

        const updatedSubtask = await db.query(query, values);

        if (updatedSubtask.rowCount === 0) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        res.json(updatedSubtask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Delete a subtask
router.delete('/subtasks/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM subtasks WHERE id = $1', [req.params.id]);
        res.json({ message: "Subtask deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Stats Endpoints
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await db.query('SELECT * FROM player_stats WHERE user_id = $1', [req.user.userId]);
        if (stats.rowCount === 0) {
            return res.json({ level: 1, current_exp: 0, max_exp: 100, health: 100 });
        }
        res.json(stats.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/stats', authenticateToken, async (req, res) => {
    const { level, current_exp, max_exp, health, avatar_url, total_xp, focus_total_sessions, focus_total_minutes } = req.body;
    try {
        const updatedStats = await db.query(
            `INSERT INTO player_stats (user_id, level, current_exp, max_exp, health, avatar_url, total_xp, focus_total_sessions, focus_total_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
       level = EXCLUDED.level, current_exp = EXCLUDED.current_exp, max_exp = EXCLUDED.max_exp, health = EXCLUDED.health,
       avatar_url = EXCLUDED.avatar_url, total_xp = EXCLUDED.total_xp, focus_total_sessions = EXCLUDED.focus_total_sessions,
       focus_total_minutes = EXCLUDED.focus_total_minutes, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [req.user.userId, level, current_exp, max_exp, health, avatar_url, total_xp, focus_total_sessions, focus_total_minutes]
        );
        res.json(updatedStats.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// --- Focus Sessions ---

router.post('/focus-sessions', authenticateToken, async (req, res) => {
    const { task_id, duration_minutes, xp_earned } = req.body;
    if (!duration_minutes || !xp_earned) {
        return res.status(400).json({ message: "duration_minutes and xp_earned are required" });
    }
    try {
        const session = await db.query(
            `INSERT INTO focus_sessions (user_id, task_id, duration_minutes, xp_earned)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.userId, task_id || null, duration_minutes, xp_earned]
        );
        // Log event for agent analytics
        await db.query(
            `INSERT INTO events (user_id, event_type, payload) VALUES ($1, 'focus_complete', $2)`,
            [req.user.userId, JSON.stringify({ duration_minutes, xp_earned, task_id: task_id || null })]
        ).catch(err => console.error("Event log failed:", err));

        res.status(201).json(session.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/focus-sessions', authenticateToken, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    try {
        const sessions = await db.query(
            `SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2`,
            [req.user.userId, limit]
        );
        res.json(sessions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Daily Quests ---

router.get('/daily-quests', authenticateToken, async (req, res) => {
    try {
        const quests = await db.query(
            `SELECT * FROM daily_quests
             WHERE user_id = $1 AND expires_at > NOW()
             ORDER BY created_at ASC`,
            [req.user.userId]
        );
        res.json(quests.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/daily-quests/:id/complete', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE daily_quests SET is_completed = TRUE, completed_at = NOW()
             WHERE id = $1 AND user_id = $2 AND is_completed = FALSE RETURNING *`,
            [req.params.id, req.user.userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Quest not found or already completed" });

        await db.query(
            `INSERT INTO events (user_id, event_type, payload) VALUES ($1, 'daily_quest_complete', $2)`,
            [req.user.userId, JSON.stringify({ quest_id: req.params.id, xp_reward: result.rows[0].xp_reward })]
        ).catch(err => console.error("Event log failed:", err));

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Achievements ---

router.get('/achievements', authenticateToken, async (req, res) => {
    try {
        const achievements = await db.query(
            `SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`,
            [req.user.userId]
        );
        res.json(achievements.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/achievements', authenticateToken, async (req, res) => {
    const { achievement_key, achievement_title, achievement_description, xp_reward } = req.body;
    if (!achievement_key || !achievement_title) {
        return res.status(400).json({ message: "achievement_key and achievement_title are required" });
    }
    try {
        const result = await db.query(
            `INSERT INTO user_achievements (user_id, achievement_key, achievement_title, achievement_description, xp_reward)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, achievement_key) DO NOTHING RETURNING *`,
            [req.user.userId, achievement_key, achievement_title, achievement_description || null, xp_reward || 0]
        );
        if (result.rowCount === 0) {
            return res.status(409).json({ message: "Achievement already unlocked" });
        }

        await db.query(
            `INSERT INTO events (user_id, event_type, payload) VALUES ($1, 'achievement_unlock', $2)`,
            [req.user.userId, JSON.stringify({ achievement_key, xp_reward: xp_reward || 0 })]
        ).catch(err => console.error("Event log failed:", err));

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- User Preferences ---

router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const prefs = await db.query(
            `SELECT * FROM user_preferences WHERE user_id = $1`,
            [req.user.userId]
        );
        if (prefs.rowCount === 0) {
            return res.json({
                user_id: req.user.userId,
                timezone: 'UTC',
                focus_duration_minutes: 25,
                daily_quest_count: 5,
                difficulty: 'Normal',
                companion_name: 'Sage',
                notifications_enabled: true
            });
        }
        res.json(prefs.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/preferences', authenticateToken, async (req, res) => {
    const { timezone, focus_duration_minutes, daily_quest_count, difficulty, companion_name, notifications_enabled } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO user_preferences (user_id, timezone, focus_duration_minutes, daily_quest_count, difficulty, companion_name, notifications_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
               timezone = COALESCE(EXCLUDED.timezone, user_preferences.timezone),
               focus_duration_minutes = COALESCE(EXCLUDED.focus_duration_minutes, user_preferences.focus_duration_minutes),
               daily_quest_count = COALESCE(EXCLUDED.daily_quest_count, user_preferences.daily_quest_count),
               difficulty = COALESCE(EXCLUDED.difficulty, user_preferences.difficulty),
               companion_name = COALESCE(EXCLUDED.companion_name, user_preferences.companion_name),
               notifications_enabled = COALESCE(EXCLUDED.notifications_enabled, user_preferences.notifications_enabled),
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.userId, timezone || 'UTC', focus_duration_minutes || 25, daily_quest_count || 5, difficulty || 'Normal', companion_name || 'Sage', notifications_enabled !== undefined ? notifications_enabled : true]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Habits ---

router.get('/habits', authenticateToken, async (req, res) => {
    try {
        const habits = await db.query(
            `SELECT h.*,
               (SELECT COUNT(*) FROM habit_checkins WHERE habit_id = h.id) as total_checkins
             FROM habits h
             WHERE h.user_id = $1 AND h.is_active = TRUE
             ORDER BY h.created_at ASC`,
            [req.user.userId]
        );
        res.json(habits.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/habits', authenticateToken, async (req, res) => {
    const { title, description, category, frequency, target_count, xp_reward } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    try {
        const habit = await db.query(
            `INSERT INTO habits (user_id, title, description, category, frequency, target_count, xp_reward)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.user.userId, title, description || null, category || null, frequency || 'daily', target_count || 1, xp_reward || 15]
        );
        res.status(201).json(habit.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/habits/:id/checkin', authenticateToken, async (req, res) => {
    const { notes } = req.body;
    try {
        // Verify ownership
        const habitCheck = await db.query(
            `SELECT * FROM habits WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.userId]
        );
        if (habitCheck.rowCount === 0) return res.status(404).json({ message: "Habit not found" });

        const habit = habitCheck.rows[0];

        // Record the check-in
        await db.query(
            `INSERT INTO habit_checkins (habit_id, user_id, notes) VALUES ($1, $2, $3)`,
            [req.params.id, req.user.userId, notes || null]
        );

        // Compute new streak: check if last check-in was yesterday or today
        const now = new Date();
        const lastCheckin = habit.last_checked_in ? new Date(habit.last_checked_in) : null;
        let newStreak = habit.current_streak;

        if (!lastCheckin) {
            newStreak = 1;
        } else {
            const msPerDay = 86400000;
            const daysDiff = Math.floor((now - lastCheckin) / msPerDay);
            if (daysDiff <= 1) {
                newStreak = habit.current_streak + 1;
            } else {
                newStreak = 1; // streak broken
            }
        }

        const longestStreak = Math.max(newStreak, habit.longest_streak);

        const updated = await db.query(
            `UPDATE habits SET current_streak = $1, longest_streak = $2, last_checked_in = NOW()
             WHERE id = $3 RETURNING *`,
            [newStreak, longestStreak, req.params.id]
        );

        await db.query(
            `INSERT INTO events (user_id, event_type, payload) VALUES ($1, 'habit_checkin', $2)`,
            [req.user.userId, JSON.stringify({ habit_id: req.params.id, streak: newStreak })]
        ).catch(err => console.error("Event log failed:", err));

        res.json({ habit: updated.rows[0], streak: newStreak });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/habits/:id', authenticateToken, async (req, res) => {
    const { title, description, category, frequency, target_count, xp_reward, is_active } = req.body;
    try {
        const result = await db.query(
            `UPDATE habits SET
               title = COALESCE($1, title),
               description = COALESCE($2, description),
               category = COALESCE($3, category),
               frequency = COALESCE($4, frequency),
               target_count = COALESCE($5, target_count),
               xp_reward = COALESCE($6, xp_reward),
               is_active = COALESCE($7, is_active)
             WHERE id = $8 AND user_id = $9 RETURNING *`,
            [title, description, category, frequency, target_count, xp_reward, is_active, req.params.id, req.user.userId]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Habit not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Events (internal — used by agent service) ---

const MIN_SECRET_LENGTH = 32;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_.]{0,49}$/; // events.event_type is VARCHAR(50)
const MAX_PAYLOAD_BYTES = 16 * 1024;

// Hash both sides so timingSafeEqual gets equal-length buffers and length doesn't leak
const secretsMatch = (provided, expected) => {
    const digest = (v) => crypto.createHash('sha256').update(String(v)).digest();
    return crypto.timingSafeEqual(digest(provided), digest(expected));
};

router.post('/events', async (req, res) => {
    const expected = process.env.AGENT_SERVICE_SECRET;
    if (!expected || expected.length < MIN_SECRET_LENGTH) {
        return res.status(503).json({ message: "Events endpoint disabled" });
    }
    const provided = req.headers['x-internal-secret'];
    if (!provided || !secretsMatch(provided, expected)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const { user_id, event_type, payload } = req.body || {};
    if (!Number.isInteger(user_id) || user_id <= 0) {
        return res.status(400).json({ message: "user_id must be a positive integer" });
    }
    if (typeof event_type !== 'string' || !EVENT_TYPE_PATTERN.test(event_type)) {
        return res.status(400).json({ message: "invalid event_type" });
    }
    if (payload !== undefined && payload !== null && (typeof payload !== 'object' || Array.isArray(payload))) {
        return res.status(400).json({ message: "payload must be an object" });
    }
    const payloadJson = payload ? JSON.stringify(payload) : null;
    if (payloadJson && Buffer.byteLength(payloadJson) > MAX_PAYLOAD_BYTES) {
        return res.status(413).json({ message: "payload too large" });
    }
    try {
        const user = await db.query('SELECT 1 FROM users WHERE id = $1', [user_id]);
        if (user.rowCount === 0) {
            return res.status(400).json({ message: "unknown user_id" });
        }
        await db.query(
            `INSERT INTO events (user_id, event_type, payload) VALUES ($1, $2, $3::jsonb)`,
            [user_id, event_type, payloadJson]
        );
        res.status(201).json({ status: "logged" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Agent Proxy Routes ---
// These forward requests to the agent service so the frontend only needs one base URL.

const getAgentServiceUrl = () => process.env.AGENT_SERVICE_URL || 'http://localhost:8000';

async function proxyToAgent(req, res, agentPath) {
    try {
        const url = `${getAgentServiceUrl()}${agentPath}`;
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': String(req.user.userId),
                ...((process.env.AGENT_SERVICE_SECRET || '').length >= MIN_SECRET_LENGTH && { 'x-internal-secret': process.env.AGENT_SERVICE_SECRET })
            }
        };
        if (req.method !== 'GET') {
            options.body = JSON.stringify(req.body);
        }

        // Dynamic import of node-fetch or use built-in fetch (Node 18+)
        const response = await fetch(url, options);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error("Agent proxy error:", err.message);
        res.status(503).json({ message: "Agent service unavailable", fallback: true });
    }
}

router.post('/agent/chat', authenticateToken, (req, res) => proxyToAgent(req, res, '/agent/chat'));
router.get('/agent/insights', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/insights/${req.user.userId}`));
router.get('/agent/daily-quests', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/daily-quests/${req.user.userId}`));
router.post('/agent/schedule', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/schedule/${req.user.userId}`));
router.get('/agent/companion', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/companion/${req.user.userId}`));
router.get('/agent/habits', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/habits/${req.user.userId}`));
router.get('/agent/focus', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/focus/${req.user.userId}`));
router.get('/agent/achievements', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/achievements/${req.user.userId}`));
router.get('/agent/quest-board', authenticateToken, (req, res) => proxyToAgent(req, res, `/agent/quest-board/${req.user.userId}`));

// Also emit task completion events for agent analytics
// Wrap the existing PUT /tasks/:id to emit events on status → Done
const originalTaskUpdate = router.stack.find(r => r.route && r.route.path === '/tasks/:id' && r.route.methods.put);

// Use router.put('/tasks/:id') override is not feasible without refactor;
// POST /events is service-to-service only (agent service), not for browser clients.

// Use router for /api
app.use('/api', router);

// 404 Handler for /api and beyond
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Initialize Database and then start Server
initializeDB().then(pool => {
    db = pool;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database", err);
});
