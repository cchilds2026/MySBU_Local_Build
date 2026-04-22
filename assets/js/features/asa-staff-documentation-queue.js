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

  if (normalized === "pending" || normalized === "awaiting_upload") {
    return "status-badge status-badge--pending";
  }

  if (normalized === "in_review" || normalized === "follow_up_needed") {
    return "status-badge status-badge--read";
  }

  if (normalized === "reviewed") {
    return "status-badge status-badge--success";
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
            ${record.student_email} · Submitted ${record.submitted_at}
          </p>
        </div>
        <span class="${getStatusClass(record.docs_review_status)}">${formatStatusLabel(record.docs_review_status)}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>SBU ID:</strong> ${record.institution_student_id || "Not available"}</p>
          <p><strong>Request Type:</strong> ${record.request_type || "Not provided"}</p>
          <p><strong>Disability Type:</strong> ${record.disability_type || "Not provided"}</p>
          <p><strong>Workflow Status:</strong> ${formatStatusLabel(record.workflow_status || "")}</p>
          <p><strong>Document File Name:</strong> ${record.document_file_name || "None uploaded"}</p>
          <p><strong>Document Storage Path:</strong> ${record.document_storage_path || "None uploaded"}</p>
          <p><strong>Student Acknowledged Pending Docs:</strong> ${record.docs_pending_acknowledged ? "Yes" : "No"}</p>
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
  let modal = document.getElementById("asa-documentation-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-documentation-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="modal-dialog modal-dialog--faculty-exam"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asa-documentation-modal-title"
    >
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-documentation-modal-title" class="modal-title">
            Documentation Review
          </h2>
        </div>
        <button
          type="button"
          class="faculty-modal-close"
          id="asa-documentation-modal-close"
          aria-label="Close documentation modal"
        >
          ×
        </button>
      </div>

      <div id="asa-documentation-modal-content"></div>

      <div class="form-message" id="asa-documentation-modal-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-docs-mark-review-button">
          Mark In Review
        </button>
        <button type="button" class="button-secondary" id="asa-docs-follow-up-button">
          Mark Follow Up Needed
        </button>
        <button type="button" class="button-primary" id="asa-docs-mark-reviewed-button">
          Mark Reviewed
        </button>
        <button type="button" class="button-secondary" id="asa-documentation-modal-close-button">
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
  const content = document.getElementById("asa-documentation-modal-content");
  const message = document.getElementById("asa-documentation-modal-message");
  const closeButton = document.getElementById("asa-documentation-modal-close");
  const footerCloseButton = document.getElementById("asa-documentation-modal-close-button");
  const reviewButton = document.getElementById("asa-docs-mark-review-button");
  const followUpButton = document.getElementById("asa-docs-follow-up-button");
  const reviewedButton = document.getElementById("asa-docs-mark-reviewed-button");

  let currentRecord = null;

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    [reviewButton, followUpButton, reviewedButton].forEach((button) => {
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
      [reviewButton, followUpButton, reviewedButton].forEach((button) => {
        button.disabled = true;
      });

      await onStatusUpdate(currentRecord, nextStatus);
      showMessage("success", `Documentation updated to ${formatStatusLabel(nextStatus)}.`);

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not update documentation.");
      [reviewButton, followUpButton, reviewedButton].forEach((button) => {
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

  reviewButton.addEventListener("click", async () => {
    await handleStatusUpdate("in_review");
  });

  followUpButton.addEventListener("click", async () => {
    await handleStatusUpdate("follow_up_needed");
  });

  reviewedButton.addEventListener("click", async () => {
    await handleStatusUpdate("reviewed");
  });

  function openModal(record) {
    currentRecord = record;
    content.innerHTML = buildDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    [reviewButton, followUpButton, reviewedButton].forEach((button) => {
      button.disabled = false;
    });
    modal.hidden = false;
  }

  return { openModal };
}

export function initAsaStaffDocumentationQueue() {
  const listContainer = document.getElementById("asa-staff-documentation-list");
  const summaryElement = document.getElementById("asa-summary-docs-pending");

  if (!listContainer) return;

  const modal = initModal(async (record, nextStatus) => {
    await portalApi.updateStudentRegistrationRequestDocsStatus(
      record.student_registration_request_id,
      {
        docs_review_status: nextStatus,
        reviewed_by_user_id: "asa_staff:documentation"
      }
    );
    await loadDocumentation();
  });

  async function loadDocumentation() {
    try {
      const records = await portalApi.getDocumentationQueue({
        status: "pending,awaiting_upload,in_review,follow_up_needed"
      });

      if (summaryElement) {
        summaryElement.textContent = String(records.length);
      }

      if (!records.length) {
        renderEmptyState(
          listContainer,
          "No documentation items are currently awaiting review."
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
            <strong>${record.student_first_name} ${record.student_last_name}</strong>
            <p>
              ${record.document_file_name || "No file uploaded"} · Submitted ${record.submitted_at}
            </p>
          </span>
          <span class="${getStatusClass(record.docs_review_status)}">${formatStatusLabel(record.docs_review_status)}</span>
        `;

        button.addEventListener("click", () => {
          modal.openModal(record);
        });

        listContainer.appendChild(button);
      });
    } catch (error) {
      renderEmptyState(
        listContainer,
        `Could not load documentation queue. ${error.message}`
      );
    }
  }

  loadDocumentation().catch((error) => {
    console.error("Failed to initialize ASA staff documentation queue:", error);
  });
}