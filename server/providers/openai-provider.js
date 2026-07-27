const crypto = require('node:crypto');
const { AIProvider } = require('./ai-provider');
const { buildNerioInstructions, buildProviderInput } = require('../nerio-prompt');

const ARTIFACT_TYPES = ['lesson', 'assessment', 'worksheet', 'plan'];
const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['message', 'artifact'],
  properties: {
    message: { type: 'string' },
    artifact: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'title', 'content', 'format'],
          properties: {
            type: { type: 'string', enum: ARTIFACT_TYPES },
            title: { type: 'string' },
            content: { type: 'string' },
            format: { type: 'string', enum: ['markdown-latex'] },
          },
        },
      ],
    },
  },
};

class ProviderResponseError extends Error {}

function parseStructuredResponse(outputText) {
  let result;
  try {
    result = JSON.parse(outputText);
  } catch {
    throw new ProviderResponseError('OpenAI returned invalid JSON.');
  }
  if (!result || typeof result.message !== 'string' || !result.message.trim()) throw new ProviderResponseError('OpenAI response message is invalid.');
  if (result.message.length > 4000) throw new ProviderResponseError('OpenAI response message is too long.');
  if (result.artifact !== null) {
    const artifact = result.artifact;
    if (!artifact || !ARTIFACT_TYPES.includes(artifact.type)) throw new ProviderResponseError('OpenAI artifact type is invalid.');
    if (typeof artifact.title !== 'string' || !artifact.title.trim() || artifact.title.length > 300) throw new ProviderResponseError('OpenAI artifact title is invalid.');
    if (typeof artifact.content !== 'string' || !artifact.content.trim() || artifact.content.length > 30000) throw new ProviderResponseError('OpenAI artifact content is invalid.');
    if (artifact.format !== 'markdown-latex') throw new ProviderResponseError('OpenAI artifact format is invalid.');
  }
  return result;
}

function loadOfficialSdk() {
  const sdk = require('openai');
  return sdk.default || sdk.OpenAI || sdk;
}

class OpenAIProvider extends AIProvider {
  constructor({ apiKey, model, timeoutMs, maxOutputTokens, client } = {}) {
    super();
    if (!apiKey && !client) throw new Error('OPENAI_API_KEY is required.');
    this.model = model;
    this.maxOutputTokens = maxOutputTokens;
    if (client) this.client = client;
    else {
      const OpenAI = loadOfficialSdk();
      this.client = new OpenAI({ apiKey, timeout: timeoutMs, maxRetries: 1 });
    }
  }

  async generate(request) {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: buildNerioInstructions(request),
      input: buildProviderInput(request),
      max_output_tokens: this.maxOutputTokens,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: 'nerio_response',
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });
    const result = parseStructuredResponse(response.output_text);
    if (!result.artifact) return result;
    const now = new Date().toISOString();
    return {
      message: result.message.trim(),
      artifact: {
        id: request.currentArtifact?.id || crypto.randomUUID(),
        type: result.artifact.type,
        title: result.artifact.title.trim(),
        course: request.courseContext.course?.name || '',
        content: result.artifact.content.trim(),
        format: 'markdown-latex',
        createdAt: request.currentArtifact?.createdAt || now,
        updatedAt: now,
      },
    };
  }
}

module.exports = { OpenAIProvider, ProviderResponseError, RESPONSE_SCHEMA, parseStructuredResponse };
