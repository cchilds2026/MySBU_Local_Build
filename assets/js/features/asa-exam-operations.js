import { portalApi } from "../services/portal-api.js";

function formatStatusLabel(status) {
  return String(status || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUploadedExamReturnMethod(value) {
  const lookup = {
    scan_and_email: "Scan and Email",
    interoffice_mail_only: "Interoffice Mail Only",
    pickup_in_person: "Pickup In Person",
    moodle_online_submission: "Moodle/Online Submission"
  };

  return lookup[value] || formatStatusLabel(value);
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

  if (normalized === "uploaded" || normalized === "on_file") {
    return "status-badge status-badge--success";
  }

  return "status-badge";
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function buildExamRequestDetailHtml(record) {
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

function buildUploadedExamDetailHtml(record) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title || "Uploaded Exam"}</h3>
          <p class="letter-preview__meta">
            ${record.subject_code || ""} ${record.course_number || ""} · ${record.section_code || ""}
          </p>
        </div>
        <span class="${getStatusClass("uploaded")}">Uploaded</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>File Name:</strong> ${record.file_name || "Not available"}</p>
          <p><strong>Storage Path:</strong> ${record.storage_path || "Not available"}</p>
          <p><strong>MIME Type:</strong> ${record.mime_type || "Not available"}</p>
          <p><strong>Return Method:</strong> ${formatUploadedExamReturnMethod(record.delivery_method || "") || "Not available"}</p>          <p><strong>Class Exam Date:</strong> ${record.class_exam_date || "Not provided"}</p>
          <p><strong>Class Exam Time:</strong> ${record.class_exam_time || "Not provided"}</p>
          <p><strong>Uploaded At:</strong> ${record.uploaded_at || "Not available"}</p>
        </div>

        <div class="letter-preview__body">
          <p><strong>Notes</strong></p>
          <p>${record.notes || "No notes provided."}</p>

          ${
            record.sharepoint_file_url
              ? `
            <p style="margin-top: 1rem;">
              <a
                class="button-secondary"
                href="${record.sharepoint_file_url}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Document
              </a>
            </p>
          `
              : `
            <p style="margin-top: 1rem;">No document link is available for this uploaded exam.</p>
          `
          }
        </div>
      </div>
    </section>
  `;
}

function buildExamRequestModal() {
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
        <button type="button" class="button-secondary" id="asa-exam-delete-button">
          Delete Request
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

function buildUploadedExamModal() {
  let modal = document.getElementById("asa-uploaded-exam-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-uploaded-exam-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="modal-dialog modal-dialog--faculty-exam"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asa-uploaded-exam-modal-title"
    >
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-uploaded-exam-modal-title" class="modal-title">
            Uploaded Exam Record
          </h2>
        </div>
        <button
          type="button"
          class="faculty-modal-close"
          id="asa-uploaded-exam-modal-close"
          aria-label="Close uploaded exam modal"
        >
          ×
        </button>
      </div>

      <div id="asa-uploaded-exam-modal-content"></div>

      <div class="form-message" id="asa-uploaded-exam-modal-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-uploaded-exam-delete-button">
          Delete Uploaded Exam
        </button>
        <button type="button" class="button-primary" id="asa-uploaded-exam-modal-close-button">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initExamRequestModal(onStatusUpdate, onDelete) {
  const modal = buildExamRequestModal();
  const content = document.getElementById("asa-exam-operations-modal-content");
  const message = document.getElementById("asa-exam-operations-modal-message");
  const closeButton = document.getElementById("asa-exam-operations-modal-close");
  const footerCloseButton = document.getElementById("asa-exam-operations-modal-close-button");
  const receivedButton = document.getElementById("asa-exam-mark-received-button");
  const scheduledButton = document.getElementById("asa-exam-mark-scheduled-button");
  const completedButton = document.getElementById("asa-exam-mark-completed-button");
  const noShowButton = document.getElementById("asa-exam-mark-no-show-button");
  const cancelledButton = document.getElementById("asa-exam-mark-cancelled-button");
  const deleteButton = document.getElementById("asa-exam-delete-button");

  let currentRecord = null;

  function getActionButtons() {
    return [
      receivedButton,
      scheduledButton,
      completedButton,
      noShowButton,
      cancelledButton,
      deleteButton
    ];
  }

  function setButtonsDisabled(isDisabled) {
    getActionButtons().forEach((button) => {
      button.disabled = isDisabled;
    });
  }

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    setButtonsDisabled(false);
    deleteButton.textContent = "Delete Request";
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  async function handleStatusUpdate(nextStatus) {
    if (!currentRecord) return;

    try {
      setButtonsDisabled(true);

      await onStatusUpdate(currentRecord, nextStatus);
      showMessage("success", `Exam request updated to ${formatStatusLabel(nextStatus)}.`);

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not update exam request.");
      setButtonsDisabled(false);
    }
  }

  async function handleDelete() {
    if (!currentRecord) return;

    const confirmed = window.confirm(
      "Delete this exam request from the application? This should only be used for staff cleanup or test data removal."
    );
    if (!confirmed) return;

    try {
      setButtonsDisabled(true);
      deleteButton.textContent = "Deleting...";

      await onDelete(currentRecord);
      showMessage("success", "Exam request deleted.");

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not delete exam request.");
      setButtonsDisabled(false);
      deleteButton.textContent = "Delete Request";
    }
  }

  closeButton.addEventListener("click", closeModal);
  footerCloseButton.addEventListener("click", closeModal);
  deleteButton.addEventListener("click", handleDelete);

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
    content.innerHTML = buildExamRequestDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    setButtonsDisabled(false);
    deleteButton.textContent = "Delete Request";
    modal.hidden = false;
  }

  return { openModal };
}

function initUploadedExamModal(onDelete) {
  const modal = buildUploadedExamModal();
  const content = document.getElementById("asa-uploaded-exam-modal-content");
  const message = document.getElementById("asa-uploaded-exam-modal-message");
  const closeButton = document.getElementById("asa-uploaded-exam-modal-close");
  const footerCloseButton = document.getElementById("asa-uploaded-exam-modal-close-button");
  const deleteButton = document.getElementById("asa-uploaded-exam-delete-button");

  let currentRecord = null;

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    currentRecord = null;
    deleteButton.disabled = false;
    deleteButton.textContent = "Delete Uploaded Exam";
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  async function handleDelete() {
    if (!currentRecord) return;

    const confirmed = window.confirm(
      "Delete this uploaded exam record from the application? This should only be used for staff cleanup or test data removal."
    );
    if (!confirmed) return;

    try {
      deleteButton.disabled = true;
      deleteButton.textContent = "Deleting...";

      await onDelete(currentRecord);
      showMessage("success", "Uploaded exam deleted.");

      window.setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      showMessage("error", error.message || "Could not delete uploaded exam.");
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete Uploaded Exam";
    }
  }

  closeButton.addEventListener("click", closeModal);
  footerCloseButton.addEventListener("click", closeModal);
  deleteButton.addEventListener("click", handleDelete);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  function openModal(record) {
    currentRecord = record;
    content.innerHTML = buildUploadedExamDetailHtml(record);
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    deleteButton.disabled = false;
    deleteButton.textContent = "Delete Uploaded Exam";
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
  const examListContainer = document.getElementById("asa-exam-operations-list");
  const uploadedExamListContainer = document.getElementById("asa-uploaded-exams-list");
  if (!examListContainer) return;

  const examModal = initExamRequestModal(
    async (record, nextStatus) => {
      await portalApi.updateExamStaffStatus(record.exam_request_id, {
        staff_status: nextStatus,
        staff_notes: "",
        acted_by_user_id: "asa_staff:exam-operations"
      });
      await loadExamRequests();
    },
    async (record) => {
      await portalApi.deleteExamRequest(record.exam_request_id, {
        deleted_by_user_id: "asa_staff:exam_cleanup"
      });
      await loadExamRequests();
    }
  );

  const uploadedExamModal = initUploadedExamModal(async (record) => {
    await portalApi.deleteUploadedExam(record.uploaded_exam_id, {
      deleted_by_user_id: "asa_staff:uploaded_exam_cleanup"
    });
    await loadUploadedExams();
  });

  async function loadExamRequests() {
    try {
      const records = await portalApi.getExamRequests();
      updateSummary(records);

      if (!records.length) {
        renderEmptyState(examListContainer, "No exam requests found.");
        return;
      }

      examListContainer.innerHTML = "";

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
          examModal.openModal(record);
        });

        examListContainer.appendChild(button);
      });
    } catch (error) {
      renderEmptyState(examListContainer, `Could not load exam operations. ${error.message}`);
    }
  }

  async function loadUploadedExams() {
    if (!uploadedExamListContainer) return;

    try {
      const records = await portalApi.getUploadedExams();

      if (!records.length) {
        renderEmptyState(uploadedExamListContainer, "No uploaded exams found.");
        return;
      }

      uploadedExamListContainer.innerHTML = "";

      records.forEach((record) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-row record-row--interactive";

        button.innerHTML = `
          <span>
            <strong>${record.title || record.file_name || "Uploaded Exam"}</strong>
            <p>
              ${record.subject_code || ""} ${record.course_number || ""} · ${record.file_name || "No file name"}
            </p>
          </span>
          <span class="${getStatusClass("uploaded")}">Uploaded</span>
        `;

        button.addEventListener("click", () => {
          uploadedExamModal.openModal(record);
        });

        uploadedExamListContainer.appendChild(button);
      });
    } catch (error) {
      renderEmptyState(uploadedExamListContainer, `Could not load uploaded exams. ${error.message}`);
    }
  }

  Promise.all([loadExamRequests(), loadUploadedExams()]).catch((error) => {
    console.error("Failed to initialize exam operations:", error);
  });
}