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
          <p class="modal-text">Create an uploaded exam record for the selected course.</p>
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

            <div class="form-field">
              <label class="form-label" for="faculty-upload-file-name">
                File Name <span class="form-required">*</span>
              </label>
              <input
                class="form-input"
                id="faculty-upload-file-name"
                type="text"
                required
                placeholder="example-midterm.docx"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-upload-mime-type">
                File Type <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-upload-mime-type" required>
                <option value="">Select one</option>
                <option value="application/pdf">PDF</option>
                <option value="application/msword">Word (.doc)</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word (.docx)</option>
                <option value="application/vnd.ms-excel">Excel (.xls)</option>
                <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel (.xlsx)</option>
                <option value="text/plain">Text</option>
              </select>
            </div>

            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-upload-storage-path">
                Storage Path
              </label>
              <input
                class="form-input"
                id="faculty-upload-storage-path"
                type="text"
                placeholder="/demo-storage/exams/example-midterm.docx"
              />
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Exam Delivery Context</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="faculty-upload-delivery-method">
                Delivery Method <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-upload-delivery-method" required>
                <option value="">Select one</option>
                <option value="upload">Uploaded file</option>
                <option value="email">Email</option>
                <option value="deliver_office">Deliver to ASA office</option>
                <option value="moodle_online">Moodle / online</option>
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
                placeholder="Add any notes about this uploaded exam."
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

export function initFacultyUploadExamModal({
  renderAll,
  getSelectedCourseId,
  getCourseById,
  facultyCourseSectionMap,
  createUploadedExam
}) {
  const modal = buildFacultyUploadExamModal();
  const form = document.getElementById("faculty-upload-exam-form");
  const closeButton = document.getElementById("faculty-upload-exam-modal-close");
  const cancelButton = document.getElementById("faculty-upload-exam-cancel");
  const message = document.getElementById("faculty-upload-exam-message");

  function closeModal() {
    const submitButton = form.querySelector('button[type="submit"]');

    modal.hidden = true;
    form.reset();
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";

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

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

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

    const selectedCourseId = typeof getSelectedCourseId === "function" ? getSelectedCourseId() : null;
    const sourceSectionId = selectedCourseId ? facultyCourseSectionMap[selectedCourseId] : "";

    if (!sourceSectionId) {
      showMessage("error", "No course section is selected.");
      return;
    }

    const fileName = document.getElementById("faculty-upload-file-name").value.trim();
    const storagePathInput = document.getElementById("faculty-upload-storage-path").value.trim();

    const payload = {
      source_section_id: sourceSectionId,
      title: document.getElementById("faculty-upload-title").value.trim(),
      file_name: fileName,
      storage_path: storagePathInput || `/demo-storage/exams/${fileName}`,
      mime_type: document.getElementById("faculty-upload-mime-type").value,
      delivery_method: document.getElementById("faculty-upload-delivery-method").value,
      class_exam_date: document.getElementById("faculty-upload-class-exam-date").value || null,
      class_exam_time: document.getElementById("faculty-upload-class-exam-time").value.trim(),
      notes: document.getElementById("faculty-upload-notes").value.trim(),
      uploaded_by_user_id: "faculty:mreed@sbu.edu"
    };

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
      }

      await createUploadedExam(payload);
      showMessage("success", "Uploaded exam saved successfully.");

      window.setTimeout(async () => {
        closeModal();
        await renderAll();
      }, 700);
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      if (submitButton && !modal.hidden) {
        submitButton.disabled = false;
        submitButton.textContent = "Save Uploaded Exam";
      }
    }
  });

  function openModal() {
    const selectedCourseId = typeof getSelectedCourseId === "function" ? getSelectedCourseId() : null;
    const selectedCourse = selectedCourseId ? getCourseById(selectedCourseId) : null;

    if (!selectedCourse) {
      message.hidden = false;
      message.className = "form-message form-message--error";
      message.textContent = "Select a course in the My Courses tab before uploading an exam.";
      modal.hidden = false;
      return;
    }

    form.reset();
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
    modal.hidden = false;
  }

  return { openModal, closeModal };
}