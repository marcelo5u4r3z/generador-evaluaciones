const DEMO_COURSES = [
  {
    id: 'historia-3b',
    name: 'Historia 3.º B',
    subject: 'Historia',
    level: 'Educación Media — 3.º',
    group: '3.º B',
    country: 'Uruguay',
    startDate: '2026-03-02',
    endDate: '2026-11-27',
    classDays: ['Martes', 'Jueves'],
    classDuration: 45,
    methodology: 'Aprendizaje basado en problemas',
    preferences: 'Clases participativas, con fuentes históricas y una actividad breve de cierre.',
    nextClass: 'Martes 28 de julio, 10:15',
    progress: 38,
    workedTopics: ['Revolución Industrial', 'Imperialismo', 'Primera Guerra Mundial'],
    pendingTopics: ['Período de entreguerras', 'Segunda Guerra Mundial', 'Guerra Fría'],
    materials: [
      { id: 'm1', name: 'Programa de Historia 3.º', type: 'Programa', date: '12 jul', size: '1,8 MB' },
      { id: 'm2', name: 'Hobsbawm — Historia del siglo XX', type: 'Bibliografía', date: '8 jul', size: '4,2 MB' },
      { id: 'm3', name: 'Evaluación Unidad 1', type: 'Evaluación anterior', date: '25 jun', size: '320 KB' },
    ],
    sessions: [
      { id: 's1', date: '23 jul', status: 'realizada', topics: ['Primera Guerra Mundial'], note: 'Se completó la actividad con fuentes.' },
    ],
  },
  {
    id: 'matematica-1a',
    name: 'Matemática 1.º A',
    subject: 'Matemática',
    level: 'Educación Media — 1.º',
    group: '1.º A',
    country: 'Uruguay',
    startDate: '2026-03-02',
    endDate: '2026-11-27',
    classDays: ['Lunes', 'Miércoles', 'Viernes'],
    classDuration: 45,
    methodology: 'Resolución de problemas',
    preferences: 'Usar ejemplos cotidianos y ejercicios de dificultad progresiva.',
    nextClass: 'Lunes 27 de julio, 08:30',
    progress: 52,
    workedTopics: ['Números enteros', 'Fracciones', 'Proporcionalidad'],
    pendingTopics: ['Ecuaciones', 'Geometría plana', 'Estadística'],
    materials: [
      { id: 'm4', name: 'Programa anual de Matemática', type: 'Programa', date: '15 jul', size: '890 KB' },
      { id: 'm5', name: 'Guía de proporcionalidad', type: 'Apuntes', date: '2 jul', size: '540 KB' },
    ],
    sessions: [],
  },
  {
    id: 'biologia-5',
    name: 'Biología 5.º',
    subject: 'Biología',
    level: 'Bachillerato — 5.º',
    group: '5.º Biológico',
    country: 'Uruguay',
    startDate: '2026-03-02',
    endDate: '2026-11-27',
    classDays: ['Miércoles'],
    classDuration: 90,
    methodology: 'Indagación y laboratorio',
    preferences: 'Relacionar conceptos con prácticas y casos de salud.',
    nextClass: 'Miércoles 29 de julio, 13:20',
    progress: 44,
    workedTopics: ['Célula', 'Metabolismo', 'Genética mendeliana'],
    pendingTopics: ['Genética molecular', 'Evolución', 'Ecología'],
    materials: [],
    sessions: [],
  },
];

const QUICK_ACTIONS = {
  class: { label: 'Preparar próxima clase', prompt: 'Preparame la próxima clase.', title: 'Plan de clase — Período de entreguerras' },
  practice: { label: 'Crear práctico', prompt: 'Creá un práctico sobre lo trabajado.', title: 'Práctico — Primera Guerra Mundial' },
  assessment: { label: 'Crear evaluación', prompt: 'Creá una evaluación sobre lo trabajado hasta ahora.', title: 'Evaluación — Unidad 2' },
  replan: { label: 'Replanificar curso', prompt: 'Necesito replanificar el curso porque perdí dos clases.', title: 'Propuesta de replanificación' },
};

function cloneDemoCourses() {
  return JSON.parse(JSON.stringify(DEMO_COURSES));
}

function createCourse(data, id = `curso-${Date.now()}`) {
  const days = Array.isArray(data.classDays) ? data.classDays : [data.classDays].filter(Boolean);
  return {
    id,
    name: data.name.trim(),
    subject: data.subject.trim(),
    level: data.level,
    group: data.group.trim(),
    country: data.country,
    startDate: data.startDate,
    endDate: data.endDate,
    classDays: days,
    classDuration: Number(data.classDuration),
    methodology: data.methodology,
    preferences: data.preferences.trim(),
    nextClass: `${days[0] || 'A definir'} · horario a confirmar`,
    progress: 0,
    workedTopics: [],
    pendingTopics: ['Agregar contenidos del programa'],
    materials: [],
    sessions: [],
  };
}

