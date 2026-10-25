const { assertTestDatabase, silenceConsole } = require('./helpers/harness');

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
    silenceConsole();
    // Throwing turns the fatal process.exit(1) into something assertable
    jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
    });
});

afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
});

const withEnv = (env) => {
    for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
};

const loadServer = (env) => {
    withEnv(env);
    let mod;
    jest.isolateModules(() => {
        mod = require('../server');
    });
    return mod;
};

const loadDb = (env) => {
    withEnv(env);
    let mod;
    jest.isolateModules(() => {
        mod = require('../db');
    });
    return mod;
};

describe('startup guards (server.js)', () => {
    test('valid config loads', () => {
        expect(() => loadServer({})).not.toThrow();
    });

    test.each([
        ['unset', undefined],
        ['empty', ''],
        ['31 chars', 'a'.repeat(31)],
        ['change-me placeholder', 'change-me-to-a-long-random-string-0123456789'],
    ])('refuses JWT_SECRET: %s', (_name, secret) => {
        expect(() => loadServer({ JWT_SECRET: secret })).toThrow('process.exit(1)');
    });

    test('production without CORS_ORIGIN refuses to start', () => {
        expect(() => loadServer({ NODE_ENV: 'production', CORS_ORIGIN: undefined })).toThrow('process.exit(1)');
        expect(() => loadServer({ NODE_ENV: 'production', CORS_ORIGIN: '  ' })).toThrow('process.exit(1)');
    });

    test.each([['production'], ['Production']])('test-only JWT_SECRET is refused when NODE_ENV=%s', (nodeEnv) => {
        const env = { NODE_ENV: nodeEnv, CORS_ORIGIN: 'https://app.example.test' };
        expect(() => loadServer({ ...env, JWT_SECRET: 'test-only-fake-jwt-secret-0123456789abcdef' })).toThrow('process.exit(1)');
        expect(() => loadServer({ ...env, JWT_SECRET: 'prod-like-fake-secret-0123456789abcdef' })).not.toThrow();
    });

    test('test-only JWT_SECRET is allowed outside production', () => {
        expect(() => loadServer({ NODE_ENV: 'test' })).not.toThrow();
    });

    test('production with CORS_ORIGIN starts', () => {
        expect(() =>
            loadServer({ NODE_ENV: 'production', CORS_ORIGIN: 'https://app.example.test', JWT_SECRET: 'prod-like-fake-secret-0123456789abcdef' }),
        ).not.toThrow();
    });

    test('development without CORS_ORIGIN falls back to localhost origins', async () => {
        const request = require('supertest');
        const { app } = loadServer({ NODE_ENV: 'development', CORS_ORIGIN: undefined });
        const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
        const bad = await request(app).get('/api/health').set('Origin', 'http://evil.example.test');
        expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    });
});

describe('sslConfig()', () => {
    const URL_ENV = { DATABASE_URL: 'postgresql://u:p@db.example.test:5432/x', DB_SSL: undefined, DB_SSL_INSECURE: undefined, DB_SSL_CA: undefined };

    test('no DATABASE_URL -> no TLS', () => {
        expect(loadDb({ ...URL_ENV, DATABASE_URL: undefined }).sslConfig()).toBe(false);
    });

    test('DATABASE_URL -> verified TLS by default', () => {
        expect(loadDb(URL_ENV).sslConfig()).toEqual({ rejectUnauthorized: true });
    });

    test('DB_SSL_CA is passed through', () => {
        expect(loadDb({ ...URL_ENV, DB_SSL_CA: 'FAKE-CA-PEM' }).sslConfig()).toEqual({ rejectUnauthorized: true, ca: 'FAKE-CA-PEM' });
    });

    test('DB_SSL_CA literal \\n escapes become newlines', () => {
        expect(loadDb({ ...URL_ENV, DB_SSL_CA: 'LINE1\\nLINE2' }).sslConfig().ca).toBe('LINE1\nLINE2');
    });

    test('DB_SSL=false disables TLS in dev', () => {
        expect(loadDb({ ...URL_ENV, DB_SSL: 'false' }).sslConfig()).toBe(false);
    });

    test('DB_SSL_INSECURE=true skips verification in dev', () => {
        expect(loadDb({ ...URL_ENV, DB_SSL_INSECURE: 'true' }).sslConfig()).toEqual({ rejectUnauthorized: false });
    });

    test.each([['production'], ['Production'], ['PRODUCTION']])('weakening flags are fatal when NODE_ENV=%s', (nodeEnv) => {
        const { sslConfig } = loadDb({ ...URL_ENV, NODE_ENV: nodeEnv });
        withEnv({ DB_SSL: 'false' });
        expect(sslConfig).toThrow(/not allowed/);
        withEnv({ DB_SSL: undefined, DB_SSL_INSECURE: 'true' });
        expect(sslConfig).toThrow(/not allowed/);
    });

    test('production without weakening flags is verified TLS', () => {
        expect(loadDb({ ...URL_ENV, NODE_ENV: 'production' }).sslConfig()).toEqual({ rejectUnauthorized: true });
    });
});

