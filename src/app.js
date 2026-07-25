const STORAGE_KEY = 'aula-prototype-courses-v1';
const app = document.querySelector('#app');

const state = {
  courses: loadCourses(),
  route: parseRoute(),
  draft: null,
  messages: [],
};

function loadCourses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : cloneDemoCourses();
  } catch {
    return cloneDemoCourses();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.courses));
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { page: parts[0] || 'courses', courseId: parts[1] || null };
}

function navigate(path) {
  location.hash = path;
}

function courseById(id = state.route.courseId) {
  return state.courses.find((course) => course.id === id);
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function icon(name) {
  const paths = {
    arrow: '<path d="m9 18 6-6-6-6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    calendar: '<path d="M8 2v4m8-4v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    chevron: '<path d="m15 18-6-6 6-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    home: '<path d="m3 11 9-9 9 9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    spark: '<path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5Z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8Z"/>',
    upload: '<path d="M12 3v12m-5-7 5-5 5 5M5 21h14"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name] || paths.file}</svg>`;
}

function topbar({ course, back, action = '' } = {}) {
  return `<header class="topbar">
    <a class="brand" href="#/courses" aria-label="Ir a Mis cursos"><span class="brand-mark">A</span><span>Aula</span></a>
    ${course ? `<div class="course-context"><span>${escapeHtml(course.subject)}</span><strong>${escapeHtml(course.name)}</strong></div>` : ''}
    <div class="topbar-actions">${action}${back ? `<a class="quiet-link" href="${back.href}">${icon('chevron')} ${back.label}</a>` : '<div class="avatar" title="Mariana Silva">MS</div>'}</div>
  </header>`;
}

function courseNav(course, active) {
  return `<nav class="course-nav" aria-label="Navegación del curso">
    <a class="${active === 'course' ? 'active' : ''}" href="#/course/${course.id}">${icon('home')} Inicio</a>
    <a class="${active === 'agent' ? 'active' : ''}" href="#/agent/${course.id}">${icon('spark')} Ayudante</a>
    <a class="${active === 'library' ? 'active' : ''}" href="#/library/${course.id}">${icon('library')} Biblioteca</a>
    <a class="${active === 'planning' ? 'active' : ''}" href="#/planning/${course.id}">${icon('calendar')} Planificación</a>
  </nav>`;
}

function pageShell(content, options = {}) {
  return `${topbar(options)}${options.course ? courseNav(options.course, options.active) : ''}<main class="${options.className || 'page'}">${content}</main>`;
}

function renderCourses() {
  const cards = state.courses.map((course) => `<a class="course-card" href="#/course/${course.id}">
    <div class="course-color ${course.subject.toLowerCase().replaceAll('á', 'a')}">${course.subject.slice(0, 2).toUpperCase()}</div>
    <div class="course-card-copy"><span>${escapeHtml(course.level)}</span><h2>${escapeHtml(course.name)}</h2><p>${escapeHtml(course.subject)} · ${escapeHtml(course.group)}</p></div>
    <div class="next-class"><small>Próxima clase</small><strong>${escapeHtml(course.nextClass)}</strong></div>
    <span class="round-arrow">${icon('arrow')}</span>
  </a>`).join('');
  app.innerHTML = pageShell(`<section class="page-heading"><div><p class="eyebrow">Tu espacio de trabajo</p><h1>Mis cursos</h1><p>Todo lo que necesitás para preparar y acompañar tus clases.</p></div><a class="primary-button" href="#/create">${icon('plus')} Crear curso</a></section><section class="course-list">${cards}</section>`, { className: 'page courses-page' });
}

function renderCreate() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  app.innerHTML = pageShell(`<section class="narrow-page"><div class="page-heading compact"><div><p class="eyebrow">Nuevo curso</p><h1>Contanos sobre tu curso</h1><p>Esta información ayudará a tu asistente a preparar materiales que se adapten a tu forma de enseñar.</p></div></div>
    <form id="course-form" class="form-card">
      <div class="form-section"><h2>Datos básicos</h2><div class="field-grid"><label class="wide">Nombre del curso<input name="name" required placeholder="Ej: Historia 3.º B"></label><label>Asignatura<input name="subject" required placeholder="Ej: Historia"></label><label>Nivel educativo<select name="level" required><option value="">Seleccionar</option><option>Educación Primaria</option><option>Educación Media — 1.º</option><option>Educación Media — 2.º</option><option>Educación Media — 3.º</option><option>Bachillerato — 4.º</option><option>Bachillerato — 5.º</option><option>Bachillerato — 6.º</option><option>Educación Terciaria</option></select></label><label>Grupo<input name="group" required placeholder="Ej: 3.º B"></label><label>País<select name="country"><option>Uruguay</option><option>Argentina</option><option>Chile</option><option>Otro</option></select></label></div></div>
      <div class="form-section"><h2>Calendario</h2><div class="field-grid"><label>Fecha de inicio<input type="date" name="startDate" required value="2026-03-02"></label><label>Fecha de finalización<input type="date" name="endDate" required value="2026-11-27"></label><fieldset class="wide"><legend>Días de clase</legend><div class="day-picker">${days.map((day) => `<label><input type="checkbox" name="classDays" value="${day}"><span>${day.slice(0, 3)}</span></label>`).join('')}</div></fieldset><label>Duración de cada clase<select name="classDuration"><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option><option value="120">120 minutos</option></select></label></div></div>
      <div class="form-section"><h2>Tu forma de enseñar</h2><div class="field-grid"><label class="wide">Metodología<select name="methodology"><option>Mixta</option><option>Aprendizaje basado en problemas</option><option>Resolución de problemas</option><option>Taller</option><option>Indagación y laboratorio</option><option>Expositiva</option></select></label><label class="wide">Preferencias del docente<textarea name="preferences" rows="4" placeholder="Ej: Prefiero clases participativas, actividades breves y ejemplos cercanos a la realidad del grupo."></textarea><small>Podés cambiar esto más adelante.</small></label></div></div>
      <div class="form-actions"><a class="secondary-button" href="#/courses">Cancelar</a><button class="primary-button" type="submit">Crear curso ${icon('arrow')}</button></div>
    </form></section>`, { back: { href: '#/courses', label: 'Mis cursos' }, className: 'page' });
  document.querySelector('#course-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const course = createCourse({ ...Object.fromEntries(data.entries()), classDays: data.getAll('classDays') });
    state.courses.unshift(course); persist(); navigate(`/course/${course.id}`);
  });
}

