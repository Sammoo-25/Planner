process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initializeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
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

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
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

        const token = jwt.sign({ userId: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