describe('stripSslParams()', () => {
    test('drops sslmode-style params and keeps the rest', () => {
        const { stripSslParams } = loadDb({});
        const out = stripSslParams('postgresql://u:p@db.example.test:5432/x?sslmode=disable&application_name=t&sslrootcert=/x&ssl=true');
        expect(out).toContain('application_name=t');
        expect(out).not.toMatch(/ssl/);
    });

    test('leaves URLs without ssl params untouched', () => {
        const { stripSslParams } = loadDb({});
        const url = 'postgresql://u:p@db.example.test:5432/x?application_name=t';
        expect(stripSslParams(url)).toBe(url);
    });
});

describe('DB_NAME validation', () => {
    test.each([['planer_test'], ['_x'], ['a'.repeat(63)]])('accepts %s', (name) => {
        expect(loadDb({ DB_NAME: name }).resolveDbName()).toBe(name);
    });

    test('defaults to planer', () => {
        expect(loadDb({ DB_NAME: undefined }).resolveDbName()).toBe('planer');
    });

    test.each([['Planer'], ['1planer'], ['pla-ner'], ['x"; DROP DATABASE y;--'], ['a'.repeat(64)], ['']])('rejects %p', (name) => {
        // empty string falls back to the default, so it is valid
        const { resolveDbName } = loadDb({ DB_NAME: name });
        if (name === '') expect(resolveDbName()).toBe('planer');
        else expect(resolveDbName).toThrow(/Invalid DB_NAME/);
    });

    test('invalid DB_NAME aborts initializeDB when DATABASE_URL is unset', async () => {
        const { initializeDB } = loadDb({ DB_NAME: 'Bad-Name', DATABASE_URL: undefined });
        await expect(initializeDB()).rejects.toThrow('process.exit(1)');
    });

    test('invalid DB_NAME is ignored when DATABASE_URL is set', async () => {
        const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = ORIGINAL_ENV;
        const url = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/planer_test`;
        const { initializeDB } = loadDb({ DB_NAME: 'Bad-Name', DATABASE_URL: url, DB_SSL: 'false' });
        const pool = await initializeDB();
        try {
            expect((await pool.query('SELECT 1 AS ok')).rows[0].ok).toBe(1);
        } finally {
            await pool.end();
        }
    });
});

describe('assertTestDatabase() guard', () => {
    const poolFor = (name) => ({ query: jest.fn().mockResolvedValue({ rows: [{ name }] }) });

    test('accepts a *_test database', async () => {
        await expect(assertTestDatabase(poolFor('planer_test'))).resolves.toBeUndefined();
    });

    test('rejects any other database name', async () => {
        await expect(assertTestDatabase(poolFor('planer'))).rejects.toThrow(/Refusing/);
    });

    test('rejects when DATABASE_URL is set', async () => {
        withEnv({ DATABASE_URL: 'postgresql://u:p@db.example.test:5432/planer_test' });
        await expect(assertTestDatabase(poolFor('planer_test'))).rejects.toThrow(/DATABASE_URL/);
    });
});
