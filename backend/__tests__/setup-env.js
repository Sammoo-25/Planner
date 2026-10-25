// Runs before every test file. Pins a hermetic environment so a developer's shell or .env can't leak in.
process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.JWT_SECRET = 'test-only-fake-jwt-secret-0123456789abcdef';
process.env.CORS_ORIGIN = 'http://allowed.example.test';
// Discard port: connections are refused immediately, so no real network traffic
process.env.AGENT_SERVICE_URL = 'http://127.0.0.1:9';
// High enough that the main suite's many signups never hit the auth limiter; rate-limit.test.js lowers it
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.AUTH_EMAIL_RATE_LIMIT_MAX = '1000';
process.env.TRUST_PROXY = '';
// Set to '' rather than delete: dotenv never overrides an existing key, so a deleted var would be
// refilled from backend/.env (a DATABASE_URL there would silently point the suite at a real DB).
for (const name of ['AGENT_SERVICE_SECRET', 'DATABASE_URL', 'DB_SSL', 'DB_SSL_INSECURE', 'DB_SSL_CA']) {
    process.env[name] = '';
}
process.env.DB_NAME = process.env.DB_NAME || 'planer_test';
process.env.DB_PORT = process.env.DB_PORT || '5432';

// The suite truncates every table; refuse to run against anything that isn't a dedicated test DB.
if (!/_test$/.test(process.env.DB_NAME)) {
    throw new Error(`Refusing to run tests: DB_NAME "${process.env.DB_NAME}" must end with "_test".`);
}
