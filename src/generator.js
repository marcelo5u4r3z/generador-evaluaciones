function splitTopics(rawTopics) {
  return rawTopics
    .split(/[\n,;]/)
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function distributePoints(totalScore, itemCount) {
  const base = Math.floor(totalScore / itemCount);
  let remainder = totalScore % itemCount;

  return Array.from({ length: itemCount }, () => {
    const points = base + (remainder > 0 ? 1 : 0);
    remainder -= 1;
    return points;
  });
}

function createQuestions(topics, type, totalScore) {
  const minimumQuestions = type === 'multiple' ? 6 : 4;
  const itemCount = Math.max(minimumQuestions, topics.length);
  const points = distributePoints(totalScore, itemCount);

  return Array.from({ length: itemCount }, (_, index) => {
    const topic = topics[index % topics.length];
    if (type === 'multiple') {
      return {
        points: points[index],
        text: `Pregunta ${index + 1}: Selecciona la alternativa correcta sobre ${topic}.`,
        helper: 'A) Opción correcta  B) Distractor  C) Distractor  D) Distractor',
      };
    }

    return {
      points: points[index],
      text: `Pregunta ${index + 1}: Explica con tus palabras un aspecto relevante de ${topic}.`,
      helper: 'Criterio sugerido: claridad conceptual, uso de ejemplos y respuesta completa.',
    };
  });
}

function generateAssessment(data) {
  const topics = splitTopics(data.topics);
  if (!topics.length) {
    throw new Error('Debes ingresar al menos un tema.');
  }

  const totalScore = Number(data.totalScore);
  const duration = Number(data.duration);
  const typeLabel = data.assessmentType === 'multiple' ? 'Múltiple opción' : 'Desarrollo';
  const questions = createQuestions(topics, data.assessmentType, totalScore);

  return {
    subject: data.subject.trim(),
    grade: data.grade.trim(),
    topics,
    duration,
    totalScore,
    typeLabel,
    questions,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { splitTopics, distributePoints, generateAssessment };
}
