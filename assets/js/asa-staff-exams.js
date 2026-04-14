const API_BASE_URL = "http://127.0.0.1:5050/api";

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "no_show" || normalized === "no show") {
    return "status-badge status-badge--no-show";
  }

  if (
    normalized === "faculty_approved" ||
    normalized === "approved" ||
    normalized === "scheduled" ||
    normalized === "completed"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "faculty_review" ||
    normalized === "review" ||
    normalized === "received_by_asa" ||
    normalized === "received"
  ) {
    return "status-badge status-badge--pending";
  }

  return "status-badge";
}

function formatWorkflowStatus(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US");
}

function boolToYesNo(value) {
  if (value === null || value === undefined) return "Not provided";
  return value ? "Yes" : "No";
}

function getExamIssueSummary(record) {
  const requestedDate = record.requested_exam_date;
  const requestedTime = record.requested_start_time || "Unknown time";
  const workflowStatus = formatWorkflowStatus(record.workflow_status);
  const staffStatus = formatWorkflowStatus(record.staff_status);

  return `Requested ${formatDate(requestedDate)} at ${requestedTime} · Workflow: ${workflowStatus} · Staff: ${staffStatus}`;
}

function renderError(container, message) {
  container.innerHTML = `
    <article class="staff-record-card">
      <div class="staff-record-card__main">
        <div class="staff-record-card__topline">
          <strong>Could not load exam requests</strong>
          <span class="status-badge">Error</span>
        </div>
        <p class="staff-record-card__summary">${message}</p>
      </div>
    </article>
  `;
}

function renderEmpty(container) {
  container.innerHTML = `
    <article class="staff-record-card">
      <div class="staff-record-card__main">
        <div class="staff-record-card__topline">
          <strong>No exam requests found</strong>
          <span class="status-badge">Empty</span>
        </div>
        <p class="staff-record-card__summary">
          There are currently no exam request records returned by the API.
        </p>
      </div>
    </article>
  `;
}

