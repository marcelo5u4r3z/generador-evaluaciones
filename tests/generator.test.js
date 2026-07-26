const assert = require('node:assert/strict');
const fs = require('node:fs');
const { EDUCATION_CATALOG, resolveEducationSelection, educationSummary } = require('../src/education-catalog');
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
  topics: ['Ecuaciones'],
  note: 'Buen avance.',
});
assert(completed.workedTopics.includes('Ecuaciones'));
assert(!completed.pendingTopics.includes('Ecuaciones'));
assert.equal(completed.progress, 44);

const missed = registerSession(demo, {
  status: 'no-realizada',
  topics: ['Ecuaciones'],
  note: 'Feriado.',
});
assert.equal(missed.progress, demo.progress);
assert(!missed.workedTopics.includes('Ecuaciones'));

for (const action of ['class', 'practice', 'assessment', 'replan']) {
  const document = generateDocument(action, demo);
  assert.equal(document.action, action);
  assert(document.title.length > 3);
  assert(document.body.length > 100);
  assert.equal(document.status, 'Borrador');
}

const uruguay = EDUCATION_CATALOG.countries.find(({ code }) => code === 'UY');
assert(uruguay, 'Uruguay existe en el catálogo');
const secondary = uruguay.systems.find(({ id }) => id === 'secundaria');
assert.equal(secondary.agency.name, 'DGES');
const ebi = secondary.programs.find(({ id }) => id === 'ebi');
assert.deepEqual(ebi.grades.map(({ name }) => name), ['7.º grado', '8.º grado', '9.º grado']);

const lifeSciences = resolveEducationSelection({
  countryId: 'uy', systemId: 'secundaria', programId: 'ems-2023', gradeId: 'ems-3',
  trackId: 'ciencias-vida', unitId: 'matematica-cv',
});
assert.equal(lifeSciences.track.name, 'Ciencias de la Vida');
assert.equal(lifeSciences.curriculumUnit.name, 'Matemática-CV');
assert.equal(lifeSciences.curriculumUnit.officialProgram.available, false);

const cfe = uruguay.systems.find(({ id }) => id === 'formacion-educacion');
assert.equal(cfe.agency.name, 'CFE');
const professor = cfe.careers.find(({ id }) => id === 'profesorado-media');
assert.equal(professor.specialties.length, 18);
const teacherMath = resolveEducationSelection({
  countryId: 'uy', systemId: 'formacion-educacion', careerId: 'profesorado-media',
  specialtyId: 'matematica', planId: 'plan-2023', yearId: 'ano-3', unitId: 'probabilidad-estadistica-ii',
});
assert.equal(teacherMath.plan.version, '2023');
assert.equal(teacherMath.year.name, '3.º año');
assert.equal(teacherMath.curriculumUnit.name, 'Probabilidad y Estadística II');
assert.equal(educationSummary({
  countryId: 'uy', systemId: 'formacion-educacion', careerId: 'profesorado-media',
  specialtyId: 'matematica', planId: 'plan-2023', yearId: 'ano-3', unitId: 'probabilidad-estadistica-ii',
}).detail, 'Matemática · 3.º año · Probabilidad y Estadística II');

const appSource = fs.readFileSync('src/app.js', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
assert(index.includes('<title>NERIO — Tu agente docente</title>'));
assert(index.includes('src/nerio-mark.svg'));
assert(appSource.includes('<span class="wordmark">NERIO</span>'));
assert(appSource.includes('>Nerio</span>'));
assert(appSource.includes('Otro / No aparece mi curso'));
assert(appSource.includes('Preparar próxima clase'));
assert(appSource.includes('Crear evaluación'));
assert(appSource.includes('Registrar lo que di'));
assert(appSource.includes("new URLSearchParams(query).get('action')"));
assert(fs.existsSync('src/nerio-wordmark.svg'));
assert(fs.existsSync('src/nerio-lockup.svg'));
assert(styles.includes('--font-display:'));
assert(styles.includes('--brand-900:'));
assert(styles.includes('@media (max-width: 720px)'));
assert(styles.includes('@media (prefers-reduced-motion: reduce)'));

console.log('Todas las pruebas del prototipo pasaron.');
