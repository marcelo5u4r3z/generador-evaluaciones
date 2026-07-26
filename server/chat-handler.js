const { RequestValidationError, sanitizeChatRequest } = require('./request-policy');

const ARTIFACT_TYPES = new Set(['lesson', 'assessment', 'worksheet', 'plan']);

function validateChatRequest(body) {
  try { sanitizeChatRequest(body); return null; }
  catch (error) { return error.message; }
}

function validateChatResponse(result) {
  if (!result || typeof result.message !== 'string' || !result.message.trim()) throw new Error('Provider returned an invalid message.');
  if (result.artifact) {
    if (!ARTIFACT_TYPES.has(result.artifact.type)) throw new Error('Provider returned an invalid artifact type.');
    if (!result.artifact.title || !result.artifact.content) throw new Error('Provider returned an incomplete artifact.');
    if (!['markdown-latex', 'plain-text'].includes(result.artifact.format)) throw new Error('Provider returned an invalid artifact format.');
  }
  return result;
}

function createChatHandler(provider, { logger = console, model = 'unknown' } = {}) {
  if (!provider?.generate) throw new Error('An AI provider is required.');
  return async function chatHandler(body) {
    const startedAt = Date.now();
    let request;
    try {
      request = sanitizeChatRequest(body);
    } catch (error) {
      if (!(error instanceof RequestValidationError)) throw error;
      return { status: 400, body: { error: 'invalid_request', message: error.message } };
    }
    try {
      const result = validateChatResponse(await provider.generate(request));
      logger.info(JSON.stringify({ timestamp: new Date().toISOString(), operation: 'chat', model, success: true, latencyMs: Date.now() - startedAt }));
      return { status: 200, body: { message: result.message, artifact: result.artifact || null } };
    } catch (error) {
      logger.error(JSON.stringify({ timestamp: new Date().toISOString(), operation: 'chat', model, success: false, latencyMs: Date.now() - startedAt, errorType: error.name }));
      return { status: 503, body: { error: 'provider_unavailable', message: 'No pude preparar esto ahora. Probá nuevamente.' } };
    }
  };
}

module.exports = { createChatHandler, validateChatRequest, validateChatResponse };
