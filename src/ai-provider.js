(function aiProviderModule(globalScope) {
  const ARTIFACT_TYPES = Object.freeze({
    class: 'lesson',
    practice: 'worksheet',
    assessment: 'assessment',
    replan: 'plan',
  });

  function detectIntent(message) {
    const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/evalu|prueba|parcial/.test(normalized)) return 'assessment';
    if (/practic|actividad|ejercicio/.test(normalized)) return 'practice';
    if (/replan|reorganiz|atrase|perdi|calendario/.test(normalized)) return 'replan';
    if (/clase|prepara|viernes|miercoles|lunes|martes|jueves/.test(normalized)) return 'class';
    return 'conversation';
  }

  function artifactTitle(intent, topic) {
    if (intent === 'class') return `Clase — ${topic}`;
    if (intent === 'practice') return `Práctico — ${topic}`;
    if (intent === 'assessment') return 'Evaluación — contenidos trabajados';
    return 'Replanificación del curso';
  }

  function artifactContent(intent, context) {
    const topic = context.planning.pendingTopics[0] || context.planning.workedTopics.at(-1) || 'próximo contenido';
    const worked = context.planning.workedTopics.join(', ') || 'sin contenidos registrados';
    if (intent === 'practice') return `PRÁCTICO\n\nCurso: ${context.course.name}\nTema: ${topic}\nDuración sugerida: ${context.teaching.classDurationMinutes} minutos\n\n1. Recuperá una idea central de ${worked}.\n\n2. Resolvé una situación vinculada con ${topic}.\n\n3. Explicá el procedimiento utilizado y justificá la respuesta.\n\n4. Escribí una conclusión breve.\n\nCriterios\n• Comprensión conceptual\n• Fundamentación\n• Claridad en la comunicación`;
    if (intent === 'assessment') return `EVALUACIÓN\n\nCurso: ${context.course.name}\nGrupo: ${context.course.group}\nContenidos trabajados: ${worked}\nDuración: ${context.teaching.classDurationMinutes} minutos\n\n1. Definí dos conceptos centrales trabajados.\n\n2. Aplicá uno de los conceptos a una situación nueva.\n\n3. Compará dos ideas del recorrido realizado.\n\n4. Elaborá una respuesta fundamentada que integre los contenidos.\n\nCriterios\n• Precisión conceptual\n• Desarrollo y justificación\n• Presentación clara`;
    if (intent === 'replan') return `REPLANIFICACIÓN PROPUESTA\n\nCurso: ${context.course.name}\nAvance actual: ${context.planning.progress}%\nPróxima clase: ${context.planning.nextClass}\n\nPrioridad inmediata\n• Retomar ${topic}.\n\nPróximas tres semanas\n• Semana 1: consolidar el contenido pendiente y recuperar ideas previas.\n• Semana 2: avanzar con el siguiente contenido de la planificación.\n• Semana 3: integrar, revisar y recoger evidencia de aprendizaje.\n\nEsta propuesta no modifica el calendario hasta que la confirmes.`;
    return `PLAN DE CLASE\n\nCurso: ${context.course.name}\nUnidad curricular: ${context.education.curriculumUnit}\nTema: ${topic}\nPróxima clase: ${context.planning.nextClass}\nDuración: ${context.teaching.classDurationMinutes} minutos\n\nPropósitos\n• Comprender las ideas centrales de ${topic}.\n• Relacionarlas con lo trabajado: ${worked}.\n\nInicio · 10 minutos\nRecuperar saberes previos con una pregunta breve y explicitar el propósito de la clase.\n\nDesarrollo · ${Math.max(20, context.teaching.classDurationMinutes - 20)} minutos\nPresentar el nuevo contenido, trabajar un ejemplo guiado y proponer una actividad de aplicación.\n\nCierre · 10 minutos\nConstruir una síntesis y registrar una pregunta pendiente del grupo.\n\nEnfoque metodológico\n${context.teaching.methodology}. ${context.teaching.preferences}`;
  }

  class MockAIProvider {
    async generate(request) {
      const { message, courseContext, conversation = [], currentArtifact = null } = request;
      const intent = detectIntent(message);
      const isRevision = Boolean(currentArtifact) && /mas |más |agrega|agregá|cambia|cambiá|teoric|demostr|breve|larga|ajusta|ajustá/.test(message.toLowerCase());
      if (isRevision) {
        const content = `${currentArtifact.content}\n\nAJUSTE SOLICITADO\n${message}\n\nSe incorporó este cambio manteniendo el objetivo y el contexto del curso.`;
        return {
          message: `Actualicé “${currentArtifact.title}” con el cambio que pediste.`,
          artifact: { ...currentArtifact, content, updatedAt: new Date().toISOString() },
        };
      }
      if (intent === 'conversation') {
        const previous = conversation.filter(({ role }) => role === 'user').at(-1);
        return {
          message: previous
            ? `Tengo presente lo que venimos conversando sobre ${courseContext.course.name}. Decime si querés preparar una clase, un práctico, una evaluación o revisar la planificación.`
            : `Tengo presente el contexto de ${courseContext.course.name}. ¿Qué querés preparar?`,
          artifact: null,
        };
      }
      const topic = courseContext.planning.pendingTopics[0] || courseContext.planning.workedTopics.at(-1) || 'próximo contenido';
      const now = new Date().toISOString();
      return {
        message: intent === 'replan'
          ? `Preparé una propuesta para reorganizar el curso a partir de ${topic}.`
          : `Preparé una propuesta de ${intent === 'class' ? 'clase' : intent === 'practice' ? 'práctico' : 'evaluación'} para ${topic}.`,
        artifact: {
          id: `artifact-${Date.now()}`,
          type: ARTIFACT_TYPES[intent],
          title: artifactTitle(intent, topic),
          course: courseContext.course.name,
          content: artifactContent(intent, courseContext),
          createdAt: now,
          updatedAt: now,
        },
      };
    }
  }

  class ApiAIProvider {
    constructor({ apiBaseUrl, timeoutMs = 30000, fetchImpl = globalScope.fetch } = {}) {
      this.apiBaseUrl = apiBaseUrl;
      this.timeoutMs = timeoutMs;
      this.fetchImpl = fetchImpl;
    }

    async generate(request) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(`${this.apiBaseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Nerio API request failed.');
        return response.json();
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  const exported = { MockAIProvider, ApiAIProvider, ARTIFACT_TYPES, detectIntent };
  Object.assign(globalScope, exported);
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