function addMaterial(course, material) {
  return { ...course, materials: [{ id: `material-${Date.now()}`, date: 'Hoy', ...material }, ...course.materials] };
}

function registerSession(course, session) {
  const topics = session.topics.map((topic) => topic.trim()).filter(Boolean);
  const workedTopics = session.status === 'no-realizada'
    ? course.workedTopics
    : [...new Set([...course.workedTopics, ...topics])];
  const pendingTopics = course.pendingTopics.filter((topic) => !topics.includes(topic));
  return {
    ...course,
    workedTopics,
    pendingTopics: session.status === 'no-realizada' ? course.pendingTopics : pendingTopics,
    progress: session.status === 'no-realizada' ? course.progress : Math.min(100, course.progress + (session.status === 'parcial' ? 3 : 6)),
    sessions: [{ id: `session-${Date.now()}`, date: 'Hoy', ...session, topics }, ...course.sessions],
  };
}

function generateDocument(action, course) {
  const topic = course.pendingTopics[0] || course.workedTopics.at(-1) || 'próximo contenido';
  const common = { action, title: QUICK_ACTIONS[action].title, status: 'Borrador', saved: false };
  if (action === 'practice') {
    return { ...common, body: `PRÁCTICO: ${course.subject.toUpperCase()}\n\nTema: ${course.workedTopics.at(-1) || topic}\nDuración sugerida: 45 minutos\n\n1. Explicá con tus palabras el concepto central trabajado en clase.\n\n2. Analizá el material entregado e identificá dos ideas principales.\n\n3. Relacioná el tema con uno de los contenidos anteriores del curso.\n\n4. Elaborá una conclusión breve.\n\nCriterios de evaluación\n• Claridad conceptual\n• Uso de evidencias\n• Fundamentación de las respuestas` };
  }
  if (action === 'assessment') {
    return { ...common, body: `EVALUACIÓN DE ${course.subject.toUpperCase()}\n\nGrupo: ${course.group}\nDuración: 45 minutos · Puntaje: 30 puntos\n\nContenidos: ${course.workedTopics.join(', ')}\n\n1. Definí dos conceptos centrales trabajados. (6 pts.)\n\n2. Analizá la fuente propuesta y ubicála en su contexto. (8 pts.)\n\n3. Compará dos de los procesos estudiados. (8 pts.)\n\n4. Desarrollá una respuesta argumentada integrando los contenidos de la unidad. (8 pts.)\n\nRecordá fundamentar todas tus respuestas.` };
  }
  if (action === 'replan') {
    return { ...common, body: `REPLANIFICACIÓN PROPUESTA\n\nCurso: ${course.name}\nMotivo: recuperación de dos clases no realizadas\n\nAjustes sugeridos\n\n• Integrar “${topic}” en una secuencia de dos clases, priorizando los conceptos esenciales.\n• Convertir la actividad de repaso en una consigna domiciliaria breve.\n• Mantener la fecha de evaluación y reservar 15 minutos de la clase anterior para consultas.\n• Revisar el avance nuevamente dentro de tres semanas.\n\nEsta propuesta no modifica el calendario hasta que la confirmes.` };
  }
  return { ...common, body: `PLAN DE CLASE\n\nCurso: ${course.name}\nTema: ${topic}\nDuración: ${course.classDuration} minutos\n\nObjetivos\n• Comprender las ideas principales de ${topic}.\n• Relacionar el nuevo contenido con lo trabajado anteriormente.\n\nInicio · 10 minutos\nRecuperar saberes previos con una pregunta disparadora y registrar las primeras hipótesis del grupo.\n\nDesarrollo · 25 minutos\nPresentar el tema a partir de una fuente breve. Trabajar en parejas para identificar ideas centrales y compartir conclusiones.\n\nCierre · 10 minutos\nConstruir una síntesis colectiva y responder una consigna de salida individual.\n\nRecursos\nPrograma del curso, fragmento de lectura y pizarrón.\n\nEvidencia de aprendizaje\nRespuesta de salida: una idea comprendida y una pregunta pendiente.` };
}

if (typeof module !== 'undefined') {
  module.exports = { DEMO_COURSES, QUICK_ACTIONS, cloneDemoCourses, createCourse, addMaterial, registerSession, generateDocument };
}
