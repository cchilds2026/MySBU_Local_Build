import { getCurrentUser } from "../../../services/current-user-provider.js";
import { portalApi } from "../../../services/portal-api.js";

export function buildFacultyUploadExamModal() {
  if (document.getElementById("faculty-upload-exam-modal")) {
    return document.getElementById("faculty-upload-exam-modal");
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "faculty-upload-exam-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="faculty-upload-exam-modal-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="faculty-upload-exam-modal-title" class="modal-title">Upload Exam</h2>
          <p class="modal-text">
            Upload the exam file for the selected course. The file will be stored through the document upload service, and the uploaded exam record will be created automatically.
          </p>
        </div>
        <button type="button" class="faculty-modal-close" id="faculty-upload-exam-modal-close" aria-label="Close upload exam modal">×</button>
      </div>

      <form class="asa-form" id="faculty-upload-exam-form" novalidate>
        <fieldset class="form-section">
          <legend class="form-section__title">Exam File Details</legend>

          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-upload-title">
                Exam Title <span class="form-required">*</span>
              </label>
              <input
                class="form-input"
                id="faculty-upload-title"
                type="text"
                required
                placeholder="Enter a title for this uploaded exam"
              />
            </div>

            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-upload-file">
                Exam File <span class="form-required">*</span>
              </label>
              <input
                class="form-input"
                id="faculty-upload-file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <p class="form-help-text">
                Select the file to upload. File name and type will be captured automatically.
              </p>
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-upload-file-name">
                File Name
              </label>
              <input
                class="form-input"
                id="faculty-upload-file-name"
                type="text"
                readonly
                placeholder="Will populate from selected file"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-upload-mime-type">
                File Type
              </label>
              <input
                class="form-input"
                id="faculty-upload-mime-type"
                type="text"
                readonly
                placeholder="Will populate from selected file"
              />
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Exam Return Context</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="faculty-upload-delivery-method">
                Return Method <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-upload-delivery-method" required>
                <option value="">Select one</option>
                <option value="scan_and_email">Scan and Email</option>
                <option value="interoffice_mail_only">Interoffice Mail Only</option>
                <option value="pickup_in_person">Pickup In Person</option>
                <option value="moodle_online_submission">Moodle/Online Submission</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-upload-class-exam-date">
                Class Exam Date
              </label>
              <input
                class="form-input"
                id="faculty-upload-class-exam-date"
                type="date"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-upload-class-exam-time">
                Class Exam Time
              </label>
              <input
                class="form-input"
                id="faculty-upload-class-exam-time"
                type="text"
                placeholder="1:00 PM"
              />
            </div>

            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-upload-notes">
                Notes
              </label>
              <textarea
                class="form-textarea"
                id="faculty-upload-notes"
                placeholder="Add any notes about this uploaded exam or return instructions."
              ></textarea>
            </div>
          </div>
        </fieldset>

        <div class="form-message" id="faculty-upload-exam-message" hidden aria-live="polite"></div>

        <div class="modal-actions">
          <button type="button" class="button-secondary" id="faculty-upload-exam-cancel">Cancel</button>
          <button type="submit" class="button-primary">Save Uploaded Exam</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function deriveMimeType(file) {
  if (file?.type) return file.type;

  const fileName = String(file?.name || "").toLowerCase();

  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".doc")) return "application/msword";
  if (fileName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (fileName.endsWith(".xls")) return "application/vnd.ms-excel";
  if (fileName.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (fileName.endsWith(".txt")) return "text/plain";

  return "application/octet-stream";
}

export function initFacultyUploadExamModal({
  renderAll,
  getSelectedCourseId,
  getCourseById,
  getSourceSectionId,
  createUploadedExam
}) {
  const modal = buildFacultyUploadExamModal();
  const form = document.getElementById("faculty-upload-exam-form");
  const closeButton = document.getElementById("faculty-upload-exam-modal-close");
  const cancelButton = document.getElementById("faculty-upload-exam-cancel");
  const message = document.getElementById("faculty-upload-exam-message");

  const fileInput = document.getElementById("faculty-upload-file");
  const fileNameInput = document.getElementById("faculty-upload-file-name");
  const mimeTypeInput = document.getElementById("faculty-upload-mime-type");
  const deliveryMethodInput = document.getElementById("faculty-upload-delivery-method");

  function closeModal() {
    const submitButton = form.querySelector('button[type="submit"]');

    modal.hidden = true;
    form.reset();
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";

    fileNameInput.value = "";
    mimeTypeInput.value = "";
    deliveryMethodInput.value = "";

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Save Uploaded Exam";
    }
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  function syncSelectedFileMetadata() {
    const selectedFile = fileInput?.files?.[0] || null;

    if (!selectedFile) {
      fileNameInput.value = "";
      mimeTypeInput.value = "";
      return;
    }

    fileNameInput.value = selectedFile.name || "";
    mimeTypeInput.value = deriveMimeType(selectedFile);
  }

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  fileInput?.addEventListener("change", syncSelectedFileMetadata);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required uploaded exam fields before saving.");
      form.reportValidity();
      return;
    }

    const selectedCourseId =
      typeof getSelectedCourseId === "function" ? getSelectedCourseId() : null;
    const sourceSectionId =
      typeof getSourceSectionId === "function" ? getSourceSectionId(selectedCourseId) : "";

    if (!selectedCourseId) {
      showMessage("error", "No course is selected.");
      return;
    }

    if (!sourceSectionId) {
      showMessage("error", "No course section is selected.");
      return;
    }

    const selectedFile = fileInput?.files?.[0] || null;
    if (!selectedFile) {
      showMessage("error", "Please select an exam file.");
      return;
    }

    const currentUser = await getCurrentUser().catch(() => null);
    const uploadedByUserId =
      currentUser?.email ||
      currentUser?.user_id ||
      "faculty:unknown";

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Uploading...";
      }

      const uploadFormData = new FormData();
      uploadFormData.append("source_section_id", sourceSectionId);
      uploadFormData.append("file", selectedFile);

      const uploadedFile = await portalApi.uploadUploadedExamFile(uploadFormData);

      if (submitButton) {
        submitButton.textContent = "Saving...";
      }

      const payload = {
        source_section_id: sourceSectionId,
        title: document.getElementById("faculty-upload-title").value.trim(),
        file_name: uploadedFile.file_name || selectedFile.name.trim(),
        storage_path: uploadedFile.storage_path || "",
        sharepoint_file_url: uploadedFile.sharepoint_file_url || "",
        mime_type: uploadedFile.mime_type || deriveMimeType(selectedFile),
        delivery_method: deliveryMethodInput.value,
        class_exam_date:
          document.getElementById("faculty-upload-class-exam-date").value || null,
        class_exam_time:
          document.getElementById("faculty-upload-class-exam-time").value.trim(),
        notes: document.getElementById("faculty-upload-notes").value.trim(),
        uploaded_by_user_id: uploadedByUserId
      };

      await createUploadedExam(payload);
      showMessage("success", "Uploaded exam saved successfully.");

      window.setTimeout(async () => {
        closeModal();
        await renderAll();
      }, 700);
    } catch (error) {
      showMessage("error", error.message || "Could not save uploaded exam.");
    } finally {
      if (submitButton && !modal.hidden) {
        submitButton.disabled = false;
        submitButton.textContent = "Save Uploaded Exam";
      }
    }
  });

  function openModal() {
    const selectedCourseId =
      typeof getSelectedCourseId === "function" ? getSelectedCourseId() : null;
    const selectedCourse = selectedCourseId ? getCourseById(selectedCourseId) : null;

    if (!selectedCourse) {
      message.hidden = false;
      message.className = "form-message form-message--error";
      message.textContent = "Select a course in the My Courses tab before uploading an exam.";
      modal.hidden = false;
      return;
    }

    form.reset();
    fileNameInput.value = "";
    mimeTypeInput.value = "";
    deliveryMethodInput.value = "";
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    modal.hidden = false;
  }

  return { openModal, closeModal };
}