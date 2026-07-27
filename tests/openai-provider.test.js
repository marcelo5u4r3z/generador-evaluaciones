const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../src/education-catalog');
const { cloneDemoCourses } = require('../src/generator');
const { buildCourseContext } = require('../src/course-context');
const { ApiAIProvider, normalizeApiBaseUrl } = require('../src/ai-provider');
const { OpenAIProvider, parseStructuredResponse } = require('../server/providers/openai-provider');
const { sanitizeChatRequest, LIMITS } = require('../server/request-policy');
const { createChatHandler, safeProviderError } = require('../server/chat-handler');
const { createServer, corsHeaders } = require('../server/http-server');
const { loadServerConfig } = require('../server/config');

function loadFrontendConfig(runtime) {
  global.NERIO_RUNTIME_CONFIG = runtime;
  const modulePath = require.resolve('../src/config');
  delete require.cache[modulePath];
  return require('../src/config').NERIO_CONFIG;
}

async function run() {
  const course = cloneDemoCourses().find(({ id }) => id === 'profesorado-matematica-3');
  const courseContext = buildCourseContext(course);
  const currentArtifact = {
    id: 'artifact-current', type: 'lesson', title: 'Clase inicial', course: course.name,
    content: 'Contenido inicial', format: 'markdown-latex', createdAt: '2026-07-26T10:00:00.000Z', updatedAt: '2026-07-26T10:00:00.000Z',
  };
  const calls = [];
  const client = {
    responses: {
      async create(request) {
        calls.push(request);
        return { output_text: JSON.stringify({
          message: 'Profundicé la propuesta matemática.',
          artifact: {
            type: 'lesson', title: 'Variables aleatorias continuas', format: 'markdown-latex',
            content: 'Definición: $X\\colon \\Omega \\to \\mathbb{R}$.\n\n$$E(X)=\\int_{-\\infty}^{\\infty}x f_X(x)\\,dx$$',
          },
        }) };
      },
    },
  };
  const provider = new OpenAIProvider({ client, model: 'test-model', maxOutputTokens: 2500 });
  const result = await provider.generate({
    message: 'Hacela más profunda y agregá una demostración.', courseContext,
    conversation: [{ role: 'user', text: 'Preparame la próxima clase.' }], currentArtifact,
  });
  assert.equal(calls[0].model, 'test-model');
  assert.equal(calls[0].max_output_tokens, 2500);
  assert.equal(calls[0].store, false);
  assert.equal(calls[0].text.format.type, 'json_schema');
  assert(calls[0].instructions.includes('NERIO, agente docente contextual'));
  assert(calls[0].instructions.includes('Probabilidad y Estadística II'));
  assert.equal(calls[0].input.at(-1).content, 'Hacela más profunda y agregá una demostración.');
  assert.equal(result.artifact.id, currentArtifact.id, 'artifact modifications preserve the active id');
  assert.equal(result.artifact.createdAt, currentArtifact.createdAt);
  assert(result.artifact.content.includes('\\int'));

  assert.throws(() => parseStructuredResponse('not json'));
  assert.throws(() => parseStructuredResponse(JSON.stringify({ message: 'x', artifact: { type: 'unknown', title: 'x', content: 'x', format: 'markdown-latex' } })));

  const longConversation = Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', text: `message ${index}` }));
  const sanitized = sanitizeChatRequest({ message: 'hola', courseContext, conversation: longConversation, currentArtifact });
  assert.equal(sanitized.conversation.length, LIMITS.conversationMessages);
  assert.equal(sanitized.conversation[0].text, 'message 8');
  assert.throws(() => sanitizeChatRequest({ message: 'x'.repeat(LIMITS.messageCharacters + 1), courseContext, conversation: [] }));

  const quietLogger = { info() {}, error() {} };
  const invalidHandler = createChatHandler({ generate: async () => ({ bad: true }) }, { logger: quietLogger, model: 'test' });
  const invalid = await invalidHandler({ message: 'hola', courseContext, conversation: [], currentArtifact: null });
  assert.equal(invalid.status, 503);
  assert.equal(invalid.body.message, 'No pude preparar esto ahora. Probá nuevamente.');

  const timeoutProvider = new ApiAIProvider({
    apiBaseUrl: 'https://api.example.test', timeoutMs: 5,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
  });
  await assert.rejects(() => timeoutProvider.generate({}), /aborted/);

  assert.equal(loadFrontendConfig({ MODE: 'api', API_BASE_URL: 'https://nerio.example' }).mode, 'api');
  assert.equal(loadFrontendConfig({ MODE: 'api', API_BASE_URL: '' }).mode, 'mock');
  assert.equal(loadFrontendConfig({ MODE: 'mock', API_BASE_URL: 'https://nerio.example' }).mode, 'mock');
  const serverConfig = loadServerConfig({ OPENAI_API_KEY: 'server-test-value', OPENAI_MODEL: 'configurable-model' });
  assert.equal(serverConfig.openaiModel, 'configurable-model');
  assert.equal(corsHeaders('https://marcelo5u4r3z.github.io', serverConfig.allowedOrigins)['Access-Control-Allow-Origin'], 'https://marcelo5u4r3z.github.io');
  assert.equal(corsHeaders('https://attacker.example', serverConfig.allowedOrigins), null);

  assert.equal(normalizeApiBaseUrl('https://nerio-api.onrender.com'), 'https://nerio-api.onrender.com/api');
  assert.equal(normalizeApiBaseUrl('https://nerio-api.onrender.com/api/'), 'https://nerio-api.onrender.com/api');
  assert.equal(normalizeApiBaseUrl('https://nerio-api.onrender.com/api/chat'), 'https://nerio-api.onrender.com/api');
  const safeError = safeProviderError(Object.assign(new Error('Bearer token and sk-secret-value failed'), {
    status: 429,
    code: 'rate_limit_exceeded',
  }));
  assert.equal(safeError.providerStatus, 429);
  assert.equal(safeError.providerCode, 'rate_limit_exceeded');
  assert(!safeError.providerMessage.includes('sk-secret-value'));
  assert(!safeError.providerMessage.includes('Bearer token'));

  const httpProvider = { generate: async (request) => request.message.includes('fracciones')
    ? {
      message: 'Preparé un práctico contextualizado sobre fracciones.',
      artifact: {
        id: 'artifact-fracciones', type: 'worksheet', title: 'Práctico — Fracciones', course: request.courseContext.course.name,
        content: 'Resolvé y justificá: $\\frac{2}{3} + \\frac{1}{4}$.', format: 'markdown-latex',
        createdAt: '2026-07-27T10:00:00.000Z', updatedAt: '2026-07-27T10:00:00.000Z',
      },
    }
    : { message: 'Respuesta contextual', artifact: null } };
  const httpServer = createServer({ config: serverConfig, provider: httpProvider, logger: quietLogger });
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { Origin: 'http://localhost:4173' } });
    assert.equal(health.status, 200);
    const chat = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:4173' },
      body: JSON.stringify({ message: 'hola', courseContext, conversation: [], currentArtifact: null }),
    });
    assert.equal(chat.status, 200);
    assert.equal((await chat.json()).message, 'Respuesta contextual');

    // A Render URL is normally copied without `/api`. The browser client must
    // still reach POST /api/chat through the real conversation pipeline.
    const browserProvider = new ApiAIProvider({ apiBaseUrl: `http://127.0.0.1:${port}` });
    const practical = await browserProvider.generate({
      message: 'Haceme un práctico de fracciones', courseContext, conversation: [], currentArtifact: null,
    });
    assert.equal(practical.artifact.type, 'worksheet');
    assert.equal(practical.artifact.title, 'Práctico — Fracciones');
    assert(practical.artifact.content.includes('\\frac'));

    const blocked = await fetch(`http://127.0.0.1:${port}/api/health`, { headers: { Origin: 'https://attacker.example' } });
    assert.equal(blocked.status, 403);
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  const frontendFiles = ['index.html', ...fs.readdirSync('src').map((file) => path.join('src', file))];
  for (const file of frontendFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert(!content.includes('OPENAI_API_KEY'), `${file} must not reference OPENAI_API_KEY`);
    assert(!/sk-[A-Za-z0-9_-]{16,}/.test(content), `${file} must not contain an API key`);
  }
  console.log('Todas las pruebas del proveedor OpenAI pasaron sin consumir la API.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
