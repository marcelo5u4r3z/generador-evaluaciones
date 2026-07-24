const assert = require('node:assert/strict');
const { splitTopics, distributePoints, generateAssessment } = require('../src/generator');

assert.deepEqual(splitTopics('Fracciones, Decimales\nPorcentajes; Proporciones'), [
  'Fracciones',
  'Decimales',
  'Porcentajes',
  'Proporciones',
]);

assert.deepEqual(distributePoints(10, 3), [4, 3, 3]);

const assessment = generateAssessment({
  subject: 'Matemática',
  grade: '7° básico',
  topics: 'Álgebra, Geometría',
  duration: '60',
  totalScore: '24',
  assessmentType: 'multiple',
});

assert.equal(assessment.typeLabel, 'Múltiple opción');
assert.equal(assessment.questions.length, 6);
assert.equal(
  assessment.questions.reduce((sum, question) => sum + question.points, 0),
  24,
);

console.log('Todas las pruebas del generador pasaron.');
