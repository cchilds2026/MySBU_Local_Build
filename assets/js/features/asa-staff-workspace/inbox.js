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

function formatSourceLabel(source) {
  const labels = {
    student: "Student Portal",
    faculty_staff: "Faculty/Staff Portal",
    student_and_faculty_staff: "Student + Faculty/Staff",
    asa_staff: "ASA Staff Workflow"
  };

  return labels[source] || formatStatusLabel(source);
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "published" ||
    normalized === "scheduled" ||
    normalized === "completed" ||
    normalized === "reviewed"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "submitted" ||
    normalized === "pending" ||
    normalized === "awaiting_upload" ||
    normalized === "in_review" ||
    normalized === "received_by_asa"
  ) {
    return "status-badge status-badge--pending";
  }

  if (
    normalized === "returned" ||
    normalized === "follow_up_needed" ||
    normalized === "late_request" ||
    normalized === "conflict"
  ) {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

function renderEmpty(container, message) {
  container.innerHTML = `<div class="faculty-empty-state">${escapeHtml(message)}</div>`;
}

function renderInbox(container, items) {
  if (!items.length) {
    renderEmpty(container, "No ASA workflow items currently need staff action.");
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="asa-inbox-row">
          <div class="asa-inbox-row__main">
            <div class="asa-inbox-row__topline">
              <strong>${escapeHtml(item.title)}</strong>
              <span class="${getStatusClass(item.status)}">
                ${escapeHtml(formatStatusLabel(item.status))}
              </span>
            </div>

            <p class="asa-inbox-row__meta">
              ${escapeHtml(formatSourceLabel(item.source_portal))}
              · ${escapeHtml(item.submitter_name)}
              ${
                item.submitter_email
                  ? `· ${escapeHtml(item.submitter_email)}`
                  : ""
              }
            </p>

            <p class="asa-inbox-row__summary">
              ${escapeHtml(item.summary)}
            </p>

            ${
              item.submitted_at
                ? `<p class="asa-inbox-row__date">Submitted/updated: ${escapeHtml(item.submitted_at)}</p>`
                : ""
            }
          </div>

          <div class="asa-inbox-row__actions">
            <a class="button-secondary button-secondary--small" href="${escapeHtml(item.action_href)}">
              Open
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

export function initAsaStaffInbox() {
  const container = document.getElementById("asa-staff-inbox-list");
  const count = document.getElementById("asa-staff-inbox-count");
  const refreshButton = document.getElementById("asa-staff-inbox-refresh");

  if (!container) return;

  async function loadInbox() {
    renderEmpty(container, "Loading ASA inbox...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const items = await portalApi.getAsaInbox();

      if (count) {
        count.textContent = String(items.length);
      }

      renderInbox(container, items);
    } catch (error) {
      renderEmpty(container, error.message || "ASA inbox could not be loaded.");
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadInbox);
  }

  loadInbox();
}