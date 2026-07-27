const http = require('node:http');
const { loadServerConfig } = require('./config');
const { LIMITS } = require('./request-policy');
const { createChatHandler } = require('./chat-handler');
const { OpenAIProvider } = require('./providers/openai-provider');

function corsHeaders(origin, allowedOrigins) {
  if (!origin || !allowedOrigins.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > LIMITS.requestBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        request.destroy();
      }
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function createServer({ config = loadServerConfig(), provider, logger = console } = {}) {
  let openaiProvider;
  const activeProvider = provider || {
    async generate(request) {
      if (!config.openaiApiKey) throw new Error('OpenAI is not configured.');
      if (!openaiProvider) openaiProvider = new OpenAIProvider({
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
        timeoutMs: config.openaiTimeoutMs,
        maxOutputTokens: config.maxOutputTokens,
      });
      return openaiProvider.generate(request);
    },
  };
  const chatHandler = createChatHandler(activeProvider, { logger, model: config.openaiModel });

  return http.createServer(async (request, response) => {
    const origin = request.headers.origin;
    const cors = corsHeaders(origin, config.allowedOrigins);
    if (origin && !cors) return sendJson(response, 403, { error: 'origin_not_allowed' });
    if (request.method === 'OPTIONS') return sendJson(response, 204, {}, cors || {});
    if (request.method === 'GET' && request.url === '/api/health') {
      return sendJson(response, 200, { status: 'ok', providerConfigured: Boolean(config.openaiApiKey), model: config.openaiModel }, cors || {});
    }
    if (request.method === 'POST' && request.url === '/api/chat') {
      try {
        const body = await readJson(request);
        const result = await chatHandler(body);
        return sendJson(response, result.status, result.body, cors || {});
      } catch (error) {
        return sendJson(response, error.status || 400, { error: 'invalid_request', message: error.message }, cors || {});
      }
    }
    return sendJson(response, 404, { error: 'not_found' }, cors || {});
  });
}

function startServer({ config = loadServerConfig(), logger = console } = {}) {
  return new Promise((resolve, reject) => {
    let server;
    try {
      server = createServer({ config, logger });
    } catch (error) {
      logger.error(`NERIO API could not initialize: ${error.message}`);
      reject(error);
      return;
    }
    const onError = (error) => {
      logger.error(`NERIO API failed to listen on ${config.host}:${config.port}: ${error.message}`);
      reject(error);
    };
    server.once('error', onError);
    server.listen(config.port, config.host, () => {
      server.off('error', onError);
      logger.info(`NERIO API listening on http://${config.host}:${config.port}; model=${config.openaiModel}; providerConfigured=${Boolean(config.openaiApiKey)}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  const config = loadServerConfig();
  startServer({ config }).then((server) => {
    const shutdown = (signal) => {
      console.info(`NERIO API received ${signal}; closing server.`);
      server.close((error) => {
        if (error) {
          console.error(`NERIO API shutdown failed: ${error.message}`);
          process.exitCode = 1;
        }
      });
    };
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  }).catch((error) => {
    console.error(`NERIO API startup failed: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createServer, startServer, corsHeaders, readJson };
