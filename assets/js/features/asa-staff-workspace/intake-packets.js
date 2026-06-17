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

  if (
    normalized === "scheduled" ||
    normalized === "intake_complete" ||
    normalized === "closed"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "started" ||
    normalized === "registration_received" ||
    normalized === "documentation_pending" ||
    normalized === "documentation_received" ||
    normalized === "ready_to_schedule"
  ) {
    return "status-badge status-badge--pending";
  }

  if (normalized === "cancelled") {
    return "status-badge status-badge--read";
  }

  return "status-badge";
}

function formatStudentName(packet) {
  const firstName = packet.student_first_name || "";
  const lastName = packet.student_last_name || "";
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

function renderIntakePacket(packet) {
  const studentName = escapeHtml(formatStudentName(packet));
  const studentEmail = escapeHtml(packet.student_email || "");
  const institutionStudentId = escapeHtml(packet.institution_student_id || "");
  const requestType = escapeHtml(formatStatusLabel(packet.registration_request_type || ""));
  const status = escapeHtml(formatStatusLabel(packet.status || "started"));
  const statusClass = getStatusClass(packet.status);
  const staffNotes = escapeHtml(packet.staff_notes || "");
  const navigateReference = escapeHtml(packet.navigate_appointment_reference || "");

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="${statusClass}">${status}</span>
          ${requestType ? `<span class="status-badge">${requestType}</span>` : ""}
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${studentName}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${institutionStudentId ? `${institutionStudentId} · ` : ""}${studentEmail}
        </p>

        ${navigateReference ? `<p class="asa-inbox-row__summary">Navigate reference: ${navigateReference}</p>` : ""}
        ${staffNotes ? `<p class="asa-inbox-row__summary">${staffNotes}</p>` : ""}

        ${renderDateLine("Registration received", packet.registration_received_at)}
        ${renderDateLine("Documentation received", packet.documentation_received_at)}
        ${renderDateLine("Ready to schedule", packet.ready_to_schedule_at)}
        ${renderDateLine("Intake scheduled", packet.intake_scheduled_at)}
        ${renderDateLine("Intake completed", packet.intake_completed_at)}
      </div>
    </article>
  `;
}

function renderIntakePackets(container, packets) {
  if (!Array.isArray(packets) || packets.length === 0) {
    renderEmpty(container, "No intake packets are currently available.");
    return;
  }

  container.innerHTML = packets.map(renderIntakePacket).join("");
}

export function initIntakePacketsPanel() {
  const container = document.getElementById("asa-staff-intake-list");
  const count = document.getElementById("asa-intake-packet-count");
  const refreshButton = document.getElementById("asa-intake-packet-refresh");

  if (!container) return;

  async function loadIntakePackets() {
    renderEmpty(container, "Loading intake packets...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const packets = await portalApi.getWorkflowIntakePackets();

      if (count) {
        count.textContent = String(Array.isArray(packets) ? packets.length : 0);
      }

      renderIntakePackets(container, packets);
    } catch (error) {
      console.warn("Intake packets could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "Intake packets could not be loaded. Start the Flask API to view live intake data."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadIntakePackets);
  }

  loadIntakePackets();
}
