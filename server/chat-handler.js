const ARTIFACT_TYPES = new Set(['lesson', 'assessment', 'worksheet', 'plan']);

function validateChatRequest(body) {
  if (!body || typeof body.message !== 'string' || !body.message.trim()) return 'message is required';
  if (!body.courseContext?.courseId) return 'courseContext.courseId is required';
  if (!Array.isArray(body.conversation)) return 'conversation must be an array';
  return null;
}

function validateChatResponse(result) {
  if (!result || typeof result.message !== 'string') throw new Error('Provider returned an invalid message.');
  if (result.artifact && !ARTIFACT_TYPES.has(result.artifact.type)) throw new Error('Provider returned an invalid artifact type.');
  return result;
}

function createChatHandler(provider) {
  if (!provider?.generate) throw new Error('An AI provider is required.');
  return async function chatHandler(body) {
    const validationError = validateChatRequest(body);
    if (validationError) return { status: 400, body: { error: 'invalid_request', message: validationError } };
    try {
      const result = validateChatResponse(await provider.generate(body));
      return { status: 200, body: { message: result.message, artifact: result.artifact || null } };
    } catch (error) {
      console.error('Nerio provider error:', error.message);
      return { status: 503, body: { error: 'provider_unavailable', message: 'No pude preparar esto ahora. Probá nuevamente.' } };
    }
  };
}

module.exports = { createChatHandler, validateChatRequest, validateChatResponse };
