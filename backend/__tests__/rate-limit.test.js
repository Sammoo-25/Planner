const request = require('supertest');

// Must be set before the harness loads server.js (the limiters read them at module load)
process.env.AUTH_RATE_LIMIT_MAX = '3';
process.env.AUTH_EMAIL_RATE_LIMIT_MAX = '2';
const { createHarness, silenceConsole } = require('./helpers/harness');

const h = createHarness();
const { app } = h;

beforeAll(async () => {
    silenceConsole();
    await h.start();
    await h.reset();
});
afterAll(async () => {
    await h.stop();
    jest.restoreAllMocks();
});

// Tests share one in-memory limiter and run in order: they consume the per-IP budget of 3 step by step.
const signin = (email) => request(app).post('/api/signin').send({ email, password: 'x' });

test('failed signins for one email are limited per account (case-insensitive)', async () => {
    expect((await signin('test-target@example.test')).status).toBe(400);
    expect((await signin('Test-Target@Example.test')).status).toBe(400);
    const limited = await signin('test-target@example.test');
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({ message: 'Too many attempts, please try again later.' });
    expect(limited.headers['ratelimit-policy']).toBeDefined();
});

test('once the per-IP budget is spent, signin for any email is limited', async () => {
    expect((await signin('test-other@example.test')).status).toBe(429);
});

test('signup shares the per-IP counter, so it is limited too', async () => {
    const res = await request(app).post('/api/signup').send({ name: 'Test Limited', email: 'test-limited@example.test', password: 'Fake-Passw0rd-for-tests' });
    expect(res.status).toBe(429);
});

test('non-auth routes are not limited', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
});
