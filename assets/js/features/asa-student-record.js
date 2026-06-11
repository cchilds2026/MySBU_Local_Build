import { portalApi } from "../services/portal-api.js";
import { formatEasternDateTime } from "../core/date-formatters.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

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
  container.innerHTML = `<div class="faculty-empty-state">Student profile not found.</div>`;
}

function getMostRecentRequest(requests) {
  if (!requests.length) return null;

  return [...requests].sort((a, b) => {
    const aDate = new Date(a.submitted_at || a.updated_at || 0).getTime();
    const bDate = new Date(b.submitted_at || b.updated_at || 0).getTime();
    return bDate - aDate;
  })[0];
}

function getCurrentStage(profile, requests) {
  const latestRequest = getMostRecentRequest(requests);
  const docsStatus = String(latestRequest?.docs_review_status || "").toLowerCase();
  const workflowStatus = String(latestRequest?.workflow_status || "").toLowerCase();

  if (!profile.student_registration_complete && !requests.length) {
    return "Not Registered";
  }

  if (["awaiting_upload", "pending", "follow_up_needed"].includes(docsStatus)) {
    return "Documentation";
  }

  if (["submitted", "in_review", "returned"].includes(workflowStatus)) {
    return "Review / Intake";
  }

  if (["approved", "completed"].includes(workflowStatus)) {
    return "Active Support";
  }

  return requests.length ? "Open Case" : "Registered";
}

function getNextAction(profile, requests) {
  const latestRequest = getMostRecentRequest(requests);
  const docsStatus = String(latestRequest?.docs_review_status || "").toLowerCase();
  const workflowStatus = String(latestRequest?.workflow_status || "").toLowerCase();

  if (!profile.student_registration_complete && !requests.length) {
    return "Confirm whether the student needs to complete the registration form before ASA can begin review.";
  }

  if (["awaiting_upload", "pending"].includes(docsStatus)) {
    return "Check whether documentation has been submitted or whether ASA needs to follow up with the student.";
  }

  if (docsStatus === "follow_up_needed" || workflowStatus === "returned") {
    return "Review the follow-up reason and contact the student with the specific missing information.";
  }

  if (workflowStatus === "submitted") {
    return "Review the newest registration request and decide whether it can move into intake.";
  }

  if (workflowStatus === "in_review") {
    return "Continue staff review, record notes, and determine the next decision point.";
  }

  if (["approved", "completed"].includes(workflowStatus)) {
    return "Confirm letters, exam supports, and related services are aligned with the approved accommodations.";
  }

  return "Review the latest case details and determine the next staff action.";
}

function getStatusBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "completed", "reviewed"].includes(normalized)) {
    return "status-badge status-badge--success";
  }

  if (["submitted", "pending", "awaiting_upload", "in_review"].includes(normalized)) {
    return "status-badge status-badge--pending";
  }

  if (["returned", "follow_up_needed", "archived"].includes(normalized)) {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

function buildCaseCard(request, index) {
  const workflowStatus = request.workflow_status || "open";
  const docsStatus = request.docs_review_status || "not provided";
  const requestTitle = `${request.request_type || "Accommodation Request"} · ${request.disability_type || "Disability Type Not Listed"}`;

  return `
    <article class="navigate-case-card" data-request-id="${escapeAttribute(request.student_registration_request_id)}">
      <div class="navigate-case-card__header">
        <h3>${escapeHtml(requestTitle)}</h3>
        <span class="${getStatusBadgeClass(workflowStatus)}">${escapeHtml(formatStatusLabel(workflowStatus))}</span>
      </div>

      <p><strong>Case ${index + 1} submitted:</strong> ${escapeHtml(formatEasternDateTime(request.submitted_at))}</p>
      <p><strong>Documentation:</strong> ${escapeHtml(formatStatusLabel(docsStatus))}</p>
      <p><strong>Requested supports:</strong> ${escapeHtml(formatRequestedAccommodations(request.requested_accommodations_json))}</p>
      <p><strong>Academic impact:</strong> ${escapeHtml(request.academic_impact || "Not provided")}</p>
      <p><strong>Daily life impact:</strong> ${escapeHtml(request.daily_life_impact || "Not provided")}</p>

      <div class="navigate-case-card__actions">
        <button
          type="button"
          class="button-secondary button-secondary--small"
          data-action="delete-registration-request"
          data-request-id="${escapeAttribute(request.student_registration_request_id)}"
        >
          Delete Test Request
        </button>
      </div>
    </article>
  `;
}

function buildFileCard(request, index) {
  const docsStatus = request.docs_review_status || "not provided";
  const fileName = request.document_file_name || request.documentation_file_name || `Documentation item ${index + 1}`;

  return `
    <article class="navigate-file-card">
      <div class="navigate-file-card__header">
        <h3>${escapeHtml(fileName)}</h3>
        <span class="${getStatusBadgeClass(docsStatus)}">${escapeHtml(formatStatusLabel(docsStatus))}</span>
      </div>
      <p><strong>Related case:</strong> ${escapeHtml(request.request_type || "Registration request")}</p>
      <p><strong>Submitted:</strong> ${escapeHtml(formatEasternDateTime(request.submitted_at))}</p>
      <p><strong>Review cue:</strong> Determine whether documentation is sufficient, incomplete, or needs student follow-up.</p>
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
  const latestRequest = getMostRecentRequest(requests);
  const currentStage = getCurrentStage(profile, requests);
  const nextAction = getNextAction(profile, requests);
  const studentName = `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Unknown student";

  container.innerHTML = `
    <div class="navigate-record-manager">
      <section class="navigate-record-header" id="student-profile-summary" aria-labelledby="student-profile-name">
        <div class="navigate-record-header__topline">
          <div>
            <p class="eyebrow">Student profile</p>
            <h2 id="student-profile-name">${escapeHtml(studentName)}</h2>
            <p class="navigate-record-header__meta">
              ${escapeHtml(student.email || "No email")} · SBU ID ${escapeHtml(student.institution_student_id || "Not available")}
            </p>
            <p class="navigate-record-header__meta">
              Academic level: ${escapeHtml(formatStatusLabel(academicLevel))} · Lifecycle: ${escapeHtml(formatStatusLabel(lifecycleStatus))}
            </p>
          </div>
          <span class="${getStatusBadgeClass(lifecycleStatus)}">${escapeHtml(formatStatusLabel(lifecycleStatus))}</span>
        </div>

        <p class="navigate-record-header__next-action">
          <strong>Recommended next staff action:</strong> ${escapeHtml(nextAction)}
        </p>
      </section>

      <div id="student-record-message" class="form-message" hidden></div>

      <section class="navigate-signal-grid" aria-label="Student support signals">
        <article class="navigate-signal-card">
          <h3>Current Stage</h3>
          <p class="navigate-signal-card__value">${escapeHtml(currentStage)}</p>
          <p class="navigate-signal-card__meta">Plain-language view of where the student appears to be in the process.</p>
        </article>

        <article class="navigate-signal-card">
          <h3>Registration</h3>
          <p class="navigate-signal-card__value">${profile.student_registration_complete ? "Complete" : "Incomplete"}</p>
          <p class="navigate-signal-card__meta">Completed: ${escapeHtml(formatEasternDateTime(profile.student_registration_completed_at))}</p>
        </article>

        <article class="navigate-signal-card">
          <h3>Open Cases</h3>
          <p class="navigate-signal-card__value">${requests.length}</p>
          <p class="navigate-signal-card__meta">Registration/intake requests attached to this student.</p>
        </article>

        <article class="navigate-signal-card">
          <h3>Latest Status</h3>
          <p class="navigate-signal-card__value">${escapeHtml(formatStatusLabel(latestRequest?.workflow_status || "None"))}</p>
          <p class="navigate-signal-card__meta">Most recent request status.</p>
        </article>
      </section>

      <div class="navigate-workspace-layout">
        <div>
          <section class="navigate-panel" id="student-profile-cases" aria-labelledby="student-profile-cases-title">
            <div class="navigate-panel__header">
              <div>
                <h2 id="student-profile-cases-title">Cases / Requests</h2>
                <p>Registration and intake work grouped as student-centered cases.</p>
              </div>
            </div>
            <div class="navigate-case-list">
              ${
                requests.length
                  ? requests.map(buildCaseCard).join("")
                  : '<div class="faculty-empty-state">No registration or intake cases found for this student.</div>'
              }
            </div>
          </section>

          <section class="navigate-panel" id="student-profile-files" aria-labelledby="student-profile-files-title">
            <div class="navigate-panel__header">
              <div>
                <h2 id="student-profile-files-title">Files / Documentation</h2>
                <p>Documentation cues related to this student's open or historical cases.</p>
              </div>
            </div>
            <div class="navigate-file-list">
              ${
                requests.length
                  ? requests.map(buildFileCard).join("")
                  : '<div class="faculty-empty-state">No documentation records found for this student.</div>'
              }
            </div>
          </section>
        </div>

        <aside>
          <section class="navigate-panel navigate-action-panel" id="student-profile-actions" aria-labelledby="student-profile-actions-title">
            <div class="navigate-panel__header">
              <div>
                <h2 id="student-profile-actions-title">Staff Actions</h2>
                <p>Keep high-impact actions separate from profile details.</p>
              </div>
            </div>

            <div class="navigate-action-panel__group">
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
            </div>

            <div class="navigate-action-panel__danger">
              <p><strong>Cleanup-only action.</strong> Use delete only for test data or exceptional staff cleanup.</p>
              <button type="button" class="button-secondary" data-action="delete-student">
                Delete Student Record
              </button>
            </div>
          </section>

          <section class="navigate-panel" aria-labelledby="student-profile-timeline-title">
            <div class="navigate-panel__header">
              <div>
                <h2 id="student-profile-timeline-title">Timeline / Notes</h2>
                <p>Prototype timeline based on available request records.</p>
              </div>
            </div>
            <div class="navigate-timeline-list">
              ${
                requests.length
                  ? requests
                      .map(
                        (request) => `
                          <article class="navigate-timeline-item">
                            <h3>${escapeHtml(formatStatusLabel(request.workflow_status || "Request Updated"))}</h3>
                            <p>${escapeHtml(formatEasternDateTime(request.submitted_at))}</p>
                            <p>${escapeHtml(request.request_type || "Registration request")} submitted or updated.</p>
                          </article>
                        `
                      )
                      .join("")
                  : '<div class="faculty-empty-state">No timeline events are available yet.</div>'
              }
            </div>
          </section>
        </aside>
      </div>

      ${
        student.archived_at
          ? `
        <p class="modal-text">
          Archived at: ${escapeHtml(formatEasternDateTime(student.archived_at))} · Retain until: ${escapeHtml(formatEasternDateTime(student.archive_delete_after_at))}
        </p>
      `
          : ""
      }
    </div>
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
    console.error("Failed to load student profile:", error);
    renderNotFound(container);
  }
}
