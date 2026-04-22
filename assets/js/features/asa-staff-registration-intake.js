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

  if (
    normalized === "submitted" ||
    normalized === "received" ||
    normalized === "saved"
  ) {
    return "status-badge status-badge--pending";
  }

  if (
    normalized === "in_review" ||
    normalized === "intake_scheduled"
  ) {
    return "status-badge status-badge--read";
  }

  if (normalized === "approved" || normalized === "completed") {
    return "status-badge status-badge--success";
  }

  if (normalized === "cancelled" || normalized === "deleted") {
    return "status-badge status-badge--no-show";
  }

  return "status-badge";
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function formatRequestedAccommodations(record) {
  try {
    const parsed = JSON.parse(record.requested_accommodations_json || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed.join(", ") : "None listed";
  } catch {
    return record.requested_accommodations_json || "None listed";
  }
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
            ${record.student_email} · Submitted ${record.submitted_at}
          </p>
        </div>
        <span class="${getStatusClass(record.workflow_status)}">${formatStatusLabel(record.workflow_status)}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>SBU ID:</strong> ${record.institution_student_id || "Not available"}</p>
          <p><strong>Request Type:</strong> ${record.request_type || "Not provided"}</p>
          <p><strong>Disability Type:</strong> ${record.disability_type || "Not provided"}</p>
          <p><strong>Prior Accommodations:</strong> ${record.prior_accommodations || "Not provided"}</p>
          <p><strong>Documentation Pending:</strong> ${record.docs_pending_acknowledged ? "Yes" : "No"}</p>
          <p><strong>Release Consent:</strong> ${record.release_consent ? "Yes" : "No"}</p>
          <p><strong>Requested Accommodations:</strong> ${formatRequestedAccommodations(record)}</p>
          <p><strong>Other Requested:</strong> ${record.requested_accommodations_other || "None"}</p>
          <p><strong>Document File Name:</strong> ${record.document_file_name || "None uploaded"}</p>
          <p><strong>Document Storage Path:</strong> ${record.document_storage_path || "None uploaded"}</p>
        </div>

        <div class="letter-preview__body">
          <p><strong>Academic Impact</strong></p>
          <p>${record.academic_impact || "Not provided"}</p>

          <p><strong>Daily Life Impact</strong></p>
          <p>${record.daily_life_impact || "Not provided"}</p>

          <p><strong>Prior Accommodation Details</strong></p>
          <p>${record.prior_accommodations_details || "Not provided"}</p>
        </div>
      </div>

      <div class="faculty-preference-launcher__footer">
        <a
          class="button-secondary"
          href="/pages/asa-student-record.html?student_id=${encodeURIComponent(record.student_id)}"
        >
          Open Student Record
        </a>
      </div>
    </section>
  `;
}

function buildModal() {
  let modal = document.getElementById("asa-registration-intake-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-registration-intake-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="modal-dialog modal-dialog--faculty-exam"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asa-registration-intake-modal-title"
    >
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-registration-intake-modal-title" class="modal-title">
            Student Registration Request
          </h2>
        </div>
        <button
          type="button"
          class="faculty-modal-close"
          id="asa-registration-intake-modal-close"
          aria-label="Close registration request modal"
        >
          ×
        </button>
      </div>

      <div id="asa-registration-intake-modal-content"></div>

      <div class="form-message" id="asa-registration-intake-modal-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-registration-mark-review-button">
          Mark In Review
        </button>
        <button type="button" class="button-secondary" id="asa-registration-mark-intake-button">
          Mark Intake Scheduled
        </button>
        <button type="button" class="button-secondary" id="asa-registration-mark-complete-button">
          Mark Completed
        </button>
        <button type="button" class="button-secondary" id="asa-registration-intake-delete-button">
          Delete Request
        </button>
        <button type="button" class="button-primary" id="asa-registration-intake-close-button">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initModal(actions) {
  const modal = buildModal();
  const content = document.getElementById("asa-registration-intake-modal-content");
  const message = document.getElementById("asa-registration-intake-modal-message");
  const closeButton = document.getElementById("asa-registration-intake-modal-close");
  const footerCloseButton = document.getElementById("asa-registration-intake-close-button");
  const deleteButton = document.getElementById("asa-registration-intake-delete-button");
  const reviewButton = document.getElementById("asa-registration-mark-review-button");
  const intakeButton = document.getElementById("asa-registration-mark-intake-button");
  const completeButton = document.getElementById("asa-registration-mark-complete-button");

  let currentRecord = null;

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
      button.disabled = false;
    });
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  closeButton.addEventListener("click", closeModal);
  footerCloseButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  async function handleStatusUpdate(nextStatus) {
    if (!currentRecord) return;

    try {
      [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
        button.disabled = true;
      });

      await actions.onStatusUpdate(currentRecord, nextStatus);
      showMessage("success", `Request updated to ${formatStatusLabel(nextStatus)}.`);

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not update registration request.");
      [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
        button.disabled = false;
      });
    }
  }

  deleteButton.addEventListener("click", async () => {
    if (!currentRecord) return;

    const confirmed = window.confirm(
      "Delete this student registration request? This is intended for demo cleanup or accidental submissions."
    );

    if (!confirmed) return;

    try {
      [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
        button.disabled = true;
      });

      await actions.onDelete(currentRecord);
      showMessage("success", "Registration request deleted successfully.");

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not delete registration request.");
      [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
        button.disabled = false;
      });
    }
  });

  reviewButton.addEventListener("click", async () => {
    await handleStatusUpdate("in_review");
  });

  intakeButton.addEventListener("click", async () => {
    await handleStatusUpdate("intake_scheduled");
  });

  completeButton.addEventListener("click", async () => {
    await handleStatusUpdate("completed");
  });

  function openModal(record) {
    currentRecord = record;
    content.innerHTML = buildDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    [deleteButton, reviewButton, intakeButton, completeButton].forEach((button) => {
      button.disabled = false;
    });
    modal.hidden = false;
  }

  return { openModal, closeModal };
}

function renderRecordList(records, container, openModal, emptyMessage) {
  if (!container) return;

  if (!records.length) {
    renderEmptyState(container, emptyMessage);
    return;
  }

  container.innerHTML = "";

  records.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive";

    button.innerHTML = `
      <span>
        <strong>${record.student_first_name} ${record.student_last_name}</strong>
        <p>
          ${record.request_type} · ${record.disability_type} · Submitted ${record.submitted_at}
        </p>
      </span>
      <span class="${getStatusClass(record.workflow_status)}">${formatStatusLabel(record.workflow_status)}</span>
    `;

    button.addEventListener("click", () => {
      openModal(record);
    });

    container.appendChild(button);
  });
}

export function initAsaStaffRegistrationIntake() {
  const registrationListContainer = document.getElementById("asa-registration-request-list");
  const intakeListContainer = document.getElementById("asa-staff-intake-list");
  const countElement = document.getElementById("asa-registration-request-count");
  const awaitingIntakeSummary = document.getElementById("asa-summary-awaiting");
  const refreshButton = document.getElementById("asa-registration-request-refresh");

  if (!registrationListContainer) return;

  const modal = initModal({
    onDelete: async (record) => {
      await portalApi.deleteStudentRegistrationRequest(
        record.student_registration_request_id,
        { deleted_by_user_id: "asa_staff:demo-cleanup" }
      );
      await loadRequests();
    },
    onStatusUpdate: async (record, nextStatus) => {
      await portalApi.updateStudentRegistrationRequestStatus(
        record.student_registration_request_id,
        {
          workflow_status: nextStatus,
          reviewed_by_user_id: "asa_staff:workflow"
        }
      );
      await loadRequests();
    }
  });

  async function loadRequests() {
    try {
      const submittedRecords = await portalApi.getStudentRegistrationRequests({
        status: "submitted"
      });

      const intakeRecords = await portalApi.getStudentRegistrationRequests({
        status: "in_review,intake_scheduled"
      });

      const combinedAwaitingCount = submittedRecords.length + intakeRecords.length;

      if (countElement) {
        countElement.textContent = String(submittedRecords.length);
      }

      if (awaitingIntakeSummary) {
        awaitingIntakeSummary.textContent = String(combinedAwaitingCount);
      }

      renderRecordList(
        submittedRecords,
        registrationListContainer,
        modal.openModal,
        "No student registration requests are currently awaiting first review."
      );

      renderRecordList(
        intakeRecords,
        intakeListContainer,
        modal.openModal,
        "No intake items are currently in progress."
      );
    } catch (error) {
      renderEmptyState(
        registrationListContainer,
        `Could not load student registration requests. ${error.message}`
      );

      if (intakeListContainer) {
        renderEmptyState(
          intakeListContainer,
          `Could not load intake items. ${error.message}`
        );
      }

      if (awaitingIntakeSummary) {
        awaitingIntakeSummary.textContent = "0";
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      loadRequests();
    });
  }

  loadRequests().catch((error) => {
    console.error("Failed to initialize ASA staff registration intake:", error);
  });
}