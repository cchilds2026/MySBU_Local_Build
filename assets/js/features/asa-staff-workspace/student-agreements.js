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

  if (normalized === "signed" || normalized === "waived") {
    return "status-badge status-badge--success";
  }

  if (normalized === "pending") {
    return "status-badge status-badge--pending";
  }

  if (normalized === "expired" || normalized === "revoked") {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

function formatStudentName(agreement) {
  const firstName = agreement.student_first_name || "";
  const lastName = agreement.student_last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "Unknown student";
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

function renderStudentAgreement(agreement) {
  const studentName = escapeHtml(formatStudentName(agreement));
  const studentEmail = escapeHtml(agreement.student_email || "");
  const institutionStudentId = escapeHtml(agreement.institution_student_id || "");
  const agreementType = escapeHtml(formatStatusLabel(agreement.agreement_type || "agreement"));
  const status = escapeHtml(formatStatusLabel(agreement.status || "pending"));
  const statusClass = getStatusClass(agreement.status);
  const notes = escapeHtml(agreement.notes || "");
  const documentRecordId = escapeHtml(agreement.document_record_id || "");
  const relatedAccommodationItemId = escapeHtml(agreement.related_accommodation_item_id || "");

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="${statusClass}">${status}</span>
          <span class="status-badge">${agreementType}</span>
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${studentName}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${institutionStudentId ? `${institutionStudentId} · ` : ""}${studentEmail}
        </p>

        ${documentRecordId ? `<p class="asa-inbox-row__summary">Document record: ${documentRecordId}</p>` : ""}
        ${relatedAccommodationItemId ? `<p class="asa-inbox-row__summary">Accommodation item: ${relatedAccommodationItemId}</p>` : ""}
        ${notes ? `<p class="asa-inbox-row__summary">${notes}</p>` : ""}

        ${renderDateLine("Due", agreement.due_at)}
        ${renderDateLine("Signed", agreement.signed_at)}
        ${renderDateLine("Expires", agreement.expires_at)}
        ${renderDateLine("Revoked", agreement.revoked_at)}
      </div>
    </article>
  `;
}

function renderStudentAgreements(container, agreements) {
  if (!Array.isArray(agreements) || agreements.length === 0) {
    renderEmpty(container, "No student agreements are currently available.");
    return;
  }

  container.innerHTML = agreements.map(renderStudentAgreement).join("");
}

export function initStudentAgreementsPanel() {
  const container = document.getElementById("asa-student-agreement-list");
  const count = document.getElementById("asa-student-agreement-count");
  const refreshButton = document.getElementById("asa-student-agreement-refresh");

  if (!container) return;

  async function loadStudentAgreements() {
    renderEmpty(container, "Loading student agreements...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const agreements = await portalApi.getWorkflowStudentAgreements();

      if (count) {
        count.textContent = String(Array.isArray(agreements) ? agreements.length : 0);
      }

      renderStudentAgreements(container, agreements);
    } catch (error) {
      console.warn("Student agreements could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "Student agreements could not be loaded. Start the Flask API to view live agreement data."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadStudentAgreements);
  }

  loadStudentAgreements();
}
