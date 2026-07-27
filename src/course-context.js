(function courseContextModule(globalScope) {
  function buildCourseContext(course, previousArtifacts = []) {
    if (!course?.id) throw new Error('A course with an id is required.');
    const education = course.education && globalScope.resolveEducationSelection
      ? globalScope.resolveEducationSelection(course.education)
      : {};

    return {
      courseId: course.id,
      course: {
        name: course.name,
        subject: course.subject,
        level: course.level,
        group: course.group,
        country: course.country,
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
        curriculumUnit: education.curriculumUnit?.name || course.subject,
        officialProgram: education.curriculumUnit?.officialProgram || null,
      },
      planning: {
        progress: course.progress,
        nextClass: course.nextClass,
        workedTopics: [...course.workedTopics],
        pendingTopics: [...course.pendingTopics],
      },
      teaching: {
        methodology: course.methodology,
        preferences: course.preferences,
        classDays: [...course.classDays],
        classDurationMinutes: course.classDuration,
      },
      materials: course.materials.map(({ id, name, type, date, size }) => ({ id, name, type, date, size })),
      sessions: course.sessions.map(({ id, date, status, topics, note }) => ({ id, date, status, topics: [...(topics || [])], note })),
      previousArtifacts: previousArtifacts.map(({ id, type, title, createdAt }) => ({ id, type, title, createdAt })),
    };
  }

  globalScope.buildCourseContext = buildCourseContext;
  if (typeof module !== 'undefined') module.exports = { buildCourseContext };
})(typeof globalThis !== 'undefined' ? globalThis : window);
