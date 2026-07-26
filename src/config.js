(function configModule(globalScope) {
  const NERIO_CONFIG = Object.freeze({
    mode: 'mock',
    apiBaseUrl: '/api',
    requestTimeoutMs: 30000,
    ...(globalScope.NERIO_RUNTIME_CONFIG || {}),
  });

  globalScope.NERIO_CONFIG = NERIO_CONFIG;
  if (typeof module !== 'undefined') module.exports = { NERIO_CONFIG };
})(typeof globalThis !== 'undefined' ? globalThis : window);
