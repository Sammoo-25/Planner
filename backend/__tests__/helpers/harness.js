const crypto = require('crypto');
const request = require('supertest');

const TABLES = [
    'users', 'tasks', 'subtasks', 'player_stats', 'focus_sessions', 'daily_quests',
    'user_achievements', 'user_preferences', 'events', 'agent_conversations', 'habits', 'habit_checkins',
];

// Last line of defence before TRUNCATE: the connected DB must be a dedicated test DB.
const assertTestDatabase = async (pool) => {
    if (process.env.DATABASE_URL) {
        throw new Error('Refusing to run tests: DATABASE_URL must be empty.');
    }
    const { rows } = await pool.query('SELECT current_database() AS name');
    if (!/_test$/.test(rows[0].name)) {
        throw new Error(`Refusing to run tests: connected to "${rows[0].name}", expected a name ending in "_test".`);
    }
};

// Loads the real app against the compose test DB. Call once per test file.
const createHarness = () => {
    const server = require('../../server');
    let pool;
    return {
        app: server.app,
        async start() {
            pool = await server.init();
            await assertTestDatabase(pool);
        },
        async stop() {
            await server.close();
        },
        async reset() {
            await assertTestDatabase(pool);
            return pool.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
        },
        query: (sql, params) => pool.query(sql, params),
    };
};

// Synthetic user via the public signup route; returns the token and a ready-made auth header.
const signUp = async (app, label = 'user') => {
    const email = `test-${crypto.randomUUID()}@example.test`;
    const res = await request(app)
        .post('/api/signup')
        .send({ name: `Test ${label}`, email, password: 'Fake-Passw0rd-for-tests' });
    if (res.status !== 201) throw new Error(`signup failed: ${res.status}`);
    return { id: res.body.user.id, email, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
};

const silenceConsole = () => {
    for (const m of ['log', 'error', 'warn']) jest.spyOn(console, m).mockImplementation(() => {});
};

module.exports = { assertTestDatabase, createHarness, signUp, silenceConsole };
