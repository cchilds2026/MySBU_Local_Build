import { apiConfig } from "../data/site-config.js";

async function request(path, options = {}) {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error || `API returned ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const portalApi = {
  health() {
    return request("/health");
  },

  getCurrentUser() {
    return request("/me");
  },

  getFacultyCourses() {
    return request("/faculty-courses");
  },

  getMyFacultyCourses() {
    return request("/faculty-courses/me");
  },

  getMyFacultyLetters() {
    return request("/faculty-letters/me");
  },

  getExamRequests(params = {}) {
    return request(`/exam-requests${buildQuery(params)}`);
  },

  getExamRequestsBySection(sourceSectionId) {
    return request(
      `/exam-requests${buildQuery({ source_section_id: sourceSectionId })}`
    );
  },

  getExamRequest(examRequestId) {
    return request(`/exam-requests/${encodeURIComponent(examRequestId)}`);
  },

  updateExamStaffStatus(examRequestId, body) {
    return request(
      `/exam-requests/${encodeURIComponent(examRequestId)}/staff-status`,
      {
        method: "PATCH",
        body
      }
    );
  },

  updateExamFacultyResponse(examRequestId, body) {
    return request(
      `/exam-requests/${encodeURIComponent(examRequestId)}/faculty-response`,
      {
        method: "PATCH",
        body
      }
    );
  },

  getFacultyPreferenceBySection(sourceSectionId) {
    return request(
      `/faculty-exam-preferences${buildQuery({
        source_section_id: sourceSectionId
      })}`
    );
  },

  saveFacultyPreference(sourceSectionId, body) {
    return request(
      `/faculty-exam-preferences/${encodeURIComponent(sourceSectionId)}`,
      {
        method: "PATCH",
        body
      }
    );
  },

  getUploadedExams(params = {}) {
    return request(`/uploaded-exams${buildQuery(params)}`);
  },

  getUploadedExamsBySection(sourceSectionId) {
    return request(
      `/uploaded-exams${buildQuery({ source_section_id: sourceSectionId })}`
    );
  },

  createUploadedExam(body) {
    return request("/uploaded-exams", {
      method: "POST",
      body
    });
  },

  getMyDashboard() {
    return request("/dashboard/me");
  },

  getMyAccommodationSummary() {
    return request("/workflows/accommodations/me");
  },

  getMyHousingSummary() {
    return request("/workflows/housing/me");
  },

  getMyStudentSuccessSummary() {
    return request("/workflows/student-success/me");
  }
};