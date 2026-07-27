(function configModule(globalScope) {
  const runtime = globalScope.NERIO_RUNTIME_CONFIG || {};
  const apiBaseUrl = runtime.API_BASE_URL || runtime.apiBaseUrl || '';
  const requestedMode = runtime.MODE || runtime.mode || 'mock';
  const NERIO_CONFIG = Object.freeze({
    mode: requestedMode === 'api' && apiBaseUrl ? 'api' : 'mock',
    apiBaseUrl,
    requestTimeoutMs: 120000,
    conversationWindowMessages: 12,
  });

  globalScope.NERIO_CONFIG = NERIO_CONFIG;
  if (typeof module !== 'undefined') module.exports = { NERIO_CONFIG };
})(typeof globalThis !== 'undefined' ? globalThis : window);
