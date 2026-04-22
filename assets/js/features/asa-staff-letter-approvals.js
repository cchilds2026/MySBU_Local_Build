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

  if (normalized === "submitted") {
    return "status-badge status-badge--pending";
  }

  if (normalized === "in_review") {
    return "status-badge status-badge--read";
  }

  if (normalized === "approved") {
    return "status-badge status-badge--success";
  }

  if (normalized === "returned") {
    return "status-badge status-badge--no-show";
  }

  return "status-badge";
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function buildDetailHtml(record) {
  const accommodationList = Array.isArray(record.approved_accommodations)
    ? record.approved_accommodations.map((item) => `<li>${item}</li>`).join("")
    : "";

  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.student_name}</h3>
          <p class="letter-preview__meta">
            ${record.student_email} · Submitted ${record.submitted_at}
          </p>
        </div>
        <span class="${getStatusClass(record.workflow_status)}">${formatStatusLabel(record.workflow_status)}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>SBU ID:</strong> ${record.student_id}</p>
          <p><strong>Request Type:</strong> ${record.request_type}</p>
        </div>

        <div class="letter-preview__body">
          <p>${record.summary}</p>
          <p><strong>Approved accommodations:</strong></p>
          <ul class="letter-preview__list">
            ${accommodationList}
          </ul>
        </div>
      </div>

      <div class="faculty-preference-launcher__footer">
        <a class="button-secondary" href="/pages/asa-student-directory.html">
          Open Student Directory
        </a>
      </div>
    </section>
  `;
}

function buildModal() {
  let modal = document.getElementById("asa-letter-approval-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-letter-approval-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="modal-dialog modal-dialog--faculty-exam"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asa-letter-approval-modal-title"
    >
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-letter-approval-modal-title" class="modal-title">
            Letter Approval Review
          </h2>
        </div>
        <button
          type="button"
          class="faculty-modal-close"
          id="asa-letter-approval-modal-close"
          aria-label="Close letter approval modal"
        >
          ×
        </button>
      </div>

      <div id="asa-letter-approval-modal-content"></div>

      <div class="form-message" id="asa-letter-approval-modal-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-letter-mark-review-button">
          Mark In Review
        </button>
        <button type="button" class="button-secondary" id="asa-letter-return-button">
          Return for Revision
        </button>
        <button type="button" class="button-primary" id="asa-letter-approve-button">
          Approve Letter
        </button>
        <button type="button" class="button-secondary" id="asa-letter-approval-close-button">
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
  const content = document.getElementById("asa-letter-approval-modal-content");
  const message = document.getElementById("asa-letter-approval-modal-message");
  const closeButton = document.getElementById("asa-letter-approval-modal-close");
  const footerCloseButton = document.getElementById("asa-letter-approval-close-button");
  const reviewButton = document.getElementById("asa-letter-mark-review-button");
  const returnButton = document.getElementById("asa-letter-return-button");
  const approveButton = document.getElementById("asa-letter-approve-button");

  let currentRecord = null;

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    [reviewButton, returnButton, approveButton].forEach((button) => {
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
      [reviewButton, returnButton, approveButton].forEach((button) => {
        button.disabled = true;
      });

      await onStatusUpdate(currentRecord, nextStatus);
      showMessage("success", `Letter request updated to ${formatStatusLabel(nextStatus)}.`);

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not update letter approval request.");
      [reviewButton, returnButton, approveButton].forEach((button) => {
        button.disabled = false;
      });
    }
  }

  reviewButton.addEventListener("click", async () => {
    await handleStatusUpdate("in_review");
  });

  returnButton.addEventListener("click", async () => {
    await handleStatusUpdate("returned");
  });

  approveButton.addEventListener("click", async () => {
    await handleStatusUpdate("approved");
  });

  function openModal(record) {
    currentRecord = record;
    content.innerHTML = buildDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    [reviewButton, returnButton, approveButton].forEach((button) => {
      button.disabled = false;
    });
    modal.hidden = false;
  }

  return { openModal };
}

export function initAsaStaffLetterApprovals() {
  const listContainer = document.getElementById("asa-staff-letter-approval-list");
  const summaryElement = document.getElementById("asa-summary-letters-ready");

  if (!listContainer) return;

  const modal = initModal(async (record, nextStatus) => {
    await portalApi.updateAsaLetterApprovalStatus(record.asa_letter_request_id, {
      workflow_status: nextStatus,
      reviewed_by_user_id: "asa_staff:letter-approvals"
    });
    await loadLetters();
  });

  async function loadLetters() {
    try {
      const records = await portalApi.getAsaLetterApprovals({
        status: "submitted,in_review"
      });

      if (summaryElement) {
        summaryElement.textContent = String(records.length);
      }

      if (!records.length) {
        renderEmptyState(
          listContainer,
          "No accommodation letters are currently awaiting ASA review."
        );
        return;
      }

      listContainer.innerHTML = "";

      records.forEach((record) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-row record-row--interactive";

        button.innerHTML = `
          <span>
            <strong>${record.student_name}</strong>
            <p>${record.request_type} · Submitted ${record.submitted_at}</p>
          </span>
          <span class="${getStatusClass(record.workflow_status)}">${formatStatusLabel(record.workflow_status)}</span>
        `;

        button.addEventListener("click", () => {
          modal.openModal(record);
        });

        listContainer.appendChild(button);
      });
    } catch (error) {
      renderEmptyState(
        listContainer,
        `Could not load letter approvals. ${error.message}`
      );
    }
  }

  loadLetters().catch((error) => {
    console.error("Failed to initialize ASA staff letter approvals:", error);
  });
}