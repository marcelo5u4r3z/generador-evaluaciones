const DEFAULT_ALLOWED_ORIGINS = [
  'https://marcelo5u4r3z.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function loadServerConfig(env = process.env) {
  return Object.freeze({
    port: numberFromEnv(env.PORT, 8787),
    openaiApiKey: env.OPENAI_API_KEY || '',
    openaiModel: env.OPENAI_MODEL || 'gpt-5-mini',
    openaiTimeoutMs: numberFromEnv(env.OPENAI_TIMEOUT_MS, 45000),
    maxOutputTokens: numberFromEnv(env.OPENAI_MAX_OUTPUT_TOKENS, 6000),
    allowedOrigins: (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
      .split(',').map((origin) => origin.trim()).filter(Boolean),
  });
}

module.exports = { loadServerConfig, DEFAULT_ALLOWED_ORIGINS };
