const http = require('http');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createHarness, signUp, silenceConsole } = require('./helpers/harness');

const h = createHarness();
const { app } = h;
const FAKE_EVENTS_SECRET = 'test-only-fake-events-secret-0123456789ab';
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

beforeAll(async () => {
    silenceConsole();
    await h.start();
});
beforeEach(async () => {
    delete process.env.AGENT_SERVICE_SECRET;
    process.env.AGENT_SERVICE_URL = 'http://127.0.0.1:9';
    await h.reset();
});
afterAll(async () => {
    await h.stop();
    jest.restoreAllMocks();
});

const createTask = async (user, title = 'Fake task') => {
    const res = await request(app).post('/api/tasks').set(user.auth).send({ title, category: 'Work', priority: 'High', status: 'To Do' });
    expect(res.status).toBe(201);
    return res.body;
};

describe('auth', () => {
    test('signup creates a user and returns a token without the password', async () => {
        const res = await request(app)
            .post('/api/signup')
            .send({ name: 'Test Signup', email: 'test-signup@example.test', password: 'Fake-Passw0rd-for-tests' });
        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Test Signup', email: 'test-signup@example.test' });
        expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    test('duplicate signup is rejected', async () => {
        const u = await signUp(app);
        const res = await request(app).post('/api/signup').send({ name: 'Dup', email: u.email, password: 'Fake-Passw0rd-for-tests' });
        expect(res.status).toBe(400);
    });

    test('signin succeeds with correct password', async () => {
        const u = await signUp(app);
        const res = await request(app).post('/api/signin').send({ email: u.email, password: 'Fake-Passw0rd-for-tests' });
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user.email).toBe(u.email);
    });

    test('signin with wrong password or unknown email gives the same 400', async () => {
        const u = await signUp(app);
        const wrong = await request(app).post('/api/signin').send({ email: u.email, password: 'wrong-password' });
        const unknown = await request(app).post('/api/signin').send({ email: 'test-nobody@example.test', password: 'x' });
        expect(wrong.status).toBe(400);
        expect(unknown.status).toBe(400);
        expect(wrong.body).toEqual(unknown.body);
    });

    test('missing token -> 401', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(401);
    });

    test('tampered token -> 403', async () => {
        const u = await signUp(app);
        const [header, payload, sig] = u.token.split('.');
        const forged = Buffer.from(JSON.stringify({ userId: 999, iat: 1, exp: 4102444800 })).toString('base64url');
        // First char always changes (the last char carries unused bits, so flipping it can be a no-op)
        const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
        for (const bad of [`${header}.${forged}.${sig}`, `${header}.${payload}.${flipped}`]) {
            const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${bad}`);
            expect(res.status).toBe(403);
        }
    });

    test('token signed with a different secret -> 403', async () => {
        const u = await signUp(app);
        const bad = jwt.sign({ userId: u.id }, 'some-other-fake-secret-0123456789abcdef');
        const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${bad}`);
        expect(res.status).toBe(403);
    });

    test('token with the right secret but non-HS256 alg -> 403', async () => {
        const u = await signUp(app);
        const hs512 = jwt.sign({ userId: u.id }, process.env.JWT_SECRET, { algorithm: 'HS512' });
        const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${hs512}`);
        expect(res.status).toBe(403);
    });

    test('unsigned alg=none token -> 403', async () => {
        const u = await signUp(app);
        const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
        const none = `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ userId: u.id })}.`;
        const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${none}`);
        expect(res.status).toBe(403);
    });

    test('valid token for a deleted user -> 401', async () => {
        const u = await signUp(app);
        await h.query('DELETE FROM users WHERE id = $1', [u.id]);
        const res = await request(app).get('/api/tasks').set(u.auth);
        expect(res.status).toBe(401);
    });
});

describe('tasks CRUD', () => {
    test('create, list, update, delete', async () => {
        const u = await signUp(app);
        const task = await createTask(u, 'Write fake report');
        expect(task).toMatchObject({ title: 'Write fake report', user_id: u.id, status: 'To Do' });

        const list = await request(app).get('/api/tasks').set(u.auth);
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(1);
        expect(list.body[0].id).toBe(task.id);

        const upd = await request(app).put(`/api/tasks/${task.id}`).set(u.auth).send({ ...task, title: 'Renamed', status: 'Done' });
        expect(upd.status).toBe(200);
        expect(upd.body).toMatchObject({ title: 'Renamed', status: 'Done' });

        const del = await request(app).delete(`/api/tasks/${task.id}`).set(u.auth);
        expect(del.status).toBe(200);
        expect((await request(app).get('/api/tasks').set(u.auth)).body).toEqual([]);
    });

    test('unknown task id -> 404', async () => {
        const u = await signUp(app);
        const res = await request(app).delete(`/api/tasks/${UNKNOWN_UUID}`).set(u.auth);
        expect(res.status).toBe(404);
    });
});

