(function storageModule(globalScope) {
  const STORAGE_KEYS = Object.freeze({
    courses: 'nerio-courses-v1',
    legacyCourses: 'aula-prototype-courses-v1',
    conversations: 'nerio-conversations-v1',
    artifacts: 'nerio-artifacts-v1',
  });

  function createMemoryDriver() {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    };
  }

  class NerioStorage {
    constructor(driver = globalScope.localStorage || createMemoryDriver()) {
      this.driver = driver;
    }

    read(key, fallback) {
      try {
        const value = this.driver.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch {
        return fallback;
      }
    }

    write(key, value) {
      this.driver.setItem(key, JSON.stringify(value));
      return value;
    }

    getCourses(fallback = []) {
      const current = this.read(STORAGE_KEYS.courses, null);
      if (current) return current;
      return this.read(STORAGE_KEYS.legacyCourses, fallback);
    }

    saveCourses(courses) { return this.write(STORAGE_KEYS.courses, courses); }

    getConversation(courseId) {
      return this.read(STORAGE_KEYS.conversations, {})[courseId] || [];
    }

    saveConversation(courseId, messages) {
      const conversations = this.read(STORAGE_KEYS.conversations, {});
      conversations[courseId] = messages;
      this.write(STORAGE_KEYS.conversations, conversations);
      return messages;
    }

    getArtifact(courseId) {
      return this.read(STORAGE_KEYS.artifacts, {})[courseId] || null;
    }

    saveArtifact(courseId, artifact) {
      const artifacts = this.read(STORAGE_KEYS.artifacts, {});
      artifacts[courseId] = artifact;
      this.write(STORAGE_KEYS.artifacts, artifacts);
      return artifact;
    }
  }

  const exported = { NerioStorage, STORAGE_KEYS, createMemoryDriver };
  Object.assign(globalScope, exported);
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
