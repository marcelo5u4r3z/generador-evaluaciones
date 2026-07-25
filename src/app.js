const STORAGE_KEY = 'nerio-courses-v1';
const LEGACY_STORAGE_KEY = 'aula-prototype-courses-v1';
const app = document.querySelector('#app');

const state = {
  courses: loadCourses(),
  route: parseRoute(),
  draft: null,
  messages: [],
  educationDraft: { countryId: 'uy' },
  handledActionKey: null,
};

function loadCourses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : cloneDemoCourses();
  } catch {
    return cloneDemoCourses();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.courses));
}

function parseRoute() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  return { page: parts[0] || 'courses', courseId: parts[1] || null, action: new URLSearchParams(query).get('action') };
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
    nerio: '<path d="M6 18V6M6.5 6.5l11 11M18 18V6"/><circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none"/>',
    upload: '<path d="M12 3v12m-5-7 5-5 5 5M5 21h14"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name] || paths.file}</svg>`;
}

function topbar({ course, back, action = '' } = {}) {
  return `<header class="topbar">
    <a class="brand" href="#/courses" aria-label="NERIO, ir a Mis cursos"><img class="brand-mark" src="src/nerio-mark.svg" alt=""><span class="wordmark">NERIO</span></a>
    ${course ? `<div class="course-context"><span>Curso activo</span><strong>${escapeHtml(course.subject)}</strong><small>${escapeHtml(course.level)}</small></div>` : '<span class="brand-tagline">Tu agente docente.</span>'}
    <div class="topbar-actions">${action}${back ? `<a class="quiet-link" href="${back.href}">${icon('chevron')} ${back.label}</a>` : '<div class="avatar" title="Mariana Silva">MS</div>'}</div>
  </header>`;
}

function courseNav(course, active) {
  return `<nav class="course-nav" aria-label="Navegación del curso">
    <a class="back-courses" href="#/courses">${icon('chevron')} <span>Mis cursos</span></a>
    <span class="nav-divider"></span>
    <a class="${active === 'course' ? 'active' : ''}" href="#/course/${course.id}">${icon('home')} <span>Curso</span></a>
    <a class="nerio-nav ${active === 'agent' ? 'active' : ''}" href="#/agent/${course.id}">${icon('nerio')} <span>Nerio</span></a>
    <a class="${active === 'library' ? 'active' : ''}" href="#/library/${course.id}">${icon('library')} Biblioteca</a>
    <a class="${active === 'planning' ? 'active' : ''}" href="#/planning/${course.id}">${icon('calendar')} Planificación</a>
    <a class="${active === 'register' ? 'active' : ''}" href="#/register/${course.id}">${icon('check')} Registro</a>
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
    <div class="course-progress"><span>${course.progress}%</span><i><b style="width:${course.progress}%"></b></i><small>avance</small></div>
    <span class="round-arrow">${icon('arrow')}</span>
  </a>`).join('');
  app.innerHTML = pageShell(`<section class="page-heading courses-heading"><div><p class="eyebrow">Tu trabajo, en orden</p><h1>Mis cursos</h1><p>Nerio mantiene cada curso en contexto para que puedas concentrarte en enseñar.</p></div><a class="primary-button" href="#/create">${icon('plus')} Crear curso</a></section><section class="course-list" aria-label="Cursos">${cards}</section>`, { className: 'page courses-page' });
}