function buildModal() {
  let modal = document.getElementById("asa-staff-exam-modal");

  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "asa-staff-exam-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="asa-staff-exam-modal-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="asa-staff-exam-modal-title" class="modal-title">Exam Request Details</h2>
          <p class="modal-text">Review the request and update staff workflow status.</p>
        </div>
        <button type="button" class="faculty-modal-close" id="asa-staff-exam-modal-close" aria-label="Close exam request modal">×</button>
      </div>

      <div id="asa-staff-exam-modal-content"></div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function buildModalDetailHtml(record) {
  const facultyDetails = record.exam_request_faculty_response_id
    ? `
      <section class="form-section">
        <h3 class="form-section__title">Faculty Approval Details</h3>
        <div class="letter-preview__document-meta">
          <p><strong>Provided to ASA:</strong> ${record.provided_to_asa_method || "Not provided"}</p>
          <p><strong>Return Method:</strong> ${record.return_method || "Not provided"}</p>
          <p><strong>Approved Exam Date:</strong> ${formatDate(record.approved_exam_date)}</p>
          <p><strong>Approved Start Time:</strong> ${record.approved_start_time || "Not provided"}</p>
          <p><strong>Duration Minutes:</strong> ${record.duration_minutes || "Not provided"}</p>
          <p><strong>Calculator Policy:</strong> ${record.calculator_policy || "Not provided"}</p>
          <p><strong>Notes Sheet Allowed:</strong> ${boolToYesNo(record.notes_sheet_allowed)}</p>
          <p><strong>Notes Sheet Details:</strong> ${record.notes_sheet_details || "None"}</p>
          <p><strong>Preferred Contact:</strong> ${record.preferred_contact_method ? `${formatWorkflowStatus(record.preferred_contact_method)} · ${record.preferred_contact_value || ""}` : "Not provided"}</p>
          <p><strong>Additional Information:</strong> ${record.additional_information || "None"}</p>
          <p><strong>Different Time Approved:</strong> ${boolToYesNo(record.approved_time_diff_acknowledged)}</p>
        </div>
      </section>
    `
    : `
      <section class="form-section">
        <h3 class="form-section__title">Faculty Approval Details</h3>
        <p class="form-help">No faculty response has been submitted for this request yet.</p>
      </section>
    `;

  const actionsHtml = Array.isArray(record.staff_actions) && record.staff_actions.length
    ? `
      <section class="form-section">
        <h3 class="form-section__title">Staff Action History</h3>
        <div class="record-list">
          ${record.staff_actions.map((action) => `
            <article class="record-row">
              <span>
                <strong>${formatWorkflowStatus(action.action_type)}</strong>
                <p>${action.staff_notes || "No notes"} · ${action.acted_by_user_id || "Unknown user"} · ${action.acted_at || ""}</p>
              </span>
              <span class="${getStatusClass(action.to_status)}">${formatWorkflowStatus(action.to_status)}</span>
            </article>
          `).join("")}
        </div>
      </section>
    `
    : "";

  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.subject_code}-${record.course_number} ${record.course_title}</h3>
          <p class="letter-preview__meta">${record.section_code} · Submitted ${record.submitted_at || ""}</p>
        </div>
        <span class="${getStatusClass(record.staff_status || record.workflow_status)}">${formatWorkflowStatus(record.staff_status || record.workflow_status)}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.student_first_name} ${record.student_last_name}</p>
          <p><strong>Student ID:</strong> ${record.institution_student_id}</p>
          <p><strong>Student Email:</strong> ${record.student_email || "Not provided"}</p>
          <p><strong>Instructor:</strong> ${record.instructor_first_name ? `${record.instructor_first_name} ${record.instructor_last_name}` : "Not provided"}</p>
          <p><strong>Instructor Email:</strong> ${record.instructor_email || "Not provided"}</p>
          <p><strong>Requested Exam Date:</strong> ${formatDate(record.requested_exam_date)}</p>
          <p><strong>Requested Start Time:</strong> ${record.requested_start_time || "Not provided"}</p>
          <p><strong>Workflow Status:</strong> ${formatWorkflowStatus(record.workflow_status)}</p>
          <p><strong>Staff Status:</strong> ${formatWorkflowStatus(record.staff_status)}</p>
        </div>

        <div class="letter-preview__body">
          <p><strong>Student Notes:</strong> ${record.student_notes || "None"}</p>
        </div>
      </div>
    </section>

    ${facultyDetails}

    <form class="asa-form" id="asa-staff-exam-update-form" novalidate>
      <input type="hidden" id="asa-staff-exam-request-id" value="${record.exam_request_id}" />

      <fieldset class="form-section">
        <legend class="form-section__title">Update Staff Status</legend>

        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="asa-staff-exam-status">
              Staff Status <span class="form-required">*</span>
            </label>
            <select class="form-select" id="asa-staff-exam-status" required>
                <option value="">Select one</option>
                <option value="received_by_asa" ${String(record.staff_status).toLowerCase() === "received_by_asa" ? "selected" : ""}>Received By ASA</option>
                <option value="scheduled" ${String(record.staff_status).toLowerCase() === "scheduled" ? "selected" : ""}>Scheduled</option>
                <option value="completed" ${String(record.staff_status).toLowerCase() === "completed" ? "selected" : ""}>Completed</option>
                <option value="no_show" ${String(record.staff_status).toLowerCase() === "no_show" ? "selected" : ""}>No Show</option>
                <option value="cancelled" ${String(record.staff_status).toLowerCase() === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <label class="form-label" for="asa-staff-exam-notes">
              Staff Notes
            </label>
            <textarea
              class="form-textarea"
              id="asa-staff-exam-notes"
              placeholder="Add scheduling or follow-up notes for this request."
            ></textarea>
          </div>
        </div>
      </fieldset>

      <div class="form-message" id="asa-staff-exam-form-message" hidden aria-live="polite"></div>

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="asa-staff-exam-cancel">Close</button>
        <button type="submit" class="button-primary">Save Staff Update</button>
      </div>
    </form>

    ${actionsHtml}
  `;
}

function initModalBehavior(onSaved) {
  const modal = buildModal();
  const closeButton = document.getElementById("asa-staff-exam-modal-close");

  function closeModal() {
    modal.hidden = true;
    const content = document.getElementById("asa-staff-exam-modal-content");
    if (content) {
      content.innerHTML = "";
    }
  }

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  async function openModal(examRequestId) {
    const content = document.getElementById("asa-staff-exam-modal-content");
    content.innerHTML = `
      <section class="letter-preview">
        <p>Loading request details...</p>
      </section>
    `;
    modal.hidden = false;

    try {
      const response = await fetch(`${API_BASE_URL}/exam-requests/${examRequestId}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status} ${response.statusText}`);
      }

      const record = await response.json();
      content.innerHTML = buildModalDetailHtml(record);

      const form = document.getElementById("asa-staff-exam-update-form");
      const message = document.getElementById("asa-staff-exam-form-message");
      const cancelButton = document.getElementById("asa-staff-exam-cancel");

      cancelButton.addEventListener("click", closeModal);

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const requestIdInput = form.querySelector("#asa-staff-exam-request-id");
        const staffStatusSelect = form.querySelector("#asa-staff-exam-status");
        const staffNotesInput = form.querySelector("#asa-staff-exam-notes");

        if (!requestIdInput || !staffStatusSelect || !staffNotesInput) {
            message.hidden = false;
            message.className = "form-message form-message--error";
            message.textContent = "The exam update form is missing required fields.";
            return;
        }

        const requestId = requestIdInput.value.trim();
        const staffStatus = staffStatusSelect.value.trim();
        const staffNotes = staffNotesInput.value.trim();

        if (!staffStatus) {
            message.hidden = false;
            message.className = "form-message form-message--error";
            message.textContent = "Please select a staff status before saving.";
            staffStatusSelect.focus();
            return;
        }

        try {
            const patchResponse = await fetch(`${API_BASE_URL}/exam-requests/${requestId}/staff-status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                staff_status: staffStatus,
                staff_notes: staffNotes,
                acted_by_user_id: "BONAS\\cchilds"
            })
            });

            const patchJson = await patchResponse.json();

            if (!patchResponse.ok) {
            throw new Error(patchJson.error || `API returned ${patchResponse.status}`);
            }

            message.hidden = false;
            message.className = "form-message form-message--success";
            message.textContent = "Staff update saved successfully.";

            await onSaved();

            window.setTimeout(() => {
            closeModal();
            }, 500);
        } catch (error) {
            message.hidden = false;
            message.className = "form-message form-message--error";
            message.textContent = error.message;
        }
        });
    } catch (error) {
      content.innerHTML = `
        <section class="letter-preview">
          <p>Could not load request details: ${error.message}</p>
        </section>
      `;
    }
  }

  return { openModal };
}

