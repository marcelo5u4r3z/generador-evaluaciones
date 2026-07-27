(function courseContextModule(globalScope) {
  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function buildCourseContext(course, previousArtifacts = []) {
    if (!course?.id) throw new Error('A course with an id is required.');
    const education = course.education && globalScope.resolveEducationSelection
      ? globalScope.resolveEducationSelection(course.education)
      : {};

    const workedTopics = asArray(course.workedTopics);
    const pendingTopics = asArray(course.pendingTopics);
    const classDays = asArray(course.classDays);
    const materials = asArray(course.materials);
    const sessions = asArray(course.sessions);
    const artifacts = asArray(previousArtifacts);

    return {
      courseId: course.id,
      course: {
        name: course.name || '',
        subject: course.subject || '',
        level: course.level || '',
        group: course.group || '',
        country: course.country || 'Uruguay',
      },
      education: {
        system: education.system?.name || null,
        agency: education.system?.agency?.name || null,
        program: education.program?.name || null,
        plan: education.plan?.name || education.program?.plan || null,
        planVersion: education.plan?.version || education.program?.version || null,
        career: education.career?.name || null,
        specialty: education.specialty?.name || null,
        gradeOrYear: education.grade?.name || education.year?.name || null,
        track: education.track?.name || null,
        curriculumUnit: education.curriculumUnit?.name || course.subject || null,
        officialProgram: education.curriculumUnit?.officialProgram || null,
      },
      planning: {
        progress: Number.isFinite(Number(course.progress)) ? Number(course.progress) : null,
        nextClass: course.nextClass || null,
        workedTopics: [...workedTopics],
        pendingTopics: [...pendingTopics],
      },
      teaching: {
        methodology: course.methodology || null,
        preferences: course.preferences || null,
        classDays: [...classDays],
        classDurationMinutes: Number.isFinite(Number(course.classDuration)) ? Number(course.classDuration) : null,
      },
      materials: materials.map(({ id, name, type, date, size } = {}) => ({ id, name, type, date, size })),
      sessions: sessions.map(({ id, date, status, topics, note } = {}) => ({ id, date, status, topics: [...asArray(topics)], note })),
      previousArtifacts: artifacts.map(({ id, type, title, createdAt } = {}) => ({ id, type, title, createdAt })),
    };
  }

  globalScope.buildCourseContext = buildCourseContext;
  if (typeof module !== 'undefined') module.exports = { buildCourseContext };
})(typeof globalThis !== 'undefined' ? globalThis : window);
