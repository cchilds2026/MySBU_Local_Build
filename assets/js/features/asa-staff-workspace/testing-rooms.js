import { portalApi } from "../../services/portal-api.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBooleanStatus(value) {
  return value ? "Active" : "Inactive";
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderTestingRoom(room) {
  const roomName = escapeHtml(room.room_name || "Testing room");
  const roomCode = escapeHtml(room.room_code || "");
  const location = escapeHtml(room.location_description || "Location not specified");
  const capacity = room.capacity ?? "Not specified";
  const notes = escapeHtml(room.notes || "");
  const isActive = Boolean(room.is_active);
  const statusClass = isActive
    ? "status-badge status-badge--success"
    : "status-badge";

  return `
    <article class="asa-inbox-row">
      <div class="asa-inbox-row__main">
        <div class="asa-inbox-row__stage">
          <span class="${statusClass}">${formatBooleanStatus(isActive)}</span>
          ${roomCode ? `<span class="status-badge">${roomCode}</span>` : ""}
        </div>

        <div class="asa-inbox-row__topline">
          <strong>${roomName}</strong>
        </div>

        <p class="asa-inbox-row__meta">
          ${location} · Capacity: ${escapeHtml(capacity)}
        </p>

        ${notes ? `<p class="asa-inbox-row__summary">${notes}</p>` : ""}
      </div>
    </article>
  `;
}

function renderTestingRooms(container, rooms) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    renderEmpty(container, "No active testing rooms are currently available.");
    return;
  }

  container.innerHTML = rooms.map(renderTestingRoom).join("");
}

export function initTestingRoomsPanel() {
  const container = document.getElementById("asa-testing-room-list");
  const count = document.getElementById("asa-testing-room-count");
  const refreshButton = document.getElementById("asa-testing-room-refresh");

  if (!container) return;

  async function loadTestingRooms() {
    renderEmpty(container, "Loading testing rooms...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const rooms = await portalApi.getWorkflowTestingRooms();

      if (count) {
        count.textContent = String(Array.isArray(rooms) ? rooms.length : 0);
      }

      renderTestingRooms(container, rooms);
    } catch (error) {
      console.warn("Testing rooms could not be loaded.", error);

      if (count) {
        count.textContent = "0";
      }

      renderEmpty(
        container,
        "Testing rooms could not be loaded. Start the Flask API to view live room data."
      );
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadTestingRooms);
  }

  loadTestingRooms();
}