function renderCourse(course) {
  const materials = course.materials.slice(0, 3).map((m) => `<li><span class="file-icon">${icon('file')}</span><div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.type)} · ${escapeHtml(m.date)}</small></div></li>`).join('') || '<li class="empty-row">Todavía no agregaste materiales.</li>';
  app.innerHTML = pageShell(`<section class="welcome-row"><div><p class="eyebrow">${escapeHtml(course.level)}</p><h1>Buen día, Mariana</h1><p>Esto es lo más importante de <strong>${escapeHtml(course.name)}</strong> hoy.</p></div><a class="register-button" href="#/register/${course.id}">${icon('check')} Registrar última clase</a></section>
    <a class="assistant-prompt" href="#/agent/${course.id}"><span class="assistant-orb">${icon('spark')}</span><div><small>Tu ayudante para este curso</small><strong>¿Qué necesitás preparar?</strong><p>Pedime una clase, un práctico, una evaluación o un cambio en la planificación.</p></div><span class="prompt-arrow">${icon('arrow')}</span></a>
    <section class="dashboard-grid"><div class="main-column">
      <article class="next-card"><div class="card-heading"><div><p class="eyebrow">Próxima clase</p><h2>${escapeHtml(course.nextClass)}</h2></div><span class="calendar-badge">${icon('calendar')}</span></div><div class="next-topic"><small>Contenido previsto</small><strong>${escapeHtml(course.pendingTopics[0] || 'A definir')}</strong></div><a href="#/agent/${course.id}?action=class">Preparar esta clase ${icon('arrow')}</a></article>
      <article class="content-card"><div class="card-heading"><div><p class="eyebrow">Recorrido del curso</p><h2>Contenidos</h2></div><a href="#/planning/${course.id}">Ver planificación</a></div><div class="topic-columns"><div><h3><span class="status-dot done"></span> Trabajados</h3>${course.workedTopics.map(t => `<span class="topic-chip done">${escapeHtml(t)}</span>`).join('') || '<p class="muted">Aún no hay contenidos registrados.</p>'}</div><div><h3><span class="status-dot pending"></span> Pendientes</h3>${course.pendingTopics.map(t => `<span class="topic-chip">${escapeHtml(t)}</span>`).join('') || '<p class="muted">No hay pendientes.</p>'}</div></div></article>
    </div><aside class="side-column"><article class="progress-card"><div class="progress-ring" style="--progress:${course.progress * 3.6}deg"><span>${course.progress}%</span></div><div><p class="eyebrow">Avance estimado</p><h2>Vas por buen camino</h2><p>Basado en la planificación y las clases registradas.</p></div></article><article class="materials-card"><div class="card-heading"><div><p class="eyebrow">Biblioteca</p><h2>Materiales recientes</h2></div><a href="#/library/${course.id}">Ver todos</a></div><ul>${materials}</ul><a class="text-action" href="#/library/${course.id}">${icon('plus')} Agregar material</a></article></aside></section>`, { course, active: 'course', className: 'page course-home' });
}

