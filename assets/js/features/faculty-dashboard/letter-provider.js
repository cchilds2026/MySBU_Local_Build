import { fetchMyFacultyLetters } from "./api.js";
import { facultyLetters as fallbackFacultyLetters } from "./fixtures.js";
import { getCurrentUser } from "../../services/current-user-provider.js";

const FACULTY_LETTER_SOURCE = "api-with-fallback";

function normalizeLetter(record) {
  return {
    id: record.faculty_letter_id,
    courseId: record.source_section_id,
    title: record.title,
    receivedAt: record.received_at,
    status: record.status,
    studentName: record.student_name,
    studentId: record.student_id,
    studentEmail: record.student_email,
    accommodations: Array.isArray(record.accommodations)
      ? record.accommodations
      : [],
    summary: record.summary || ""
  };
}

export async function getCurrentFacultyLetters() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !Array.isArray(currentUser.roles) || !currentUser.roles.includes("faculty")) {
    return [];
  }

  if (FACULTY_LETTER_SOURCE === "demo-fallback") {
    return fallbackFacultyLetters.map((record) => ({ ...record }));
  }

  if (FACULTY_LETTER_SOURCE === "api") {
    const records = await fetchMyFacultyLetters();
    return Array.isArray(records) ? records.map(normalizeLetter) : [];
  }

  if (FACULTY_LETTER_SOURCE === "api-with-fallback") {
    try {
      const records = await fetchMyFacultyLetters();
      const normalized = Array.isArray(records)
        ? records.map(normalizeLetter)
        : [];

      return normalized.length > 0
        ? normalized
        : fallbackFacultyLetters.map((record) => ({ ...record }));
    } catch (error) {
      console.error("Failed to load faculty letters:", error);
      return fallbackFacultyLetters.map((record) => ({ ...record }));
    }
  }

  return fallbackFacultyLetters.map((record) => ({ ...record }));
}