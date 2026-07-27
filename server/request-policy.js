const LIMITS = Object.freeze({
  requestBytes: 128 * 1024,
  messageCharacters: 4000,
  conversationMessages: 12,
  conversationMessageCharacters: 4000,
  courseContextBytes: 48 * 1024,
  artifactCharacters: 30000,
});

function boundedText(value, max, field, { required = false } = {}) {
  if (typeof value !== 'string') {
    if (required) throw new RequestValidationError(`${field} is required`);
    return '';
  }
  const text = value.trim();
  if (required && !text) throw new RequestValidationError(`${field} is required`);
  if (text.length > max) throw new RequestValidationError(`${field} is too long`);
  return text;
}

class RequestValidationError extends Error {}

function sanitizeConversation(conversation) {
  if (!Array.isArray(conversation)) throw new RequestValidationError('conversation must be an array');
  return conversation.slice(-LIMITS.conversationMessages).map((item, index) => {
    if (!item || !['user', 'assistant'].includes(item.role)) throw new RequestValidationError(`conversation[${index}].role is invalid`);
    return {
      role: item.role,
      text: boundedText(item.text, LIMITS.conversationMessageCharacters, `conversation[${index}].text`, { required: true }),
    };
  });
}

function sanitizeCourseContext(context) {
  if (!context?.courseId || typeof context.courseId !== 'string') throw new RequestValidationError('courseContext.courseId is required');
  const serialized = JSON.stringify(context);
  if (Buffer.byteLength(serialized, 'utf8') > LIMITS.courseContextBytes) throw new RequestValidationError('courseContext is too large');
  const cleanList = (items, max = 100) => Array.isArray(items) ? items.slice(0, max) : [];
  const pick = (value, keys) => Object.fromEntries(keys.map((key) => [key, value?.[key] ?? null]));
  return {
    courseId: boundedText(context.courseId, 200, 'courseContext.courseId', { required: true }),
    course: pick(context.course, ['name', 'subject', 'level', 'group', 'country']),
    education: pick(context.education, ['system', 'agency', 'program', 'plan', 'planVersion', 'career', 'specialty', 'gradeOrYear', 'track', 'curriculumUnit', 'officialProgram']),
    planning: {
      progress: Number.isFinite(Number(context.planning?.progress)) ? Number(context.planning.progress) : null,
      nextClass: context.planning?.nextClass || null,
      workedTopics: cleanList(context.planning?.workedTopics),
      pendingTopics: cleanList(context.planning?.pendingTopics),
    },
    teaching: pick(context.teaching, ['methodology', 'preferences', 'classDays', 'classDurationMinutes']),
    materials: cleanList(context.materials, 100).map(({ id, name, type, date }) => ({ id, name, type, date })),
    sessions: cleanList(context.sessions, 100).map(({ id, date, status, topics, note }) => ({ id, date, status, topics: cleanList(topics, 50), note })),
    previousArtifacts: cleanList(context.previousArtifacts, 20).map(({ id, type, title, createdAt }) => ({ id, type, title, createdAt })),
  };
}

function sanitizeArtifact(artifact) {
  if (artifact == null) return null;
  if (typeof artifact !== 'object') throw new RequestValidationError('currentArtifact is invalid');
  return {
    id: boundedText(artifact.id || '', 200, 'currentArtifact.id'),
    type: boundedText(artifact.type || '', 30, 'currentArtifact.type'),
    title: boundedText(artifact.title || '', 300, 'currentArtifact.title'),
    course: boundedText(artifact.course || '', 300, 'currentArtifact.course'),
    content: boundedText(artifact.content || '', LIMITS.artifactCharacters, 'currentArtifact.content'),
    format: artifact.format === 'markdown-latex' ? 'markdown-latex' : 'plain-text',
    createdAt: boundedText(artifact.createdAt || '', 100, 'currentArtifact.createdAt'),
    updatedAt: boundedText(artifact.updatedAt || '', 100, 'currentArtifact.updatedAt'),
  };
}

function sanitizeChatRequest(body) {
  if (!body || typeof body !== 'object') throw new RequestValidationError('request body is required');
  return {
    message: boundedText(body.message, LIMITS.messageCharacters, 'message', { required: true }),
    courseContext: sanitizeCourseContext(body.courseContext),
    conversation: sanitizeConversation(body.conversation),
    currentArtifact: sanitizeArtifact(body.currentArtifact),
  };
}

module.exports = { LIMITS, RequestValidationError, sanitizeChatRequest, sanitizeConversation };
