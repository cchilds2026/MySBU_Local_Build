import { fetchFacultyCourses, fetchMyFacultyCourses } from "./api.js";
import { facultyCourses as fallbackFacultyCourses } from "./fixtures.js";
import { normalizeFacultyCourse } from "./course-normalizers.js";
import { getCurrentUser } from "../../services/current-user-provider.js";

const FACULTY_COURSE_SOURCE = "mock-current-user";

export async function getCurrentFacultyCourses() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !Array.isArray(currentUser.roles) || !currentUser.roles.includes("faculty")) {
    return [];
  }

  if (FACULTY_COURSE_SOURCE === "demo-fallback") {
    return fallbackFacultyCourses;
  }

  if (FACULTY_COURSE_SOURCE === "api") {
    const records = await fetchFacultyCourses();
    return Array.isArray(records) ? records.map(normalizeFacultyCourse) : [];
  }

  if (FACULTY_COURSE_SOURCE === "api-with-fallback") {
    try {
      const records = await fetchFacultyCourses();
      const normalized = Array.isArray(records)
        ? records.map(normalizeFacultyCourse)
        : [];

      return normalized.length > 0 ? normalized : fallbackFacultyCourses;
    } catch (error) {
      console.error("Failed to load faculty courses from API:", error);
      return fallbackFacultyCourses;
    }
  }

  if (FACULTY_COURSE_SOURCE === "mock-current-user") {
    try {
      const records = await fetchMyFacultyCourses();
      const normalized = Array.isArray(records)
        ? records.map(normalizeFacultyCourse)
        : [];

      return normalized.length > 0 ? normalized : fallbackFacultyCourses;
    } catch (error) {
      console.error("Failed to load current faculty courses:", error);
      return fallbackFacultyCourses;
    }
  }

  return fallbackFacultyCourses;
}