describe('ownership: other users get 404', () => {
    let alice;
    let bob;
    let task;
    let subtask;
    let habit;

    beforeEach(async () => {
        alice = await signUp(app, 'alice');
        bob = await signUp(app, 'bob');
        task = await createTask(alice);
        subtask = (await request(app).post('/api/subtasks').set(alice.auth).send({ task_id: task.id, title: 'Fake step' })).body;
        habit = (await request(app).post('/api/habits').set(alice.auth).send({ title: 'Fake habit' })).body;
    });

    test('tasks: PUT and DELETE', async () => {
        const put = await request(app).put(`/api/tasks/${task.id}`).set(bob.auth).send({ title: 'hijack' });
        const del = await request(app).delete(`/api/tasks/${task.id}`).set(bob.auth);
        expect(put.status).toBe(404);
        expect(del.status).toBe(404);
        const mine = await request(app).get('/api/tasks').set(alice.auth);
        expect(mine.body[0].title).toBe('Fake task');
    });

    test('subtasks: GET, POST, PUT, DELETE', async () => {
        const get = await request(app).get(`/api/tasks/${task.id}/subtasks`).set(bob.auth);
        const post = await request(app).post('/api/subtasks').set(bob.auth).send({ task_id: task.id, title: 'intruder' });
        const put = await request(app).put(`/api/subtasks/${subtask.id}`).set(bob.auth).send({ title: 'hijack' });
        const del = await request(app).delete(`/api/subtasks/${subtask.id}`).set(bob.auth);
        expect([get.status, post.status, put.status, del.status]).toEqual([404, 404, 404, 404]);

        const mine = await request(app).get(`/api/tasks/${task.id}/subtasks`).set(alice.auth);
        expect(mine.body).toHaveLength(1);
        expect(mine.body[0].title).toBe('Fake step');
    });

    test('owner can use their own subtasks', async () => {
        const put = await request(app).put(`/api/subtasks/${subtask.id}`).set(alice.auth).send({ is_completed: true });
        expect(put.status).toBe(200);
        expect(put.body.is_completed).toBe(true);
        const del = await request(app).delete(`/api/subtasks/${subtask.id}`).set(alice.auth);
        expect(del.status).toBe(200);
    });

    test("focus-sessions: POST with someone else's task_id", async () => {
        const res = await request(app)
            .post('/api/focus-sessions')
            .set(bob.auth)
            .send({ task_id: task.id, duration_minutes: 25, xp_earned: 10 });
        expect(res.status).toBe(404);
        expect((await request(app).get('/api/focus-sessions').set(bob.auth)).body).toEqual([]);
    });

    test("habits: check-in and update on someone else's habit", async () => {
        const checkin = await request(app).put(`/api/habits/${habit.id}/checkin`).set(bob.auth).send({});
        const update = await request(app).put(`/api/habits/${habit.id}`).set(bob.auth).send({ title: 'hijack' });
        expect(checkin.status).toBe(404);
        expect(update.status).toBe(404);
        const { rowCount } = await h.query('SELECT 1 FROM habit_checkins WHERE habit_id = $1', [habit.id]);
        expect(rowCount).toBe(0);
    });

    test('habits: owner check-in starts a streak', async () => {
        const res = await request(app).put(`/api/habits/${habit.id}/checkin`).set(alice.auth).send({});
        expect(res.status).toBe(200);
        expect(res.body.streak).toBe(1);
    });
});

describe('subtask update validation', () => {
    test('empty PUT /subtasks/:id -> 400', async () => {
        const u = await signUp(app);
        const task = await createTask(u);
        const sub = (await request(app).post('/api/subtasks').set(u.auth).send({ task_id: task.id, title: 'Fake step' })).body;
        const res = await request(app).put(`/api/subtasks/${sub.id}`).set(u.auth).send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'No fields to update' });
    });
});

