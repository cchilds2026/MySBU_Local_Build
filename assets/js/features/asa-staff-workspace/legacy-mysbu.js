import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function formatStudentName(record) {
  const fullName = `${record.student_first_name || ""} ${record.student_last_name || ""}`.trim();
  return fullName || "Unknown student";
}

function renderSubmission(record) {
  const studentName = escapeHtml(formatStudentName(record));
  const sourceFormName = escapeHtml(record.source_form_name || "Legacy MySBU form");
  const sourceSystem = escapeHtml(record.source_system || "legacy");
  const studentIdentifier = escapeHtml(record.student_identifier || "");
  const studentEmail = escapeHtml(record.student_email || "");
  const rawStatus = escapeHtml(record.raw_status || "No legacy status");
  const submittedAt = escapeHtml(record.submitted_at || "Date not available");
  const sourceUrl = escapeHtml(record.source_url || "");

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="status-badge">${sourceSystem}</span>
          <span class="status-badge status-badge--read">${rawStatus}</span>
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${studentName}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${studentIdentifier ? `${studentIdentifier} · ` : ""}${studentEmail}
        </p>

        <p class="asa-inbox-row__summary">
          ${sourceFormName}
        </p>

        <p class="asa-inbox-row__date">
          <strong>Submitted:</strong> ${submittedAt}
        </p>

        ${
          sourceUrl
            ? `<p class="asa-inbox-row__summary"><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Open source record</a></p>`
            : ""
        }
      </div>
    </article>
  `;
}

function buildParams(form) {
  if (!form) return { limit: "25" };

  const formData = new FormData(form);

  return {
    student_identifier: String(formData.get("student_identifier") || "").trim(),
    student_email: String(formData.get("student_email") || "").trim(),
    source_form_name: String(formData.get("source_form_name") || "").trim(),
    limit: String(formData.get("limit") || "25").trim() || "25"
  };
}

export function initLegacyMysbuPanel() {
  const form = document.getElementById("asa-legacy-mysbu-form");
  const list = document.getElementById("asa-legacy-mysbu-list");
  const count = document.getElementById("asa-legacy-mysbu-count");
  const refreshButton = document.getElementById("asa-legacy-mysbu-refresh");
  const status = document.getElementById("asa-legacy-mysbu-status");

  if (!list) return;

  async function loadLegacySubmissions() {
    renderEmpty(list, "Loading legacy MySBU records...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    if (status) {
      status.textContent = "Loading";
      status.className = "status-badge status-badge--pending";
    }

    try {
      const payload = await portalApi.getLegacyMysbuFormSubmissions(buildParams(form));
      const records = Array.isArray(payload?.records) ? payload.records : [];

      if (count) {
        count.textContent = String(records.length);
      }

      if (status) {
        status.textContent = payload?.integration_status === "configured" ? "Configured" : "Ready";
        status.className = "status-badge status-badge--success";
      }

      if (!records.length) {
        renderEmpty(list, "No legacy MySBU records matched the current filters.");
        return;
      }

      list.innerHTML = records.map(renderSubmission).join("");
    } catch (error) {
      console.warn("Legacy MySBU records could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      if (status) {
        status.textContent = error.payload?.integration_status === "not_configured"
          ? "Not configured"
          : "Unavailable";
        status.className = "status-badge status-badge--read";
      }

      renderEmpty(
        list,
        error.payload?.integration_status === "not_configured"
          ? "Legacy MySBU integration is not configured. Install the SQL view contract or have IT map asa.v_legacy_mysbu_form_submission."
          : "Legacy MySBU records could not be loaded. Start the Flask API and confirm database access."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      loadLegacySubmissions();
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadLegacySubmissions);
  }

  loadLegacySubmissions();
}
