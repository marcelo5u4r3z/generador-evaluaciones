(function nerioServiceModule(globalScope) {
  class NerioService {
    constructor({ provider, storage, conversationWindowMessages = 12 }) {
      this.provider = provider;
      this.storage = storage;
      this.conversationWindowMessages = conversationWindowMessages;
    }

    getConversation(courseId) { return this.storage.getConversation(courseId); }
    getArtifact(courseId) { return this.storage.getArtifact(courseId); }

    async send({ message, course }) {
      try {
        const conversation = this.getConversation(course.id);
        const recentConversation = conversation.slice(-this.conversationWindowMessages);
        const currentArtifact = this.getArtifact(course.id);
        const courseContext = globalScope.buildCourseContext(course, currentArtifact ? [currentArtifact] : []);
        const userMessage = { id: `message-${Date.now()}-user`, role: 'user', text: message, createdAt: new Date().toISOString() };
        const request = { message, courseContext, conversation: recentConversation, currentArtifact };

        console.info('[NERIO] Sending request', {
          mode: globalScope.NERIO_CONFIG?.mode,
          apiBaseUrl: globalScope.NERIO_CONFIG?.apiBaseUrl,
          courseId: course.id,
          message,
        });

        const result = await this.provider.generate(request);
        const assistantMessage = { id: `message-${Date.now()}-nerio`, role: 'assistant', text: result.message, createdAt: new Date().toISOString() };
        const updatedConversation = [...conversation, userMessage, assistantMessage];
        this.storage.saveConversation(course.id, updatedConversation);
        if (result.artifact) this.storage.saveArtifact(course.id, result.artifact);
        console.info('[NERIO] Request completed successfully', { artifactType: result.artifact?.type || null });
        return { ...result, conversation: updatedConversation, courseContext };
      } catch (error) {
        console.error('[NERIO] Request failed', {
          name: error?.name,
          message: error?.message,
          status: error?.status,
          code: error?.code,
          stack: error?.stack,
          mode: globalScope.NERIO_CONFIG?.mode,
          apiBaseUrl: globalScope.NERIO_CONFIG?.apiBaseUrl,
        });
        throw error;
      }
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
    return new NerioService({ provider, storage, conversationWindowMessages: config.conversationWindowMessages });
  }

  const exported = { NerioService, createNerioService };
  Object.assign(globalScope, exported);
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);