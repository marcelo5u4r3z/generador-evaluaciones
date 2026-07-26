/**
 * Server-side provider contract.
 * Implementations receive a validated ChatRequest and return a ChatResponse.
 * Provider credentials must only be read from server environment variables.
 */
class AIProvider {
  async generate(_request) {
    throw new Error('AIProvider.generate must be implemented.');
  }
}

module.exports = { AIProvider };
