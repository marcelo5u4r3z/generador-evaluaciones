const assert = require('node:assert/strict');
const {
  DEMO_COURSES,
  cloneDemoCourses,
  createCourse,
  addMaterial,
  registerSession,
  generateDocument,
} = require('../src/generator');

assert.equal(DEMO_COURSES.length, 3, 'incluye tres cursos de demostración');

const cloned = cloneDemoCourses();
cloned[0].name = 'Nombre modificado';
assert.notEqual(cloned[0].name, DEMO_COURSES[0].name, 'los datos demo se clonan sin compartir referencias');

const course = createCourse({
  name: '  Literatura 2.º  ',
  subject: ' Literatura ',
  level: 'Educación Media — 2.º',
  group: ' 2.º 1 ',
  country: 'Uruguay',
  startDate: '2026-03-02',
  endDate: '2026-11-27',
  classDays: ['Martes', 'Jueves'],
  classDuration: '45',
  methodology: 'Taller',
  preferences: ' Lectura en clase. ',
}, 'literatura-2');

assert.equal(course.id, 'literatura-2');
assert.equal(course.name, 'Literatura 2.º');
assert.equal(course.classDuration, 45);
assert.deepEqual(course.classDays, ['Martes', 'Jueves']);
assert.equal(course.progress, 0);

const withMaterial = addMaterial(course, { name: 'Programa.pdf', type: 'Programa', size: '120 KB' });
assert.equal(withMaterial.materials.length, 1);
assert.equal(withMaterial.materials[0].name, 'Programa.pdf');
assert.equal(course.materials.length, 0, 'la actualización de materiales no muta el curso original');

const demo = cloneDemoCourses()[0];
const completed = registerSession(demo, {
  status: 'realizada',
  topics: ['Período de entreguerras'],
  note: 'Buen avance.',
});
assert(completed.workedTopics.includes('Período de entreguerras'));
assert(!completed.pendingTopics.includes('Período de entreguerras'));
assert.equal(completed.progress, 44);

const missed = registerSession(demo, {
  status: 'no-realizada',
  topics: ['Período de entreguerras'],
  note: 'Feriado.',
});
assert.equal(missed.progress, demo.progress);
assert(!missed.workedTopics.includes('Período de entreguerras'));

for (const action of ['class', 'practice', 'assessment', 'replan']) {
  const document = generateDocument(action, demo);
  assert.equal(document.action, action);
  assert(document.title.length > 3);
  assert(document.body.length > 100);
  assert.equal(document.status, 'Borrador');
}

console.log('Todas las pruebas del prototipo pasaron.');
