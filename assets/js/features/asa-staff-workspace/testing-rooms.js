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

function formatBooleanStatus(value) {
  return value ? "Active" : "Inactive";
}

function setStatus(element, message, className = "status-badge") {
  if (!element) return;
  element.textContent = message;
  element.className = className;
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <div class="faculty-empty-state">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderTestingRoom(room) {
  const testingRoomId = escapeAttribute(room.testing_room_id || "");
  const roomName = escapeHtml(room.room_name || "Testing room");
  const roomCode = escapeHtml(room.room_code || "");
  const location = escapeHtml(room.location_description || "Location not specified");
  const capacity = room.capacity ?? "Not specified";
  const notes = escapeHtml(room.notes || "");
  const isActive = Boolean(room.is_active);
  const statusClass = isActive
    ? "status-badge status-badge--success"
    : "status-badge";
  const actionLabel = isActive ? "Deactivate" : "Reactivate";

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

      <div class="asa-inbox-row__actions">
        <button
          class="button-secondary button-secondary--small"
          type="button"
          data-testing-room-id="${testingRoomId}"
          data-testing-room-active="${isActive ? "true" : "false"}"
        >
          ${actionLabel}
        </button>
      </div>
    </article>
  `;
}

function renderTestingRooms(container, rooms, includeInactive = false) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    renderEmpty(
      container,
      includeInactive
        ? "No testing rooms are currently available."
        : "No active testing rooms are currently available."
    );
    return;
  }

  container.innerHTML = rooms.map(renderTestingRoom).join("");
}

function buildTestingRoomPayload(form) {
  const formData = new FormData(form);
  const capacityValue = String(formData.get("capacity") || "").trim();

  return {
    room_code: String(formData.get("room_code") || "").trim(),
    room_name: String(formData.get("room_name") || "").trim(),
    location_description: String(formData.get("location_description") || "").trim() || null,
    capacity: capacityValue ? Number(capacityValue) : null,
    notes: String(formData.get("notes") || "").trim() || null,
    is_active: true
  };
}

export function initTestingRoomsPanel() {
  const container = document.getElementById("asa-testing-room-list");
  const count = document.getElementById("asa-testing-room-count");
  const refreshButton = document.getElementById("asa-testing-room-refresh");
  const includeInactiveToggle = document.getElementById("asa-testing-room-include-inactive");
  const form = document.getElementById("asa-testing-room-form");
  const formStatus = document.getElementById("asa-testing-room-form-status");

  if (!container) return;

  async function loadTestingRooms() {
    const includeInactive = Boolean(includeInactiveToggle?.checked);

    renderEmpty(container, "Loading testing rooms...");

    if (refreshButton) {
      refreshButton.disabled = true;
    }

    try {
      const rooms = await portalApi.getWorkflowTestingRooms({
        include_inactive: includeInactive ? "true" : ""
      });

      if (count) {
        count.textContent = String(Array.isArray(rooms) ? rooms.length : 0);
      }

      renderTestingRooms(container, rooms, includeInactive);
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

  async function handleCreateTestingRoom(event) {
    event.preventDefault();

    if (!form) return;

    const payload = buildTestingRoomPayload(form);

    if (!payload.room_code || !payload.room_name) {
      setStatus(
        formStatus,
        "Room code and room name are required.",
        "status-badge status-badge--read"
      );
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
    }

    setStatus(formStatus, "Saving...", "status-badge status-badge--pending");

    try {
      await portalApi.createWorkflowTestingRoom(payload);
      form.reset();
      setStatus(formStatus, "Saved", "status-badge status-badge--success");
      await loadTestingRooms();
    } catch (error) {
      console.warn("Testing room could not be created.", error);
      setStatus(
        formStatus,
        "Could not save testing room.",
        "status-badge status-badge--read"
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  async function handleTestingRoomAction(event) {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-testing-room-id]");

    if (!button) return;

    const testingRoomId = button.dataset.testingRoomId;
    const isActive = button.dataset.testingRoomActive === "true";

    if (!testingRoomId) return;

    button.disabled = true;

    try {
      await portalApi.updateWorkflowTestingRoom(testingRoomId, {
        is_active: !isActive
      });
      await loadTestingRooms();
    } catch (error) {
      console.warn("Testing room status could not be updated.", error);
      button.disabled = false;
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadTestingRooms);
  }

  if (includeInactiveToggle) {
    includeInactiveToggle.addEventListener("change", loadTestingRooms);
  }

  if (form) {
    form.addEventListener("submit", handleCreateTestingRoom);
  }

  container.addEventListener("click", handleTestingRoomAction);

  loadTestingRooms();
}
