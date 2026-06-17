import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "ready_to_send" || normalized === "sent") {
    return "status-badge status-badge--success";
  }

  if (normalized === "requested" || normalized === "pending_staff_review") {
    return "status-badge status-badge--pending";
  }

  if (normalized === "cancelled" || normalized === "superseded") {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

function formatStudentName(request) {
  const firstName = request.student_first_name || "";
  const lastName = request.student_last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Unknown student";
}

function formatInstructorName(request) {
  const firstName = request.instructor_first_name || "";
  const lastName = request.instructor_last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Instructor not listed";
}

function formatCourseLabel(request) {
  const subjectCode = request.subject_code || "";
  const courseNumber = request.course_number || "";
  const courseTitle = request.course_title || "";
  const sectionCode = request.section_code || "";

  const courseCode = `${subjectCode} ${courseNumber}`.trim();
  const titlePart = courseTitle ? ` — ${courseTitle}` : "";
  const sectionPart = sectionCode ? ` (${sectionCode})` : "";

  return `${courseCode || "Course"}${titlePart}${sectionPart}`;
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderDateLine(label, value) {
  if (!value) return "";

  return `
    <p class="asa-inbox-row__date">
      <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
    </p>
  `;
}

function renderWorkflowLetterRequest(request) {
  const studentName = escapeHtml(formatStudentName(request));
  const studentEmail = escapeHtml(request.student_email || "");
  const institutionStudentId = escapeHtml(request.institution_student_id || "");
  const courseLabel = escapeHtml(formatCourseLabel(request));
  const termName = escapeHtml(request.term_name || request.term_code || "");
  const instructorName = escapeHtml(formatInstructorName(request));
  const instructorEmail = escapeHtml(request.instructor_email || "");
  const status = escapeHtml(formatStatusLabel(request.status || "requested"));
  const statusClass = getStatusClass(request.status);
  const staffNotes = escapeHtml(request.staff_notes || "");
  const accommodationLetterId = escapeHtml(request.accommodation_letter_id || "");
  const acknowledged = request.student_acknowledged ? "Acknowledged" : "Not acknowledged";

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="${statusClass}">${status}</span>
          <span class="status-badge">${escapeHtml(acknowledged)}</span>
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${studentName}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${institutionStudentId ? `${institutionStudentId} · ` : ""}${studentEmail}
        </p>

        <p class="asa-inbox-row__summary">
          ${courseLabel}${termName ? ` · ${termName}` : ""}
        </p>

        <p class="asa-inbox-row__summary">
          Instructor: ${instructorName}${instructorEmail ? ` · ${instructorEmail}` : ""}
        </p>

        ${accommodationLetterId ? `<p class="asa-inbox-row__summary">Linked letter: ${accommodationLetterId}</p>` : ""}
        ${staffNotes ? `<p class="asa-inbox-row__summary">${staffNotes}</p>` : ""}

        ${renderDateLine("Requested", request.requested_at)}
        ${renderDateLine("Reviewed", request.reviewed_at)}
      </div>
    </article>
  `;
}

function renderWorkflowLetterRequests(container, requests) {
  if (!Array.isArray(requests) || requests.length === 0) {
    renderEmpty(container, "No workflow letter requests are currently available.");
    return;
  }

  container.innerHTML = requests.map(renderWorkflowLetterRequest).join("");
}

export function initWorkflowLetterRequestsPanel() {
  const container = document.getElementById("asa-workflow-letter-request-list");
  const count = document.getElementById("asa-workflow-letter-request-count");
  const refreshButton = document.getElementById("asa-workflow-letter-request-refresh");

  if (!container) return;

  async function loadWorkflowLetterRequests() {
    renderEmpty(container, "Loading workflow letter requests...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const requests = await portalApi.getWorkflowAccommodationLetterRequests();

      if (count) {
        count.textContent = String(Array.isArray(requests) ? requests.length : 0);
      }

      renderWorkflowLetterRequests(container, requests);
    } catch (error) {
      console.warn("Workflow letter requests could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "Workflow letter requests could not be loaded. Start the Flask API to view live letter request data."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadWorkflowLetterRequests);
  }

  loadWorkflowLetterRequests();
}