function renderLibrary(course) {
  const rows = course.materials.map(m => `<li><span class="file-icon large">${icon('file')}</span><div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.type)} · ${escapeHtml(m.size || 'Archivo local')} · ${escapeHtml(m.date)}</small></div><span class="ready">${icon('check')} Listo</span></li>`).join('');
  app.innerHTML = pageShell(`<section class="page-heading"><div><p class="eyebrow">Contexto del curso</p><h1>Biblioteca</h1><p>Guardá aquí los materiales que usás para planificar ${escapeHtml(course.name)}.</p></div></section><section class="library-layout"><form id="upload-form" class="upload-card"><span class="upload-icon">${icon('upload')}</span><h2>Agregar un material</h2><p>La carga es local en este prototipo. El archivo se mostrará en la biblioteca, pero todavía no será procesado.</p><label class="file-input"><input id="material-file" type="file" required><span>Elegir archivo</span></label><label>Tipo de material<select id="material-type"><option>Programa</option><option>Bibliografía</option><option>Apuntes</option><option>Evaluación anterior</option><option>Otro material</option></select></label><button class="primary-button" type="submit">Agregar a la biblioteca</button></form><article class="library-card"><div class="card-heading"><div><p class="eyebrow">${course.materials.length} materiales</p><h2>Materiales del curso</h2></div></div><ul class="material-list">${rows || '<li class="empty-library"><span class="file-icon large">'+icon('book')+'</span><strong>Tu biblioteca está vacía</strong><p>Agregá el programa o tus apuntes para empezar.</p></li>'}</ul></article></section>`, { course, active: 'library', className: 'page' });
  document.querySelector('#upload-form').addEventListener('submit', (event) => {
    event.preventDefault(); const file = document.querySelector('#material-file').files[0]; if (!file) return;
    const updated = addMaterial(course, { name: file.name, type: document.querySelector('#material-type').value, size: formatBytes(file.size) });
    replaceCourse(updated); renderLibrary(updated); showToast('Material agregado a la biblioteca');
  });
}

function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function replaceCourse(course) { state.courses = state.courses.map(c => c.id === course.id ? course : c); persist(); }

