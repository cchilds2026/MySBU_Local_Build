import { portalApi } from "../services/portal-api.js";

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRequestedAccommodations(jsonValue) {
  try {
    const parsed = JSON.parse(jsonValue || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed.join(", ") : "None listed";
  } catch {
    return jsonValue || "None listed";
  }
}

function getStudentIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("student_id") || "";
}

function renderNotFound(container) {
  container.innerHTML = `<div class="faculty-empty-state">Student record not found.</div>`;
}

function buildRequestCard(request) {
  return `
    <article class="staff-record-card">
      <div class="staff-record-card__main">
        <div class="staff-record-card__topline">
          <strong>${request.request_type || "Unknown Request Type"} · ${request.disability_type || "Unknown Disability Type"}</strong>
          <span class="status-badge">${formatStatusLabel(request.workflow_status)}</span>
        </div>
        <p><strong>Submitted:</strong> ${request.submitted_at || "Not available"}</p>
        <p><strong>Docs Status:</strong> ${formatStatusLabel(request.docs_review_status || "")}</p>
        <p><strong>Requested Accommodations:</strong> ${formatRequestedAccommodations(request.requested_accommodations_json)}</p>
        <p><strong>Academic Impact:</strong> ${request.academic_impact || "Not provided"}</p>
        <p><strong>Daily Life Impact:</strong> ${request.daily_life_impact || "Not provided"}</p>
      </div>
    </article>
  `;
}

function renderRecord(container, data) {
  const student = data.student || {};
  const profile = data.portal_profile || {};
  const requests = Array.isArray(data.registration_requests)
    ? data.registration_requests
    : [];

  container.innerHTML = `
    <section class="dashboard-section" id="student-record-profile">
      <div class="dashboard-section__header">
        <div>
          <h2>${student.first_name || ""} ${student.last_name || ""}</h2>
          <p class="modal-text">
            ${student.email || "No email"} · SBU ID ${student.institution_student_id || "Not available"}
          </p>
        </div>
      </div>

      <div class="staff-summary-grid">
        <article class="staff-summary-card">
          <h2>Registration Complete</h2>
          <p class="staff-summary-card__value">
            ${profile.student_registration_complete ? "Yes" : "No"}
          </p>
        </article>

        <article class="staff-summary-card">
          <h2>Completed At</h2>
          <p class="staff-summary-card__value">
            ${profile.student_registration_completed_at || "—"}
          </p>
        </article>

        <article class="staff-summary-card">
          <h2>Requests</h2>
          <p class="staff-summary-card__value">${requests.length}</p>
        </article>
      </div>
    </section>

    <section class="dashboard-section" id="student-record-requests">
      <div class="dashboard-section__header">
        <div>
          <h2>Registration Requests</h2>
          <p class="modal-text">All submitted registration/intake requests for this student.</p>
        </div>
      </div>

      <div class="staff-record-list">
        ${
          requests.length
            ? requests.map(buildRequestCard).join("")
            : '<div class="faculty-empty-state">No registration requests found for this student.</div>'
        }
      </div>
    </section>
  `;
}

export async function initAsaStudentRecord() {
  const container = document.getElementById("asa-student-record-shell");
  if (!container) return;

  const studentId = getStudentIdFromUrl();
  if (!studentId) {
    renderNotFound(container);
    return;
  }

  try {
    const data = await portalApi.getStudentDirectoryDetail(studentId);
    renderRecord(container, data);
  } catch (error) {
    console.error("Failed to load student record:", error);
    renderNotFound(container);
  }
}