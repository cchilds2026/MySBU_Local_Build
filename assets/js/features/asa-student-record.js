import { portalApi } from "../services/portal-api.js";
import { formatEasternDateTime } from "../core/date-formatters.js";

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
    <article class="staff-record-card" data-request-id="${request.student_registration_request_id}">
      <div class="staff-record-card__main">
        <div class="staff-record-card__topline">
          <strong>${request.request_type || "Unknown Request Type"} · ${request.disability_type || "Unknown Disability Type"}</strong>
          <span class="status-badge">${formatStatusLabel(request.workflow_status)}</span>
        </div>
        <p><strong>Submitted:</strong> ${formatEasternDateTime(request.submitted_at)}</p>
        <p><strong>Docs Status:</strong> ${formatStatusLabel(request.docs_review_status || "")}</p>
        <p><strong>Requested Accommodations:</strong> ${formatRequestedAccommodations(request.requested_accommodations_json)}</p>
        <p><strong>Academic Impact:</strong> ${request.academic_impact || "Not provided"}</p>
        <p><strong>Daily Life Impact:</strong> ${request.daily_life_impact || "Not provided"}</p>
      </div>

      <div class="staff-record-card__actions">
        <button
          type="button"
          class="button-secondary"
          data-action="delete-registration-request"
          data-request-id="${request.student_registration_request_id}"
        >
          Delete Request
        </button>
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

  const lifecycleStatus = student.lifecycle_status || "active";
  const academicLevel = student.academic_level || "undergraduate";

  container.innerHTML = `
    <section class="dashboard-section" id="student-record-profile">
      <div class="dashboard-section__header">
        <div>
          <h2>${student.first_name || ""} ${student.last_name || ""}</h2>
          <p class="modal-text">
            ${student.email || "No email"} · SBU ID ${student.institution_student_id || "Not available"}
          </p>
          <p class="modal-text">
            Level: ${formatStatusLabel(academicLevel)} · Status: ${formatStatusLabel(lifecycleStatus)}
          </p>
        </div>
      </div>

      <div id="student-record-message" class="form-message" hidden></div>

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
            ${formatEasternDateTime(profile.student_registration_completed_at)}
          </p>
        </article>

        <article class="staff-summary-card">
          <h2>Requests</h2>
          <p class="staff-summary-card__value">${requests.length}</p>
        </article>
      </div>

      <div class="staff-record-card__actions" style="margin-top: 1rem; gap: 0.75rem; display: flex; flex-wrap: wrap;">
        <button type="button" class="button-secondary" data-action="move-to-undergraduate">
          Set Undergraduate
        </button>
        <button type="button" class="button-secondary" data-action="move-to-graduate">
          Set Graduate
        </button>
        ${
          lifecycleStatus === "archived"
            ? `
          <button type="button" class="button-secondary" data-action="restore-student">
            Restore Student
          </button>
        `
            : `
          <button type="button" class="button-secondary" data-action="archive-student">
            Archive Student
          </button>
        `
        }
        <button type="button" class="button-secondary" data-action="delete-student">
          Delete Student Record
        </button>
      </div>

      ${
        student.archived_at
          ? `
        <p class="modal-text" style="margin-top: 1rem;">
          Archived at: ${formatEasternDateTime(student.archived_at)} · Retain until: ${formatEasternDateTime(student.archive_delete_after_at)}
        </p>
      `
          : ""
      }
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

function showMessage(container, type, text) {
  const message = container.querySelector("#student-record-message");
  if (!message) return;

  message.hidden = false;
  message.className = `form-message form-message--${type}`;
  message.textContent = text;
}

async function loadStudentRecord(container, studentId) {
  const data = await portalApi.getStudentDirectoryDetail(studentId);
  renderRecord(container, data);
}

function attachRecordActions(container, studentId) {
  container.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.getAttribute("data-action");
    const requestId = actionButton.getAttribute("data-request-id");

    try {
      if (action === "delete-registration-request" && requestId) {
        const confirmed = window.confirm(
          "Delete this registration request? If this is the student's last request, their registration-complete status will also be reset."
        );
        if (!confirmed) return;

        actionButton.disabled = true;
        actionButton.textContent = "Deleting...";

        await portalApi.deleteStudentRegistrationRequest(requestId, {
          deleted_by_user_id: "asa_staff:record_cleanup"
        });

        await loadStudentRecord(container, studentId);
        showMessage(container, "success", "Registration request deleted.");
        return;
      }

      if (action === "move-to-undergraduate") {
        await portalApi.updateStudentAcademicLevel(studentId, {
          academic_level: "undergraduate",
          acted_by_user_id: "asa_staff:student_lifecycle"
        });
        await loadStudentRecord(container, studentId);
        showMessage(container, "success", "Student moved to undergraduate.");
        return;
      }

      if (action === "move-to-graduate") {
        await portalApi.updateStudentAcademicLevel(studentId, {
          academic_level: "graduate",
          acted_by_user_id: "asa_staff:student_lifecycle"
        });
        await loadStudentRecord(container, studentId);
        showMessage(container, "success", "Student moved to graduate.");
        return;
      }

      if (action === "archive-student") {
        const confirmed = window.confirm(
          "Archive this student record? The record will be retained for 7 years from the archive date."
        );
        if (!confirmed) return;

        await portalApi.archiveStudentRecord(studentId, {
          acted_by_user_id: "asa_staff:student_archive"
        });
        await loadStudentRecord(container, studentId);
        showMessage(container, "success", "Student archived.");
        return;
      }

      if (action === "restore-student") {
        await portalApi.restoreStudentRecord(studentId, {
          acted_by_user_id: "asa_staff:student_restore"
        });
        await loadStudentRecord(container, studentId);
        showMessage(container, "success", "Student restored to active.");
        return;
      }

      if (action === "delete-student") {
        const confirmed = window.confirm(
          "Delete this student record from the application? This should only be used for test data or exceptional staff cleanup."
        );
        if (!confirmed) return;

        await portalApi.deleteStudentRecord(studentId, {
          acted_by_user_id: "asa_staff:student_delete",
          deleted_reason: "staff cleanup"
        });

        window.location.href = "/pages/asa-student-directory.html";
      }
    } catch (error) {
      console.error("Student record action failed:", error);
      showMessage(container, "error", error.message || "Could not complete student record action.");
    }
  });
}

export async function initAsaStudentRecord() {
  const container = document.getElementById("asa-student-record-shell");
  if (!container) return;

  const studentId = getStudentIdFromUrl();
  if (!studentId) {
    renderNotFound(container);
    return;
  }

  attachRecordActions(container, studentId);

  try {
    await loadStudentRecord(container, studentId);
  } catch (error) {
    console.error("Failed to load student record:", error);
    renderNotFound(container);
  }
}