function renderAgent(course) {
  if (!state.messages.length) state.messages = [{ role: 'assistant', text: `Hola, Mariana. Ya tengo presente el contexto de ${course.name}. ¿Qué querés preparar hoy?` }];
  const actions = Object.entries(QUICK_ACTIONS).map(([key, a]) => `<button class="quick-action" data-action="${key}">${icon(key === 'class' ? 'calendar' : key === 'replan' ? 'arrow' : 'file')} ${a.label}</button>`).join('');
  const messages = state.messages.map(m => `<div class="message ${m.role}"><span>${m.role === 'assistant' ? icon('spark') : 'MS'}</span><div>${escapeHtml(m.text)}</div></div>`).join('');
  app.innerHTML = pageShell(`<section class="agent-layout ${state.draft ? 'has-document' : ''}"><section class="chat-panel"><div class="chat-heading"><div><p class="eyebrow">Ayudante del curso</p><h1>¿Qué preparamos?</h1></div><span class="prototype-tag">Respuesta simulada</span></div><div class="quick-actions">${actions}</div><div class="messages" id="messages">${messages}</div><form id="chat-form" class="composer"><textarea id="chat-input" rows="1" placeholder="Escribí lo que necesitás…" aria-label="Mensaje para el ayudante"></textarea><button aria-label="Enviar mensaje">${icon('send')}</button></form><p class="composer-note">Este prototipo usa respuestas de demostración y no se conecta a una IA.</p></section>${state.draft ? documentPanel(state.draft) : `<aside class="document-placeholder"><span>${icon('file')}</span><h2>Tu material aparecerá aquí</h2><p>Elegí una acción o contame qué necesitás. Podrás editar el resultado antes de guardarlo.</p></aside>`}</section>`, { course, active: 'agent', className: 'agent-page' });
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => simulateAgent(button.dataset.action, course)));
  document.querySelector('#chat-form').addEventListener('submit', event => { event.preventDefault(); const input = document.querySelector('#chat-input'); if (!input.value.trim()) return; const action = inferAction(input.value); state.messages.push({ role: 'user', text: input.value.trim() }); input.value = ''; simulateAgent(action, course, false); });
  bindDocumentActions(course);
}

function inferAction(text) { const t = text.toLowerCase(); if (t.includes('evalu')) return 'assessment'; if (t.includes('práct') || t.includes('pract')) return 'practice'; if (t.includes('planif') || t.includes('perd')) return 'replan'; return 'class'; }
function simulateAgent(action, course, includeUser = true) {
  if (includeUser) state.messages.push({ role: 'user', text: QUICK_ACTIONS[action].prompt });
  state.messages.push({ role: 'assistant', text: action === 'replan' ? 'Preparé una propuesta sin modificar todavía tu calendario. Podés revisarla y pedirme cualquier ajuste.' : `Preparé un primer borrador considerando el avance de ${course.name}, tus preferencias y los contenidos registrados. Podés editarlo o pedirme cambios.` });
  state.draft = generateDocument(action, course); renderAgent(course);
}

function documentPanel(draft) {
  return `<aside class="document-panel"><header><div><p class="eyebrow">${escapeHtml(draft.status)}</p><input id="document-title" value="${escapeHtml(draft.title)}" aria-label="Título del documento"></div><div class="document-actions"><button id="print-document" class="icon-button" title="Imprimir o guardar como PDF">${icon('print')}</button><button id="save-document" class="save-button">${draft.saved ? icon('check') + ' Guardado' : 'Guardar'}</button></div></header><div class="paper"><textarea id="document-body" aria-label="Contenido editable">${escapeHtml(draft.body)}</textarea></div><footer><span>Podés editar directamente este borrador.</span><button id="request-change" class="secondary-button">Pedir un cambio</button></footer></aside>`;
}

function bindDocumentActions(course) {
  const save = document.querySelector('#save-document'); if (!save) return;
  const sync = () => { state.draft.title = document.querySelector('#document-title').value; state.draft.body = document.querySelector('#document-body').value; };
  save.addEventListener('click', () => { sync(); state.draft.saved = true; save.innerHTML = `${icon('check')} Guardado`; showToast('Borrador guardado localmente'); });
  document.querySelector('#print-document').addEventListener('click', () => { sync(); window.print(); });
  document.querySelector('#request-change').addEventListener('click', () => { sync(); const input = document.querySelector('#chat-input'); input.value = 'Quiero cambiar '; input.focus(); });
}

