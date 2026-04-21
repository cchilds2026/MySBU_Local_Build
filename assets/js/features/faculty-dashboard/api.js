import { portalApi } from "../../services/portal-api.js";

export function fetchFacultyCourses() {
  return portalApi.getFacultyCourses();
}

export function fetchMyFacultyCourses() {
  return portalApi.getMyFacultyCourses();
}

export function fetchMyFacultyLetters() {
  return portalApi.getMyFacultyLetters();
}

export async function fetchExamPreferenceBySection(sourceSectionId) {
  try {
    return await portalApi.getFacultyPreferenceBySection(sourceSectionId);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function saveExamPreferenceBySection(sourceSectionId, payload) {
  return portalApi.saveFacultyPreference(sourceSectionId, payload);
}

export function createUploadedExam(payload) {
  return portalApi.createUploadedExam(payload);
}

export function fetchExamRequestsBySection(sourceSectionId) {
  return portalApi.getExamRequestsBySection(sourceSectionId);
}

export function fetchExamRequestDetail(examRequestId) {
  return portalApi.getExamRequest(examRequestId);
}

export function fetchUploadedExamsBySection(sourceSectionId) {
  return portalApi.getUploadedExamsBySection(sourceSectionId);
}

export function submitExamFacultyResponse(examRequestId, payload) {
  return portalApi.updateExamFacultyResponse(examRequestId, payload);
}