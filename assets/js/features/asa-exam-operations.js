import { portalApi } from "../services/portal-api.js";

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "received_by_asa") {
    return "status-badge status-badge--pending";
  }

  if (normalized === "scheduled") {
    return "status-badge status-badge--read";
  }

  if (normalized === "completed") {
    return "status-badge status-badge--success";
  }

  if (normalized === "no_show" || normalized === "cancelled") {
    return "status-badge status-badge--no-show";
  }

  return "status-badge";
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function buildDetailHtml(record) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">
            ${record.student_first_name} ${record.student_last_name}
          </h3>
          <p class="letter-preview__meta">
            ${record.subject_code} ${record.course_number} · ${record.section_code}
          </p>
        </div>
        <span class="${getStatusClass(record.staff_status)}">${formatStatusLabel(record.staff_status)}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student Email:</strong> ${record.student_email || "Not available"}</p>
          <p><strong>Requested Exam Date:</strong> ${record.requested_exam_date || "Not available"}</p>
          <p><strong>Requested Start Time:</strong> ${record.requested_start_time || "Not available"}</p>
          <p><strong>Workflow Status:</strong> ${formatStatusLabel(record.workflow_status || "")}</p>
          <p><strong>Staff Status:</strong> ${formatStatusLabel(record.staff_status || "")}</p>
          <p><strong>Submitted At:</strong> ${record.submitted_at || "Not available"}</p>
        </div>

        <div class="letter-preview__body">
          <p><strong>Student Notes</strong></p>
          <p>${record.student_notes || "No notes submitted."}</p>
        </div>
      </div>
    </section>
  `;
}

function buildModal() {
  let modal = document.getElementById("asa-exam-operations-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-exam-operations-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="modal-dialog modal-dialog--faculty-exam"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asa-exam-operations-modal-title"
    >
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-exam-operations-modal-title" class="modal-title">
            Exam Request Operations
          </h2>
        </div>
        <button
          type="button"
          class="faculty-modal-close"
          id="asa-exam-operations-modal-close"
          aria-label="Close exam operations modal"
        >
          ×
        </button>
      </div>

      <div id="asa-exam-operations-modal-content"></div>

      <div class="form-message" id="asa-exam-operations-modal-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-exam-mark-received-button">
          Mark Received
        </button>
        <button type="button" class="button-secondary" id="asa-exam-mark-scheduled-button">
          Mark Scheduled
        </button>
        <button type="button" class="button-secondary" id="asa-exam-mark-completed-button">
          Mark Completed
        </button>
        <button type="button" class="button-secondary" id="asa-exam-mark-no-show-button">
          Mark No Show
        </button>
        <button type="button" class="button-secondary" id="asa-exam-mark-cancelled-button">
          Mark Cancelled
        </button>
        <button type="button" class="button-primary" id="asa-exam-operations-modal-close-button">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initModal(onStatusUpdate) {
  const modal = buildModal();
  const content = document.getElementById("asa-exam-operations-modal-content");
  const message = document.getElementById("asa-exam-operations-modal-message");
  const closeButton = document.getElementById("asa-exam-operations-modal-close");
  const footerCloseButton = document.getElementById("asa-exam-operations-modal-close-button");
  const receivedButton = document.getElementById("asa-exam-mark-received-button");
  const scheduledButton = document.getElementById("asa-exam-mark-scheduled-button");
  const completedButton = document.getElementById("asa-exam-mark-completed-button");
  const noShowButton = document.getElementById("asa-exam-mark-no-show-button");
  const cancelledButton = document.getElementById("asa-exam-mark-cancelled-button");

  let currentRecord = null;

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    [receivedButton, scheduledButton, completedButton, noShowButton, cancelledButton].forEach((button) => {
      button.disabled = false;
    });
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  async function handleStatusUpdate(nextStatus) {
    if (!currentRecord) return;

    try {
      [receivedButton, scheduledButton, completedButton, noShowButton, cancelledButton].forEach((button) => {
        button.disabled = true;
      });

      await onStatusUpdate(currentRecord, nextStatus);
      showMessage("success", `Exam request updated to ${formatStatusLabel(nextStatus)}.`);

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not update exam request.");
      [receivedButton, scheduledButton, completedButton, noShowButton, cancelledButton].forEach((button) => {
        button.disabled = false;
      });
    }
  }

  closeButton.addEventListener("click", closeModal);
  footerCloseButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  receivedButton.addEventListener("click", async () => {
    await handleStatusUpdate("received_by_asa");
  });

  scheduledButton.addEventListener("click", async () => {
    await handleStatusUpdate("scheduled");
  });

  completedButton.addEventListener("click", async () => {
    await handleStatusUpdate("completed");
  });

  noShowButton.addEventListener("click", async () => {
    await handleStatusUpdate("no_show");
  });

  cancelledButton.addEventListener("click", async () => {
    await handleStatusUpdate("cancelled");
  });

  function openModal(record) {
    currentRecord = record;
    content.innerHTML = buildDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    [receivedButton, scheduledButton, completedButton, noShowButton, cancelledButton].forEach((button) => {
      button.disabled = false;
    });
    modal.hidden = false;
  }

  return { openModal };
}

function updateSummary(records) {
  const total = document.getElementById("asa-exam-ops-total");
  const received = document.getElementById("asa-exam-ops-received");
  const scheduled = document.getElementById("asa-exam-ops-scheduled");
  const issues = document.getElementById("asa-exam-ops-issues");

  if (total) total.textContent = String(records.length);
  if (received) {
    received.textContent = String(
      records.filter((record) => String(record.staff_status || "").toLowerCase() === "received_by_asa").length
    );
  }
  if (scheduled) {
    scheduled.textContent = String(
      records.filter((record) => String(record.staff_status || "").toLowerCase() === "scheduled").length
    );
  }
  if (issues) {
    issues.textContent = String(
      records.filter((record) => {
        const status = String(record.staff_status || "").toLowerCase();
        return status === "no_show" || status === "cancelled";
      }).length
    );
  }
}

export function initAsaExamOperations() {
  const listContainer = document.getElementById("asa-exam-operations-list");
  if (!listContainer) return;

  const modal = initModal(async (record, nextStatus) => {
    await portalApi.updateExamStaffStatus(record.exam_request_id, {
      staff_status: nextStatus,
      staff_notes: "",
      acted_by_user_id: "asa_staff:exam-operations"
    });
    await loadExamRequests();
  });

  async function loadExamRequests() {
    try {
      const records = await portalApi.getExamRequests();
      updateSummary(records);

      if (!records.length) {
        renderEmptyState(listContainer, "No exam requests found.");
        return;
      }

      listContainer.innerHTML = "";

      records.forEach((record) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-row record-row--interactive";

        button.innerHTML = `
          <span>
            <strong>${record.student_first_name} ${record.student_last_name}</strong>
            <p>
              ${record.subject_code} ${record.course_number} · ${record.requested_exam_date || "No date"}
            </p>
          </span>
          <span class="${getStatusClass(record.staff_status)}">${formatStatusLabel(record.staff_status)}</span>
        `;

        button.addEventListener("click", () => {
          modal.openModal(record);
        });

        listContainer.appendChild(button);
      });
    } catch (error) {
      renderEmptyState(listContainer, `Could not load exam operations. ${error.message}`);
    }
  }

  loadExamRequests().catch((error) => {
    console.error("Failed to initialize exam operations:", error);
  });
}