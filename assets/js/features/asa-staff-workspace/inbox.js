import { portalApi } from "../../services/portal-api.js";

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
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderInbox(container, items) {
  if (!Array.isArray(items) || items.length === 0) {
    renderEmpty(container, "No ASA workflow items currently need staff action.");
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title || "ASA workflow item");
      const status = escapeHtml(formatStatusLabel(item.status || "new"));
      const source = escapeHtml(formatSourceLabel(item.source_portal || ""));
      const submitterName = escapeHtml(item.submitter_name || "Unknown submitter");
      const submitterEmail = escapeHtml(item.submitter_email || "");
      const summary = escapeHtml(item.summary || "");
      const submittedAt = escapeHtml(item.submitted_at || "");
      const actionHref = escapeAttribute(item.action_href || "#");
      const statusClass = getStatusClass(item.status);

      return `
        <article class="asa-inbox-row">
          <div class="asa-inbox-row__main">
            <div class="asa-inbox-row__topline">
              <strong>${title}</strong>
              <span class="${statusClass}">
                ${status}
              </span>
            </div>

            <p class="asa-inbox-row__meta">
              ${source} · ${submitterName}
              ${submitterEmail ? `· ${submitterEmail}` : ""}
            </p>

            ${summary ? `<p class="asa-inbox-row__summary">${summary}</p>` : ""}

            ${
              submittedAt
                ? `<p class="asa-inbox-row__date">Submitted/updated: ${submittedAt}</p>`
                : ""
            }
          </div>

          <div class="asa-inbox-row__actions">
            <a
              class="button-secondary button-secondary--small"
              href="${actionHref}"
            >
              Open
            </a>
          </div>
        </article>
      `;
    })
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
        count.textContent = String(Array.isArray(items) ? items.length : 0);
      }

      renderInbox(container, items);
    } catch (error) {
      console.warn("ASA inbox could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "ASA inbox could not be loaded. Start the Flask API to view live workflow data."
      );
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