function renderExamRequests(container, records, modalController) {
  if (!records.length) {
    renderEmpty(container);
    return;
  }

  container.innerHTML = records
    .map((record) => {
      const courseLabel = `${record.subject_code}-${record.course_number}${record.section_code ? ` / ${record.section_code}` : ""}`;
      const studentName = `${record.student_first_name} ${record.student_last_name}`;
      const visibleStatus = formatWorkflowStatus(record.staff_status || record.workflow_status);

      return `
        <article class="staff-record-card">
          <div class="staff-record-card__main">
            <div class="staff-record-card__topline">
              <strong>${courseLabel} · ${studentName}</strong>
              <span class="${getStatusClass(record.staff_status || record.workflow_status)}">${visibleStatus}</span>
            </div>

            <p class="staff-record-card__meta">
              ${record.course_title} · Student ID ${record.institution_student_id}
            </p>

            <p class="staff-record-card__summary">
              ${getExamIssueSummary(record)}
            </p>

            <p class="staff-record-card__summary">
              ${record.student_notes || "No student notes provided."}
            </p>
          </div>

          <div class="staff-record-card__actions">
            <button
              class="button-secondary"
              type="button"
              data-exam-request-id="${record.exam_request_id}"
            >
              Open Request
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll("[data-exam-request-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const requestId = button.getAttribute("data-exam-request-id");
      modalController.openModal(requestId);
    });
  });
}

export async function initAsaStaffExamRequests() {
  const container = document.getElementById("asa-staff-exam-request-list");
  if (!container) return;

  const modalController = initModalBehavior(loadAndRender);

  async function loadAndRender() {
    try {
      const response = await fetch(`${API_BASE_URL}/exam-requests`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status} ${response.statusText}`);
      }

      const records = await response.json();
      renderExamRequests(container, records, modalController);
    } catch (error) {
      console.error("Failed to load ASA staff exam requests:", error);
      renderError(container, error.message);
    }
  }

  await loadAndRender();
}