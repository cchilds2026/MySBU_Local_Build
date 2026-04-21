import {
  fetchExamRequestDetail,
  fetchExamRequests,
  updateExamStaffStatus
} from "./api.js";

import {
  buildModalDetailHtml,
  renderError,
  renderExamRequests
} from "./renderers.js";

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
      const json = await fetchExamRequestDetail(examRequestId);
      content.innerHTML = buildModalDetailHtml(json);

      const form = document.getElementById("asa-staff-exam-update-form");
      const message = document.getElementById("asa-staff-exam-form-message");
      const cancelButton = document.getElementById("asa-staff-exam-cancel");

      cancelButton.addEventListener("click", closeModal);

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const requestIdInput = form.querySelector("#asa-staff-exam-request-id");
        const staffStatusSelect = form.querySelector("#asa-staff-exam-status");
        const staffNotesInput = form.querySelector("#asa-staff-exam-notes");
        const submitButton = form.querySelector('button[type="submit"]');

        if (!requestIdInput || !staffStatusSelect || !staffNotesInput || !message) {
          if (message) {
            message.hidden = false;
            message.className = "form-message form-message--error";
            message.textContent = "The exam update form is missing required fields.";
          }
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
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
          }

          await updateExamStaffStatus(requestId, {
            staff_status: staffStatus,
            staff_notes: staffNotes,
            acted_by_user_id: "BONAS\\cchilds"
          });

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
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Save Staff Update";
          }
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

export async function initAsaStaffExamRequests() {
  const container = document.getElementById("asa-staff-exam-request-list");
  if (!container) return;

  const modalController = initModalBehavior(loadAndRender);

  async function loadAndRender() {
    try {
      const json = await fetchExamRequests();
      renderExamRequests(container, json, modalController);
    } catch (error) {
      console.error("Failed to load ASA staff exam requests:", error);
      renderError(container, error.message);
    }
  }

  await loadAndRender();
}