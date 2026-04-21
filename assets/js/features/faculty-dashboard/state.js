export function createFacultyDashboardState() {
  return {
    selectedCourseId: null,
    facultyCourses: [],
    facultyLetters: [],
    facultyExamRequestsCache: [],
    facultyUploadedExamsCache: [],
    facultyExamPreferencesCache: []
  };
}

export function getCourseById(facultyCourses, courseId) {
  return facultyCourses.find((course) => course.id === courseId) || null;
}

export function getPreferenceByCourseId(preferences, courseId) {
  return preferences.find((preference) => preference.courseId === courseId) || null;
}