function renderRegister(course) {
  const allTopics = [...new Set([...course.pendingTopics, ...course.workedTopics])];
  app.innerHTML = pageShell(`<section class="modal-page"><div class="register-card"><div class="page-heading compact"><div><p class="eyebrow">Seguimiento del curso</p><h1>¿Cómo fue la última clase?</h1><p>Este registro mantiene actualizado el avance de tu curso.</p></div></div><form id="session-form"><fieldset><legend>Estado de la clase</legend><div class="status-picker"><label><input type="radio" name="status" value="realizada" checked><span>${icon('check')}<strong>Realizada</strong><small>Se completó lo previsto</small></span></label><label><input type="radio" name="status" value="parcial"><span>½<strong>Parcialmente</strong><small>Quedaron temas pendientes</small></span></label><label><input type="radio" name="status" value="no-realizada"><span>—<strong>No realizada</strong><small>La clase no tuvo lugar</small></span></label></div></fieldset><fieldset><legend>Contenidos trabajados</legend><p class="field-help">Seleccioná los que corresponden o agregá uno nuevo.</p><div class="topic-picker">${allTopics.map(t => `<label><input type="checkbox" name="topics" value="${escapeHtml(t)}"><span>${escapeHtml(t)}</span></label>`).join('')}</div><label>Otro contenido<input name="otherTopic" placeholder="Escribí un contenido si no está en la lista"></label></fieldset><label>Nota de la clase <span class="optional">Opcional</span><textarea name="note" rows="3" placeholder="Ej: El grupo necesitó más tiempo para la actividad."></textarea></label><div class="form-actions"><a class="secondary-button" href="#/course/${course.id}">Cancelar</a><button class="primary-button">Guardar registro</button></div></form></div></section>`, { course, className: 'page' });
  document.querySelector('#session-form').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); const topics = data.getAll('topics'); if (data.get('otherTopic')) topics.push(data.get('otherTopic')); const updated = registerSession(course, { status: data.get('status'), topics, note: data.get('note') }); replaceCourse(updated); navigate(`/course/${course.id}`); setTimeout(() => showToast('Clase registrada. Actualizamos el avance del curso.'), 50); });
}

function renderPlanning(course) {
  const topics = [...course.workedTopics.map(t => ({ t, done: true })), ...course.pendingTopics.map(t => ({ t, done: false }))];
  app.innerHTML = pageShell(`<section class="page-heading"><div><p class="eyebrow">Planificación</p><h1>El recorrido de ${escapeHtml(course.name)}</h1><p>Una vista sencilla de lo trabajado y lo que viene.</p></div><a class="secondary-button" href="#/agent/${course.id}?action=replan">Replanificar con mi ayudante</a></section><section class="planning-card"><div class="progress-header"><div><strong>${course.progress}% del curso</strong><span>${course.workedTopics.length} contenidos trabajados · ${course.pendingTopics.length} pendientes</span></div><div class="progress-track"><i style="width:${course.progress}%"></i></div></div><ol class="timeline">${topics.map((item, index) => `<li class="${item.done ? 'done' : ''}"><span>${item.done ? icon('check') : index + 1}</span><div><small>${item.done ? 'Trabajado' : 'Pendiente'}</small><strong>${escapeHtml(item.t)}</strong></div></li>`).join('')}</ol></section>`, { course, active: 'planning', className: 'page' });
}

function showToast(message) { document.querySelector('.toast')?.remove(); const toast = document.createElement('div'); toast.className = 'toast'; toast.innerHTML = `${icon('check')} ${escapeHtml(message)}`; document.body.append(toast); setTimeout(() => toast.remove(), 3200); }

function render() {
  state.route = parseRoute(); const course = courseById();
  if (state.route.page === 'create') return renderCreate();
  if (state.route.page === 'course' && course) return renderCourse(course);
  if (state.route.page === 'library' && course) return renderLibrary(course);
  if (state.route.page === 'agent' && course) return renderAgent(course);
  if (state.route.page === 'register' && course) return renderRegister(course);
  if (state.route.page === 'planning' && course) return renderPlanning(course);
  renderCourses();
}

window.addEventListener('hashchange', render);
render();
