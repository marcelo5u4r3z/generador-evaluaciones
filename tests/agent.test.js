const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../src/education-catalog');
const { DEMO_COURSES, QUICK_ACTIONS, cloneDemoCourses } = require('../src/generator');
const { buildCourseContext } = require('../src/course-context');
const { MockAIProvider } = require('../src/ai-provider');
const { NerioStorage, createMemoryDriver } = require('../src/storage');
const { NerioService } = require('../src/nerio-service');
const { createChatHandler } = require('../server/chat-handler');

async function run() {
  const course = cloneDemoCourses().find(({ id }) => id === 'profesorado-matematica-3');
  const context = buildCourseContext(course);
  assert.equal(context.course.name, 'Probabilidad y Estadística II');
  assert.equal(context.education.agency, 'CFE');
  assert.equal(context.education.plan, 'Plan 2023');
  assert.equal(context.education.specialty, 'Matemática');
  assert.equal(context.education.gradeOrYear, '3.º año');
  assert.deepEqual(context.planning.workedTopics, ['Variables aleatorias', 'Esperanza y varianza', 'Distribuciones discretas']);
  assert.equal(context.planning.pendingTopics[0], 'Distribuciones continuas');
  assert.equal(context.teaching.classDurationMinutes, 90);

  const provider = new MockAIProvider();
  const cases = [
    ['Preparame la próxima clase', 'lesson'],
    ['Creá un práctico', 'worksheet'],
    ['Creá una evaluación', 'assessment'],
    ['Necesito replanificar porque perdí una clase', 'plan'],
  ];
  for (const [message, expectedType] of cases) {
    const result = await provider.generate({ message, courseContext: context, conversation: [] });
    assert.equal(result.artifact.type, expectedType);
    assert.equal(result.artifact.course, course.name);
    assert(result.artifact.content.includes(course.name));
  }

  const storage = new NerioStorage(createMemoryDriver());
  const requests = [];
  const spyProvider = {
    async generate(request) {
      requests.push(request);
      return provider.generate(request);
    },
  };
  const service = new NerioService({ provider: spyProvider, storage });
  const manual = await service.send({ message: QUICK_ACTIONS.class.prompt, course });
  assert.equal(manual.artifact.type, 'lesson');
  const quick = await service.sendQuickAction({ action: 'practice', course });
  assert.equal(quick.artifact.type, 'worksheet');
  assert.equal(requests.length, 2, 'manual messages and quick actions share provider.generate');
  assert.equal(requests[1].conversation.length, 2, 'the previous exchange is sent as conversation history');

  const revision = await service.send({ message: 'Hacela más teórica y agregá una demostración.', course });
  assert.equal(revision.artifact.id, quick.artifact.id);
  assert(revision.artifact.content.includes('AJUSTE SOLICITADO'));
  assert.equal(storage.getConversation(course.id).length, 6);

  const edited = { ...revision.artifact, title: 'Versión editada localmente' };
  service.saveArtifact(course.id, edited);
  assert.equal(storage.getArtifact(course.id).title, 'Versión editada localmente');

  const handler = createChatHandler(provider);
  const apiResponse = await handler({ message: 'Preparame una clase', courseContext: context, conversation: [] });
  assert.equal(apiResponse.status, 200);
  assert.equal(apiResponse.body.artifact.type, 'lesson');
  const invalidResponse = await handler({ message: '', courseContext: context, conversation: [] });
  assert.equal(invalidResponse.status, 400);

  assert.equal(DEMO_COURSES.length, 3, 'the existing demo courses remain available');
  const appSource = fs.readFileSync('src/app.js', 'utf8');
  for (const route of ['courses', 'course', 'agent', 'library', 'planning', 'register']) {
    assert(appSource.includes(`#/${route}`), `the ${route} navigation route remains available`);
  }
  console.log('Todas las pruebas de arquitectura del agente pasaron.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
