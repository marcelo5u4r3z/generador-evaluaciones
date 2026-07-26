(function nerioServiceModule(globalScope) {
  class NerioService {
    constructor({ provider, storage }) {
      this.provider = provider;
      this.storage = storage;
    }

    getConversation(courseId) { return this.storage.getConversation(courseId); }
    getArtifact(courseId) { return this.storage.getArtifact(courseId); }

    async send({ message, course }) {
      const conversation = this.getConversation(course.id);
      const currentArtifact = this.getArtifact(course.id);
      const courseContext = globalScope.buildCourseContext(course, currentArtifact ? [currentArtifact] : []);
      const userMessage = { id: `message-${Date.now()}-user`, role: 'user', text: message, createdAt: new Date().toISOString() };
      const request = { message, courseContext, conversation, currentArtifact };
      const result = await this.provider.generate(request);
      const assistantMessage = { id: `message-${Date.now()}-nerio`, role: 'assistant', text: result.message, createdAt: new Date().toISOString() };
      const updatedConversation = [...conversation, userMessage, assistantMessage];
      this.storage.saveConversation(course.id, updatedConversation);
      if (result.artifact) this.storage.saveArtifact(course.id, result.artifact);
      return { ...result, conversation: updatedConversation, courseContext };
    }

    sendQuickAction({ action, course }) {
      const quickAction = globalScope.QUICK_ACTIONS[action];
      if (!quickAction) return Promise.reject(new Error('Unknown quick action.'));
      return this.send({ message: quickAction.prompt, course });
    }

    saveArtifact(courseId, artifact) {
      return this.storage.saveArtifact(courseId, { ...artifact, updatedAt: new Date().toISOString() });
    }
  }

  function createNerioService(config, storage) {
    const provider = config.mode === 'api'
      ? new globalScope.ApiAIProvider({ apiBaseUrl: config.apiBaseUrl, timeoutMs: config.requestTimeoutMs })
      : new globalScope.MockAIProvider();
    return new NerioService({ provider, storage });
  }

  const exported = { NerioService, createNerioService };
  Object.assign(globalScope, exported);
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