function renderCreate() {
  const selection = state.educationDraft;
  const resolved = resolveEducationSelection(selection);
  const country = EDUCATION_CATALOG.countries[0];
  const choiceCards = (items, key) => `<div class="education-choices">${items.filter(i => i.active).map(item => `<button type="button" class="education-choice ${selection[key] === item.id ? 'selected' : ''}" data-education-key="${key}" data-education-value="${item.id}"><strong>${escapeHtml(item.name)}</strong>${item.agency ? `<small>${escapeHtml(item.agency.name)}</small>` : ''}${icon('arrow')}</button>`).join('')}<button type="button" class="education-choice custom ${selection.custom ? 'selected' : ''}" data-custom-education><strong>Otro / No aparece mi curso</strong><small>Podrás escribir los datos manualmente</small>${icon('arrow')}</button></div>`;
  const selectField = (label, key, items) => items?.length ? `<label class="progressive-field">${label}<select data-education-select="${key}"><option value="">Seleccionar…</option>${items.filter(i => i.active).map(item => `<option value="${item.id}" ${selection[key] === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label>` : '';

  let steps = `<div class="selection-step active"><span>País</span><strong>🇺🇾 Uruguay</strong></div>`;
  if (!selection.systemId && !selection.custom) steps += `<section class="progressive-section"><p class="step-number">Paso 1</p><h2>¿Dónde enseñás?</h2><p>Elegí el ámbito que corresponde a tu curso.</p>${choiceCards(country.systems, 'systemId')}</section>`;
  if (resolved.system?.programs) {
    steps += `<section class="progressive-section"><p class="step-number">Paso 2</p><h2>¿Qué nivel y plan?</h2>${selectField('Propuesta educativa', 'programId', resolved.system.programs)}${resolved.program ? selectField('Grado', 'gradeId', resolved.program.grades) : ''}${resolved.grade?.tracks ? selectField(resolved.grade.trackLabel || 'Trayecto', 'trackId', resolved.grade.tracks) : ''}${resolved.grade && (!resolved.grade.tracks || resolved.track) ? selectField('Unidad curricular', 'unitId', resolved.track?.units || resolved.grade.units) : ''}</section>`;
  }
  if (resolved.system?.careers) {
    steps += `<section class="progressive-section"><p class="step-number">Paso 2</p><h2>Elegí la formación</h2>${selectField('Carrera', 'careerId', resolved.system.careers)}${resolved.career?.specialties?.length ? selectField('Especialidad', 'specialtyId', resolved.career.specialties) : ''}${resolved.specialty ? selectField('Plan', 'planId', resolved.specialty.plans) : resolved.career && !resolved.career.specialties?.length ? selectField('Plan', 'planId', resolved.career.plans) : ''}${resolved.plan ? selectField('Año', 'yearId', resolved.plan.years) : ''}${resolved.year?.units?.length ? selectField('Unidad curricular', 'unitId', resolved.year.units) : ''}${resolved.career?.catalogStatus === 'structure-only' ? '<div class="catalog-notice">El catálogo detallado de esta carrera se incorporará próximamente. Podés continuar con la opción personalizada.</div>' : ''}</section>`;
  }
  if (selection.custom) steps += `<section class="progressive-section"><p class="step-number">Configuración personalizada</p><h2>Contanos qué enseñás</h2><div class="field-grid"><label>Nivel o carrera<input data-custom-field="customLevel" value="${escapeHtml(selection.customLevel || '')}" placeholder="Ej: Curso de formación permanente"></label><label>Asignatura o unidad curricular<input data-custom-field="customSubject" value="${escapeHtml(selection.customSubject || '')}" placeholder="Ej: Taller de proyectos"></label></div></section>`;

  const complete = selection.custom ? selection.customLevel && selection.customSubject : Boolean(resolved.curriculumUnit);
  const summary = complete ? educationSummary(selection) : null;
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const details = summary ? `<section class="progressive-section course-details"><p class="step-number">Último paso</p><h2>Completá los detalles</h2><div class="education-summary"><span>${icon('check')}</span><div><small>Tu curso</small><strong>${escapeHtml(summary.title)}</strong><p>${escapeHtml(summary.detail)}</p><em>${escapeHtml(summary.path.join(' → '))}</em></div><button type="button" data-reset-education>Cambiar</button></div><form id="course-form"><div class="field-grid"><label class="wide">Nombre para identificar el curso<input name="name" required value="${escapeHtml(summary.detail || summary.title)}"></label><label>Grupo<input name="group" required placeholder="Ej: 8.º 2"></label><label>Fecha de inicio<input type="date" name="startDate" required value="2026-03-02"></label><label>Fecha de finalización<input type="date" name="endDate" required value="2026-11-27"></label><fieldset class="wide"><legend>Días de clase</legend><div class="day-picker">${days.map(day => `<label><input type="checkbox" name="classDays" value="${day}"><span>${day.slice(0,3)}</span></label>`).join('')}</div></fieldset><label>Duración<select name="classDuration"><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label>Metodología<select name="methodology"><option>Mixta</option><option>Aprendizaje basado en problemas</option><option>Resolución de problemas</option><option>Taller</option><option>Expositiva</option></select></label><label class="wide">Preferencias del docente<textarea name="preferences" rows="3" placeholder="Ej: Actividades breves y ejemplos cercanos al grupo."></textarea></label></div><div class="form-actions"><a class="secondary-button" href="#/courses">Cancelar</a><button class="primary-button">Crear curso ${icon('arrow')}</button></div></form></section>` : '';
  const fallback = selection.systemId && !selection.custom && !summary ? '<button type="button" class="fallback-choice" data-custom-education>Otro / No aparece mi curso</button>' : '';

  app.innerHTML = pageShell(`<section class="narrow-page onboarding"><div class="page-heading compact"><div><p class="eyebrow">Un curso nuevo</p><h1>¿Dónde vas a enseñar?</h1><p>Empecemos por ubicar el curso. Nerio te muestra una decisión por vez.</p></div></div><div class="progressive-card">${steps}${fallback}${details}</div></section>`, { back: { href: '#/courses', label: 'Mis cursos' }, className: 'page' });
  bindEducationForm(summary, resolved);
}

function bindEducationForm(summary, resolved) {
  document.querySelectorAll('[data-education-key]').forEach(button => button.addEventListener('click', () => { state.educationDraft = { countryId: 'uy', [button.dataset.educationKey]: button.dataset.educationValue }; renderCreate(); }));
  document.querySelectorAll('[data-custom-education]').forEach(button => button.addEventListener('click', () => { state.educationDraft = { countryId: 'uy', custom: true }; renderCreate(); }));
  document.querySelectorAll('[data-education-select]').forEach(select => select.addEventListener('change', () => {
    const order = ['programId', 'gradeId', 'trackId', 'careerId', 'specialtyId', 'planId', 'yearId', 'unitId'];
    const key = select.dataset.educationSelect; const next = { ...state.educationDraft, [key]: select.value };
    order.slice(order.indexOf(key) + 1).forEach(k => delete next[k]); state.educationDraft = next; renderCreate();
  }));
  document.querySelectorAll('[data-custom-field]').forEach(input => input.addEventListener('change', () => { state.educationDraft[input.dataset.customField] = input.value.trim(); renderCreate(); }));
  document.querySelector('[data-reset-education]')?.addEventListener('click', () => { state.educationDraft = { countryId: 'uy' }; renderCreate(); });
  document.querySelector('#course-form')?.addEventListener('submit', event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const course = createCourse({ ...Object.fromEntries(data.entries()), classDays: data.getAll('classDays'), country: 'Uruguay', subject: summary.detail.split(' · ').at(-1), level: summary.title, education: { ...state.educationDraft } });
    state.courses.unshift(course); persist(); state.educationDraft = { countryId: 'uy' }; navigate(`/course/${course.id}`);
  });
}

function renderCourse(course) {
  const materials = course.materials.slice(0, 3).map((m) => `<li><span class="file-icon">${icon('file')}</span><div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.type)} · ${escapeHtml(m.date)}</small></div></li>`).join('') || '<li class="empty-row">Todavía no agregaste materiales.</li>';
  app.innerHTML = pageShell(`<section class="welcome-row"><div><p class="eyebrow">${escapeHtml(course.level)}</p><h1>${escapeHtml(course.name)}</h1><p><span class="knowledge-dot"></span> Nerio tiene presente la planificación, ${course.materials.length} materiales y el avance de este curso.</p></div><a class="register-button" href="#/register/${course.id}">${icon('check')} Registrar clase</a></section>
    <section class="course-snapshot" aria-label="Estado del curso"><div><small>Próxima clase</small><strong>${escapeHtml(course.nextClass)}</strong></div><div><small>Estamos por trabajar</small><strong>${escapeHtml(course.pendingTopics[0] || 'A definir')}</strong></div><div class="snapshot-progress"><small>Avance del curso</small><strong>${course.progress}%</strong><i><b style="width:${course.progress}%"></b></i></div></section>
    <section class="create-hub"><div class="section-intro"><div><p class="eyebrow">Prepará lo que sigue</p><h2>¿Qué querés hacer?</h2></div><p>Nerio ya conoce el curso. Elegí una acción y empezá desde ahí.</p></div><div class="creation-actions">
      <a class="creation-action primary" href="#/agent/${course.id}?action=class"><span>${icon('calendar')}</span><strong>Preparar próxima clase</strong><small>${escapeHtml(course.pendingTopics[0] || 'Próximo contenido')}</small></a>
      <a class="creation-action" href="#/agent/${course.id}?action=assessment"><span>${icon('file')}</span><strong>Crear evaluación</strong><small>Sobre lo trabajado</small></a>
      <a class="creation-action" href="#/agent/${course.id}?action=practice"><span>${icon('check')}</span><strong>Crear práctico</strong><small>Actividad y consignas</small></a>
      <a class="creation-action" href="#/library/${course.id}"><span>${icon('upload')}</span><strong>Subir material</strong><small>Sumar contexto al curso</small></a>
      <a class="creation-action" href="#/register/${course.id}"><span>${icon('plus')}</span><strong>Registrar lo que di</strong><small>Mantener el avance al día</small></a>
    </div><a class="ask-nerio" href="#/agent/${course.id}"><span class="presence-dot"></span><div><small>NERIO</small><strong>Preguntame o pedime algo distinto</strong></div>${icon('arrow')}</a></section>
    <section class="dashboard-grid"><div class="main-column"><article class="content-card"><div class="card-heading"><div><p class="eyebrow">Dónde estamos</p><h2>Contenidos del curso</h2></div><a href="#/planning/${course.id}">Ver planificación</a></div><div class="topic-columns"><div><h3><span class="status-dot done"></span> Trabajados</h3>${course.workedTopics.map(t => `<span class="topic-chip done">${escapeHtml(t)}</span>`).join('') || '<p class="muted">Aún no hay contenidos registrados.</p>'}</div><div><h3><span class="status-dot pending"></span> Lo que viene</h3>${course.pendingTopics.map(t => `<span class="topic-chip">${escapeHtml(t)}</span>`).join('') || '<p class="muted">No hay pendientes.</p>'}</div></div></article></div><aside class="side-column"><article class="materials-card"><div class="card-heading"><div><p class="eyebrow">Biblioteca</p><h2>Materiales a mano</h2></div><a href="#/library/${course.id}">Ver todos</a></div><ul>${materials}</ul><a class="text-action" href="#/library/${course.id}">${icon('plus')} Agregar material</a></article></aside></section>`, { course, active: 'course', className: 'page course-home' });
}

function renderLibrary(course) {
  const rows = course.materials.map(m => `<li class="material-${m.type.toLowerCase().replaceAll(' ', '-')}"><span class="material-preview" aria-hidden="true">${icon('file')}<i></i><i></i><i></i></span><div><span class="material-kind">${escapeHtml(m.type)}</span><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.size || 'Archivo local')} · Agregado ${escapeHtml(m.date)}</small><span class="local-status">Guardado en este dispositivo</span></div></li>`).join('');
  app.innerHTML = pageShell(`<section class="page-heading library-heading"><div><p class="eyebrow">Memoria académica</p><h1>Biblioteca</h1><p>El programa, la bibliografía y los materiales que sostienen este curso.</p></div><span class="future-source">Próximamente: fuentes vinculadas a Nerio</span></section><section class="library-layout"><form id="upload-form" class="upload-card"><span class="upload-icon">${icon('upload')}</span><h2>Sumar un material</h2><p>En esta etapa queda guardado en el curso, sin lectura automática.</p><label class="file-input"><input id="material-file" type="file" required><span>Elegir un archivo</span></label><label>¿Qué tipo de material es?<select id="material-type"><option>Programa</option><option>Bibliografía</option><option>Apuntes</option><option>Evaluación anterior</option><option>Otro material</option></select></label><button class="primary-button" type="submit">Guardar en la biblioteca</button></form><article class="library-card"><div class="card-heading"><div><p class="eyebrow">${course.materials.length} materiales</p><h2>En este curso</h2></div></div><ul class="material-list">${rows || '<li class="empty-library"><span class="file-icon large">'+icon('library')+'</span><strong>La memoria de este curso empieza acá</strong><p>Sumá el programa, apuntes o bibliografía cuando quieras.</p></li>'}</ul></article></section>`, { course, active: 'library', className: 'page' });
  document.querySelector('#upload-form').addEventListener('submit', (event) => {
    event.preventDefault(); const file = document.querySelector('#material-file').files[0]; if (!file) return;
    const updated = addMaterial(course, { name: file.name, type: document.querySelector('#material-type').value, size: formatBytes(file.size) });
    replaceCourse(updated); renderLibrary(updated); showToast('Material agregado a la biblioteca');
  });
}

function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function replaceCourse(course) { state.courses = state.courses.map(c => c.id === course.id ? course : c); persist(); }

function renderAgent(course) {
  if (!state.messages.length) state.messages = [{ role: 'assistant', text: `Tengo presente dónde está ${course.name} y qué viene después. ¿Qué preparamos?` }];
  const actionKey = `${course.id}:${state.route.action}`;
  if (QUICK_ACTIONS[state.route.action] && state.handledActionKey !== actionKey) {
    state.messages.push({ role: 'user', text: QUICK_ACTIONS[state.route.action].prompt });
    state.messages.push({ role: 'assistant', text: `Ya preparé un primer borrador con el contexto de ${course.name}. Podés editarlo o pedirme un cambio.` });
    state.draft = generateDocument(state.route.action, course);
    state.handledActionKey = actionKey;
  }
  const actions = Object.entries(QUICK_ACTIONS).map(([key, a]) => `<button class="quick-action" data-action="${key}">${icon(key === 'class' ? 'calendar' : key === 'replan' ? 'arrow' : 'file')} ${a.label}</button>`).join('');
  const messages = state.messages.map(m => `<div class="message ${m.role}"><span>${m.role === 'assistant' ? icon('nerio') : 'MS'}</span><div>${escapeHtml(m.text)}</div></div>`).join('');
  app.innerHTML = pageShell(`<section class="agent-layout ${state.draft ? 'has-document' : ''}"><section class="chat-panel"><div class="agent-context"><span class="nerio-presence">${icon('nerio')}</span><div><p class="eyebrow">NERIO · Curso activo</p><h1>${escapeHtml(course.subject)}</h1><p>${escapeHtml(course.level)} · ${escapeHtml(course.group)}</p></div><span class="demo-status">Demostración</span></div><div class="conversation-intro"><h2>¿Qué preparamos?</h2><p>Podés escribirlo como se lo dirías a alguien que ya conoce tu curso.</p></div><div class="quick-actions">${actions}</div><div class="messages" id="messages">${messages}</div><form id="chat-form" class="composer"><textarea id="chat-input" rows="1" placeholder="Por ejemplo: Preparame la clase del viernes…" aria-label="Escribile a Nerio"></textarea><button aria-label="Pedirle a Nerio">${icon('send')}</button></form><p class="composer-note">Las respuestas están preparadas para esta demostración.</p></section>${state.draft ? documentPanel(state.draft) : `<aside class="document-placeholder"><span class="document-watermark">N</span><p class="eyebrow">Mesa de trabajo</p><h2>Lo que prepares con Nerio va a aparecer acá</h2><p>Podrás revisarlo, editarlo y llevarlo a clase.</p></aside>`}</section>`, { course, active: 'agent', className: 'agent-page' });
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
  return `<aside class="document-panel"><header><div><p class="eyebrow">Documento · ${escapeHtml(draft.status)}</p><input id="document-title" value="${escapeHtml(draft.title)}" aria-label="Título del documento"></div><div class="document-actions"><button id="print-document" class="icon-button" title="Imprimir o guardar como PDF" aria-label="Imprimir o guardar como PDF">${icon('print')}</button><button id="save-document" class="save-button">${draft.saved ? icon('check') + ' Guardado' : 'Guardar'}</button></div></header><div class="paper"><textarea id="document-body" aria-label="Contenido editable">${escapeHtml(draft.body)}</textarea></div><footer><span>El documento es editable.</span><button id="request-change" class="secondary-button">Pedirle un cambio a Nerio</button></footer></aside>`;
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
  app.innerHTML = pageShell(`<section class="modal-page"><div class="register-card"><div class="page-heading compact"><div><p class="eyebrow">Registro</p><h1>¿Cómo fue la última clase?</h1><p>Con este dato, Nerio mantiene el curso al día.</p></div></div><form id="session-form"><fieldset><legend>Estado de la clase</legend><div class="status-picker"><label><input type="radio" name="status" value="realizada" checked><span>${icon('check')}<strong>Realizada</strong><small>Se completó lo previsto</small></span></label><label><input type="radio" name="status" value="parcial"><span>½<strong>Parcialmente</strong><small>Quedaron temas pendientes</small></span></label><label><input type="radio" name="status" value="no-realizada"><span>—<strong>No realizada</strong><small>La clase no tuvo lugar</small></span></label></div></fieldset><fieldset><legend>Contenidos trabajados</legend><p class="field-help">Seleccioná los que corresponden o agregá uno nuevo.</p><div class="topic-picker">${allTopics.map(t => `<label><input type="checkbox" name="topics" value="${escapeHtml(t)}"><span>${escapeHtml(t)}</span></label>`).join('')}</div><label>Otro contenido<input name="otherTopic" placeholder="Escribí un contenido si no está en la lista"></label></fieldset><label>Nota de la clase <span class="optional">Opcional</span><textarea name="note" rows="3" placeholder="Ej: El grupo necesitó más tiempo para la actividad."></textarea></label><div class="form-actions"><a class="secondary-button" href="#/course/${course.id}">Cancelar</a><button class="primary-button">Guardar registro</button></div></form></div></section>`, { course, active: 'register', className: 'page' });
  document.querySelector('#session-form').addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.currentTarget); const topics = data.getAll('topics'); if (data.get('otherTopic')) topics.push(data.get('otherTopic')); const updated = registerSession(course, { status: data.get('status'), topics, note: data.get('note') }); replaceCourse(updated); navigate(`/course/${course.id}`); setTimeout(() => showToast('Clase registrada. Actualizamos el avance del curso.'), 50); });
}

function renderPlanning(course) {
  const topics = [...course.workedTopics.map(t => ({ t, done: true })), ...course.pendingTopics.map(t => ({ t, done: false }))];
  app.innerHTML = pageShell(`<section class="page-heading"><div><p class="eyebrow">Planificación</p><h1>El recorrido de ${escapeHtml(course.name)}</h1><p>Lo trabajado y lo que viene, en una sola línea de tiempo.</p></div><a class="secondary-button" href="#/agent/${course.id}?action=replan">Revisar con Nerio</a></section><section class="planning-card"><div class="progress-header"><div><strong>${course.progress}% del curso</strong><span>${course.workedTopics.length} contenidos trabajados · ${course.pendingTopics.length} pendientes</span></div><div class="progress-track"><i style="width:${course.progress}%"></i></div></div><ol class="timeline">${topics.map((item, index) => `<li class="${item.done ? 'done' : ''}"><span>${item.done ? icon('check') : index + 1}</span><div><small>${item.done ? 'Trabajado' : 'Pendiente'}</small><strong>${escapeHtml(item.t)}</strong></div></li>`).join('')}</ol></section>`, { course, active: 'planning', className: 'page' });
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