describe('error bodies do not leak internals', () => {
    test('malformed JSON -> 400 "Bad request" only', async () => {
        const res = await request(app).post('/api/signin').set('Content-Type', 'application/json').send('{"email": ');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Bad request' });
        expect(res.text).not.toMatch(/SyntaxError|at .*\.js|node_modules/);
    });

    test('database error (malformed uuid) -> 500 generic body, no SQL or stack', async () => {
        const u = await signUp(app);
        const res = await request(app).delete('/api/tasks/not-a-uuid').set(u.auth);
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: 'Server error' });
        expect(res.text).not.toMatch(/uuid|invalid input|DELETE|SELECT|\.js/i);
    });

    test('unknown route -> JSON 404', async () => {
        const res = await request(app).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ message: 'Route not found' });
    });
});

describe('CORS', () => {
    test('allowed origin gets the ACAO header', async () => {
        const res = await request(app).get('/api/health').set('Origin', 'http://allowed.example.test');
        expect(res.headers['access-control-allow-origin']).toBe('http://allowed.example.test');
    });

    test('disallowed origin gets no ACAO header', async () => {
        const res = await request(app).get('/api/health').set('Origin', 'http://evil.example.test');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('POST /api/events', () => {
    const send = (secret, body) => {
        const req = request(app).post('/api/events');
        if (secret !== undefined) req.set('x-internal-secret', secret);
        return req.send(body);
    };

    test.each([[undefined], [''], ['too-short-secret']])('503 when AGENT_SERVICE_SECRET is %p', async (configured) => {
        if (configured !== undefined) process.env.AGENT_SERVICE_SECRET = configured;
        const res = await send(configured || 'anything', { user_id: 1, event_type: 'x' });
        expect(res.status).toBe(503);
    });

    describe('with a valid secret configured', () => {
        let user;
        beforeEach(async () => {
            process.env.AGENT_SERVICE_SECRET = FAKE_EVENTS_SECRET;
            user = await signUp(app);
        });

        test('403 with a missing or wrong secret', async () => {
            const body = { user_id: user.id, event_type: 'agent.note' };
            expect((await send(undefined, body)).status).toBe(403);
            expect((await send('wrong-secret-wrong-secret-wrong-secret', body)).status).toBe(403);
        });

        test('201 and a stored row with the correct secret', async () => {
            const res = await send(FAKE_EVENTS_SECRET, { user_id: user.id, event_type: 'agent.note', payload: { a: 1 } });
            expect(res.status).toBe(201);
            const { rows } = await h.query('SELECT event_type, payload FROM events WHERE user_id = $1', [user.id]);
            expect(rows).toEqual([{ event_type: 'agent.note', payload: { a: 1 } }]);
        });

        test.each([['Bad Type'], ['1abc'], [''], ['a'.repeat(51)], [42]])('400 for event_type %p', async (event_type) => {
            const res = await send(FAKE_EVENTS_SECRET, { user_id: user.id, event_type });
            expect(res.status).toBe(400);
        });

        test.each([['abc'], [0], [-1], [1.5], [null], [999999]])('400 for user_id %p', async (user_id) => {
            const res = await send(FAKE_EVENTS_SECRET, { user_id, event_type: 'agent.note' });
            expect(res.status).toBe(400);
        });

        test('400 for non-object payload', async () => {
            const res = await send(FAKE_EVENTS_SECRET, { user_id: user.id, event_type: 'agent.note', payload: [1] });
            expect(res.status).toBe(400);
        });

        test('413 for payload over 16KB', async () => {
            const res = await send(FAKE_EVENTS_SECRET, {
                user_id: user.id,
                event_type: 'agent.note',
                payload: { blob: 'x'.repeat(17 * 1024) },
            });
            expect(res.status).toBe(413);
        });
    });
});

describe('agent proxy', () => {
    test('503 fallback when the agent service is unreachable', async () => {
        const u = await signUp(app);
        const res = await request(app).get('/api/agent/insights').set(u.auth);
        expect(res.status).toBe(503);
        expect(res.body).toMatchObject({ fallback: true });
    });

    test('503 fallback (upstream body not passed through) when the agent returns 5xx', async () => {
        const upstream = http.createServer((req, res) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end('{"detail":"Traceback (most recent call last): fake"}');
        });
        await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
        process.env.AGENT_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
        try {
            const u = await signUp(app);
            const res = await request(app).post('/api/agent/chat').set(u.auth).send({ message: 'hi' });
            expect(res.status).toBe(503);
            expect(res.body).toMatchObject({ fallback: true });
            expect(res.text).not.toMatch(/Traceback/);
        } finally {
            await new Promise((resolve) => upstream.close(resolve));
        }
    });

    test('requires auth', async () => {
        const res = await request(app).get('/api/agent/insights');
        expect(res.status).toBe(401);
    });
});
