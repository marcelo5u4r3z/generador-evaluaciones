(function educationCatalogModule(globalScope) {
  const OFFICIAL_PROGRAM_FIELDS = {
    available: false,
    issuer: null,
    url: null,
    version: null,
    updatedAt: null,
  };

  const unit = (id, name, aliases = [], officialProgram = OFFICIAL_PROGRAM_FIELDS) => ({
    id,
    name,
    aliases,
    active: true,
    officialProgram: { ...officialProgram },
  });

  const commonEbiUnits = [
    unit('matematica', 'Matemática'), unit('lengua-espanola', 'Lengua Española'),
    unit('ingles', 'Inglés'), unit('historia', 'Historia'), unit('geografia', 'Geografía'),
    unit('biologia', 'Ciencias del Ambiente (Biología)'), unit('fisica-quimica', 'Ciencias Físico-Químicas'),
    unit('educacion-fisica', 'Educación Física'), unit('arte', 'Arte'),
  ];

  const commonEmsUnits = [
    unit('lengua-literatura', 'Lengua y Literatura'), unit('ingles', 'Inglés'),
    unit('matematica', 'Matemática'), unit('historia', 'Historia'), unit('filosofia', 'Filosofía'),
    unit('educacion-fisica', 'Educación Física'),
  ];

  const specializations = [
    {
      id: 'ciencias-tecnologia', name: 'Ciencias y Tecnología', active: true,
      units: [unit('matematica-ct', 'Matemática-CT'), unit('fisica', 'Física'), unit('quimica', 'Química'), unit('tecnologia-diseno', 'Tecnología y Diseño')],
    },
    {
      id: 'ciencias-vida', name: 'Ciencias de la Vida', active: true,
      units: [unit('matematica-cv', 'Matemática-CV'), unit('biologia', 'Biología'), unit('quimica', 'Química'), unit('fisica', 'Física')],
    },
    {
      id: 'ciencias-sociales-humanidades', name: 'Ciencias Sociales y Humanidades', active: true,
      units: [unit('matematica-csh', 'Matemática-CSH'), unit('historia', 'Historia'), unit('sociologia', 'Sociología'), unit('geografia', 'Geografía'), unit('literatura', 'Literatura')],
    },
    {
      id: 'creativo-artistico', name: 'Creativo Artístico', active: true,
      units: [unit('arte-comunicacion-visual', 'Arte y Comunicación Visual'), unit('musica', 'Música'), unit('teatro', 'Teatro'), unit('literatura', 'Literatura')],
    },
    {
      id: 'general', name: 'General', active: true,
      units: [...commonEmsUnits, unit('ciencias-computacion', 'Ciencias de la Computación')],
    },
  ];

  const secondEmsTracks = specializations.filter(({ id }) => id !== 'general').map((track) => ({
    ...track,
    units: [...commonEmsUnits, ...track.units],
  }));

  const teacherSpecialties = [
    'Astronomía', 'Derecho-Sociología', 'Comunicación Visual', 'Danza', 'Educación Musical',
    'Filosofía', 'Física', 'Historia', 'Idioma Español', 'Portugués', 'Informática', 'Inglés',
    'Italiano', 'Matemática', 'Química', 'Ciencias Biológicas', 'Ciencias Geográficas', 'Literatura',
  ];

  const mathTeacherUnits = {
    '1': [unit('fundamentos-matematica', 'Fundamentos de la Matemática'), unit('geometria-i', 'Geometría I'), unit('didactica-i', 'Didáctica I')],
    '2': [unit('calculo-i', 'Cálculo I'), unit('algebra-lineal', 'Álgebra Lineal'), unit('didactica-ii', 'Didáctica II')],
    '3': [unit('probabilidad-estadistica-ii', 'Probabilidad y Estadística II'), unit('calculo-ii', 'Cálculo II'), unit('didactica-iii', 'Didáctica III')],
    '4': [unit('seminario-egreso', 'Seminario de Egreso'), unit('didactica-iv', 'Didáctica IV')],
  };

  // Las unidades no verificadas se dejan vacías deliberadamente: el flujo ofrece la vía personalizada.
  const genericTeacherUnits = () => [];

  const professorSpecialties = teacherSpecialties.map((name) => {
    const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    return {
      id,
      name,
      active: true,
      plans: [{
        id: 'plan-2023', name: 'Plan 2023', version: '2023', effectiveFrom: 2023, active: true,
        years: ['1', '2', '3', '4'].map((year) => ({
          id: `ano-${year}`, name: `${year}.º año`, order: Number(year), active: true,
          units: name === 'Matemática' ? mathTeacherUnits[year] : genericTeacherUnits(name, year),
        })),
      }],
    };
  });

  const URUGUAY_CATALOG = {
    schemaVersion: '1.0.0',
    updatedAt: '2026-07-25',
    countries: [{
      id: 'uy', code: 'UY', name: 'Uruguay', active: true,
      systems: [
        {
          id: 'secundaria', name: 'Educación Secundaria', subsystem: 'Educación Media', agency: { id: 'dges', name: 'DGES' }, active: true,
          programs: [
            {
              id: 'ebi', name: 'Educación Básica Integrada (EBI)', plan: 'EBI', version: '2023', effectiveFrom: 2023, active: true,
              grades: ['7', '8', '9'].map((grade) => ({ id: `grado-${grade}`, name: `${grade}.º grado`, order: Number(grade), active: true, units: commonEbiUnits })),
            },
            {
              id: 'ems-2023', name: 'Educación Media Superior — Plan EMS 2023', plan: 'EMS', version: '2023', effectiveFrom: 2023, active: true,
              grades: [
                { id: 'ems-1', name: '1.º EMS', order: 1, active: true, units: commonEmsUnits },
                { id: 'ems-2', name: '2.º EMS', order: 2, active: true, trackLabel: 'Trayecto', tracks: secondEmsTracks },
                { id: 'ems-3', name: '3.º EMS', order: 3, active: true, trackLabel: 'Especialización', tracks: specializations },
              ],
            },
          ],
        },
        {
          id: 'formacion-educacion', name: 'Formación en Educación', subsystem: 'Formación en Educación', agency: { id: 'cfe', name: 'CFE' }, active: true,
          careers: [
            {
              id: 'profesorado-media', name: 'Profesorado de Educación Media', active: true,
              specialties: professorSpecialties,
            },
            {
              id: 'maestro-profesor-tecnico', name: 'Maestro/Profesor Técnico', active: true, catalogStatus: 'structure-only',
              specialties: [], plans: [{ id: 'plan-2023', name: 'Plan 2023', version: '2023', active: true, years: [] }],
            },
            {
              id: 'educador-social', name: 'Educador Social', active: true,
              plans: [{ id: 'plan-2023', name: 'Plan 2023', version: '2023', effectiveFrom: 2023, active: true, years: ['1', '2', '3', '4'].map((year) => ({ id: `ano-${year}`, name: `${year}.º año`, order: Number(year), active: true, units: [] })) }],
            },
          ],
        },
      ],
    }],
  };

  const findById = (items, id) => (items || []).find((item) => item.id === id);

  function resolveEducationSelection(selection) {
    const country = findById(URUGUAY_CATALOG.countries, selection.countryId);
    const system = findById(country?.systems, selection.systemId);
    const program = findById(system?.programs, selection.programId);
    const career = findById(system?.careers, selection.careerId);
    const specialty = findById(career?.specialties, selection.specialtyId);
    const plan = findById(specialty?.plans || career?.plans, selection.planId);
    const grade = findById(program?.grades, selection.gradeId);
    const year = findById(plan?.years, selection.yearId);
    const track = findById(grade?.tracks, selection.trackId);
    const curriculumUnit = findById(track?.units || grade?.units || year?.units, selection.unitId);
    return { country, system, program, career, specialty, plan, grade, year, track, curriculumUnit };
  }

  function educationSummary(selection) {
    if (selection.custom) return { title: selection.customLevel || 'Otro curso', detail: selection.customSubject || 'Configuración personalizada', path: ['Uruguay', 'Otro / No aparece mi curso'] };
    const value = resolveEducationSelection(selection);
    const path = [value.country?.name, value.system?.name, value.system?.agency?.name, value.career?.name || value.program?.name, value.specialty?.name, value.plan?.name, value.grade?.name || value.year?.name, value.track?.name, value.curriculumUnit?.name].filter(Boolean);
    return {
      title: value.grade?.name || value.career?.name || 'Curso',
      detail: [value.track?.name || value.specialty?.name, value.year?.name, value.curriculumUnit?.name].filter(Boolean).join(' · '),
      path,
      agency: value.system?.agency,
      plan: value.plan || value.program,
      officialProgram: value.curriculumUnit?.officialProgram,
    };
  }

  const exported = { EDUCATION_CATALOG: URUGUAY_CATALOG, resolveEducationSelection, educationSummary };
  Object.assign(globalScope, exported);
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
