const form = document.querySelector('#assessment-form');
const output = document.querySelector('#assessment-output');
const printButton = document.querySelector('#print-button');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderAssessment(assessment) {
  output.classList.remove('empty-state');
  output.innerHTML = `
    <div class="assessment-card">
      <header class="assessment-title">
        <p>${assessment.typeLabel}</p>
        <h3>Evaluación de ${escapeHtml(assessment.subject)}</h3>
      </header>

      <dl class="meta-grid">
        <div><dt>Curso</dt><dd>${escapeHtml(assessment.grade)}</dd></div>
        <div><dt>Duración</dt><dd>${escapeHtml(assessment.duration)} minutos</dd></div>
        <div><dt>Puntaje</dt><dd>${escapeHtml(assessment.totalScore)} puntos</dd></div>
      </dl>

      <section>
        <h4>Temas</h4>
        <ul class="topic-list">${assessment.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('')}</ul>
      </section>

      <section>
        <h4>Instrucciones para estudiantes</h4>
        <p>Lee cada pregunta con atención, administra tu tiempo y responde según lo solicitado. Revisa tus respuestas antes de entregar.</p>
      </section>

      <section>
        <h4>Preguntas sugeridas</h4>
        <ol class="question-list">
          ${assessment.questions
            .map(
              (question) => `
                <li>
                  <strong>${escapeHtml(question.text)}</strong>
                  <span>${escapeHtml(question.helper)}</span>
                  <em>${escapeHtml(question.points)} pts.</em>
                </li>`,
            )
            .join('')}
        </ol>
      </section>
    </div>
  `;
  printButton.disabled = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const assessment = generateAssessment(Object.fromEntries(formData.entries()));
  renderAssessment(assessment);
});

printButton.addEventListener('click', () => window.print());
