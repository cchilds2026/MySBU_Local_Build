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
    credentials: "include",
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

  getMyStudentRegistrationStatus() {
    return request("/me/student-registration-status");
  },

  saveMyStudentRegistrationStatus(body) {
    return request("/me/student-registration-status", {
      method: "PATCH",
      body
    });
  },

  getStudentRegistrationRequests(params = {}) {
    return request(`/student-registration-requests${buildQuery(params)}`);
  },

  getMyStudentRegistrationRequests() {
    return request("/student-registration-requests/me");
  },

  getStudentRegistrationRequest(studentRegistrationRequestId) {
    return request(
      `/student-registration-requests/${encodeURIComponent(studentRegistrationRequestId)}`
    );
  },

  createStudentRegistrationRequest(body) {
    return request("/student-registration-requests", {
      method: "POST",
      body
    });
  },

  updateStudentRegistrationRequestStatus(studentRegistrationRequestId, body) {
    return request(
      `/student-registration-requests/${encodeURIComponent(studentRegistrationRequestId)}/status`,
      {
        method: "PATCH",
        body
      }
    );
  },

  deleteStudentRegistrationRequest(studentRegistrationRequestId, body = {}) {
    return request(
      `/student-registration-requests/${encodeURIComponent(studentRegistrationRequestId)}`,
      {
        method: "DELETE",
        body
      }
    );
  },

  getAsaLetterApprovals(params = {}) {
    return request(`/asa-letter-approvals${buildQuery(params)}`);
  },

  getAsaLetterApproval(asaLetterRequestId) {
    return request(`/asa-letter-approvals/${encodeURIComponent(asaLetterRequestId)}`);
  },

  updateAsaLetterApprovalStatus(asaLetterRequestId, body) {
    return request(
      `/asa-letter-approvals/${encodeURIComponent(asaLetterRequestId)}/status`,
      {
        method: "PATCH",
        body
      }
    );
  },

  getDocumentationQueue(params = {}) {
    return request(`/documentation-queue${buildQuery(params)}`);
  },

  updateStudentRegistrationRequestDocsStatus(studentRegistrationRequestId, body) {
    return request(
      `/student-registration-requests/${encodeURIComponent(studentRegistrationRequestId)}/docs-status`,
      {
        method: "PATCH",
        body
      }
    );
  },

  getStudentsDirectory(params = {}) {
    return request(`/students-directory${buildQuery(params)}`);
  },

  getStudentDirectoryDetail(studentId) {
    return request(`/students-directory/${encodeURIComponent(studentId)}`);
  },

  updateStudentAcademicLevel(studentId, body) {
    return request(`/students-directory/${encodeURIComponent(studentId)}/academic-level`, {
      method: "PATCH",
      body
    });
  },

  archiveStudentRecord(studentId, body) {
    return request(`/students-directory/${encodeURIComponent(studentId)}/archive`, {
      method: "PATCH",
      body
    });
  },

  restoreStudentRecord(studentId, body) {
    return request(`/students-directory/${encodeURIComponent(studentId)}/restore`, {
      method: "PATCH",
      body
    });
  },

  deleteStudentRecord(studentId, body = {}) {
    return request(`/students-directory/${encodeURIComponent(studentId)}`, {
      method: "DELETE",
      body
    });
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

  deleteExamRequest(examRequestId, body = {}) {
    return request(`/exam-requests/${encodeURIComponent(examRequestId)}`, {
      method: "DELETE",
      body
    });
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

  getAsaInbox() {
    return request("/asa/inbox");
  },

  getPublishedAsaResources(params = {}) {
    return request(`/asa/resources${buildQuery(params)}`);
  },

  getAsaResourcesAdmin() {
    return request("/asa/resources/admin");
  },

  createAsaResource(body) {
    return request("/asa/resources", {
      method: "POST",
      body
    });
  },

  updateAsaResource(resourceId, body) {
    return request(`/asa/resources/${encodeURIComponent(resourceId)}`, {
      method: "PATCH",
      body
    });
  },

  publishAsaResource(resourceId) {
    return request(`/asa/resources/${encodeURIComponent(resourceId)}/publish`, {
      method: "PATCH",
      body: {}
    });
  },

  archiveAsaResource(resourceId) {
    return request(`/asa/resources/${encodeURIComponent(resourceId)}/archive`, {
      method: "PATCH",
      body: {}
    });
  }
};