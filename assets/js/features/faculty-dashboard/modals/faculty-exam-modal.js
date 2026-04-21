export function buildFacultyExamModal() {
  if (document.getElementById("faculty-exam-request-modal")) {
    return document.getElementById("faculty-exam-request-modal");
  }

  const minuteOptions = Array.from({ length: 12 }, (_, index) => {
    const value = String(index * 5).padStart(2, "0");
    return `<option value="${value}">${value}</option>`;
  }).join("");

  const durationOptions = Array.from({ length: 36 }, (_, index) => {
    const minutes = (index + 1) * 5;
    return `<option value="${minutes}">${minutes} minutes</option>`;
  }).join("");

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "faculty-exam-request-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="faculty-exam-modal-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="faculty-exam-modal-title" class="modal-title">Faculty Exam Request Review</h2>
          <p class="modal-text">Complete the faculty-only exam delivery details for this request.</p>
        </div>
        <button type="button" class="faculty-modal-close" id="faculty-exam-modal-close" aria-label="Close exam request modal">×</button>
      </div>

      <div id="faculty-exam-modal-record-summary"></div>

      <form class="asa-form" id="faculty-exam-request-form" novalidate>
        <input type="hidden" id="faculty-exam-request-id" />
        <input type="hidden" id="faculty-requested-exam-date" />
        <input type="hidden" id="faculty-requested-exam-time" />

        <fieldset class="form-section">
          <legend class="form-section__title">Exam Delivery to ASA</legend>

          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-delivery-method">
                Method of Providing the Exam to ASA <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-delivery-method" required>
                <option value="">Select one</option>
                <option value="upload">Uploaded file</option>
                <option value="email">Email asaexams@sbu.edu</option>
                <option value="deliver_office">Deliver to ASA office</option>
                <option value="moodle_online">Student access on Moodle / online</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Exam Schedule</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="faculty-approved-exam-date">
                Approved Exam Date <span class="form-required">*</span>
              </label>
              <input class="form-input" id="faculty-approved-exam-date" type="date" required />
            </div>

            <div class="form-field form-field--full">
              <span class="form-label">Approved Start Time <span class="form-required">*</span></span>
              <div class="faculty-time-selectors">
                <select class="form-select" id="faculty-approved-exam-hour" required>
                  <option value="">Hour</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>

                <select class="form-select" id="faculty-approved-exam-minute" required>
                  <option value="">Minute</option>
                  ${minuteOptions}
                </select>

                <select class="form-select" id="faculty-approved-exam-meridiem" required>
                  <option value="">AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-exam-duration">
                Time Allowed for Student <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-exam-duration" required>
                <option value="">Select duration</option>
                ${durationOptions}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Completed Exam Return Method</legend>

          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-return-method">
                Method of Return for the Completed Exam <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-return-method" required>
                <option value="">Select one</option>
                <option value="interoffice_mail">Interoffice mail</option>
                <option value="scan_email">Scan and email</option>
                <option value="pickup">Pick up exam in person</option>
                <option value="moodle_online">Moodle / online submission</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Exam Conditions</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="faculty-calculator-allowed">
                Calculator Allowed? <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-calculator-allowed" required>
                <option value="">Select one</option>
                <option value="none">No calculator</option>
                <option value="any">Any calculator</option>
                <option value="scientific">Scientific only</option>
                <option value="basic">Basic only</option>
              </select>
            </div>

            <div class="form-field form-field--full">
              <span class="form-label">Notes Sheet? <span class="form-required">*</span></span>
              <div class="faculty-inline-options">
                <label class="form-checkbox">
                  <input type="radio" name="faculty_notes_sheet" value="yes" required />
                  <span>Yes</span>
                </label>

                <label class="form-checkbox">
                  <input type="radio" name="faculty_notes_sheet" value="no" required />
                  <span>No</span>
                </label>
              </div>
            </div>

            <div class="form-field form-field--full" id="faculty-notes-sheet-details-field" hidden>
              <label class="form-label" for="faculty-notes-sheet-details">
                Notes Sheet Details
              </label>
              <textarea
                class="form-textarea"
                id="faculty-notes-sheet-details"
                placeholder="Describe the allowed note sheet, such as size, format, or limitations."
              ></textarea>
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Preferred Method of Contact</legend>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label" for="faculty-contact-method">
                Preferred Method of Contact <span class="form-required">*</span>
              </label>
              <select class="form-select" id="faculty-contact-method" required>
                <option value="">Select one</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label" for="faculty-contact-value">
                Contact Details <span class="form-required">*</span>
              </label>
              <input
                class="form-input"
                id="faculty-contact-value"
                type="text"
                required
                placeholder="Enter email address or phone number"
              />
            </div>
          </div>
        </fieldset>

        <fieldset class="form-section">
          <legend class="form-section__title">Additional Instructions</legend>

          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-label" for="faculty-additional-information">
                Any Additional Information
              </label>
              <textarea
                class="form-textarea"
                id="faculty-additional-information"
                placeholder="Add any other instructions for ASA regarding this exam."
              ></textarea>
            </div>
          </div>
        </fieldset>

        <div class="form-message" id="faculty-exam-request-message" hidden aria-live="polite"></div>

        <div class="modal-actions">
          <button type="button" class="button-secondary" id="faculty-exam-request-cancel">Cancel</button>
          <button type="submit" class="button-primary">Submit Approval Form</button>
        </div>
      </form>
    </div>

    <div class="modal-dialog modal-dialog--faculty-warning" id="faculty-exam-time-warning-dialog" role="dialog" aria-modal="true" aria-labelledby="faculty-exam-time-warning-title" hidden>
      <h2 id="faculty-exam-time-warning-title" class="modal-title">Different Exam Time/Date Approval</h2>
      <p class="modal-text">
        The approved exam day or time is different from the student's originally requested exam schedule.
      </p>
      <label class="form-checkbox modal-checkbox">
        <input type="checkbox" id="faculty-time-change-approved" />
        <span>I approve the student to take the exam at a time/day different than the rest of the class.</span>
      </label>
      <div class="modal-actions">
        <button type="button" class="button-secondary" id="faculty-time-change-cancel">Go Back</button>
        <button type="button" class="button-primary" id="faculty-time-change-confirm" disabled>Continue Submission</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

export function initFacultyExamModal({
  renderAll,
  fetchExamRequestDetail,
  normalizeExamRequestDetail,
  getPreferenceByCourseId,
  getStatusClass,
  submitExamFacultyResponse
}) {
  const modal = buildFacultyExamModal();
  const form = document.getElementById("faculty-exam-request-form");
  const closeButton = document.getElementById("faculty-exam-modal-close");
  const cancelButton = document.getElementById("faculty-exam-request-cancel");
  const message = document.getElementById("faculty-exam-request-message");
  const requestIdField = document.getElementById("faculty-exam-request-id");
  const summaryContainer = document.getElementById("faculty-exam-modal-record-summary");
  const notesSheetDetailsField = document.getElementById("faculty-notes-sheet-details-field");
  const notesSheetDetailsInput = document.getElementById("faculty-notes-sheet-details");

  const requestedExamDateField = document.getElementById("faculty-requested-exam-date");
  const requestedExamTimeField = document.getElementById("faculty-requested-exam-time");
  const approvedExamDateField = document.getElementById("faculty-approved-exam-date");
  const approvedExamHourField = document.getElementById("faculty-approved-exam-hour");
  const approvedExamMinuteField = document.getElementById("faculty-approved-exam-minute");
  const approvedExamMeridiemField = document.getElementById("faculty-approved-exam-meridiem");

  const warningDialog = document.getElementById("faculty-exam-time-warning-dialog");
  const warningCheckbox = document.getElementById("faculty-time-change-approved");
  const warningCancel = document.getElementById("faculty-time-change-cancel");
  const warningConfirm = document.getElementById("faculty-time-change-confirm");

  function hideWarningDialog() {
    if (!warningDialog) return;
    warningDialog.hidden = true;
    if (warningCheckbox) warningCheckbox.checked = false;
    if (warningConfirm) warningConfirm.disabled = true;
  }

  function hideModal() {
    const submitButton = form.querySelector('button[type="submit"]');

    modal.hidden = true;
    form.reset();
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Approval Form";
    }

    Array.from(form.elements).forEach((element) => {
      if (element.type !== "hidden") {
        element.disabled = false;
      }
    });

    notesSheetDetailsField.hidden = true;
    hideWarningDialog();
  }

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  function toggleNotesSheetDetails() {
    const selected = form.querySelector('input[name="faculty_notes_sheet"]:checked');
    const showDetails = selected?.value === "yes";

    notesSheetDetailsField.hidden = !showDetails;

    if (!showDetails) {
      notesSheetDetailsInput.value = "";
    }
  }

  function toTimeString(hour, minute, meridiem) {
    if (!hour || !minute || !meridiem) return "";
    return `${hour}:${minute} ${meridiem}`;
  }

  function parseTimeString(timeString) {
    if (!timeString) {
      return { hour: "", minute: "", meridiem: "" };
    }

    const match = String(timeString).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      return { hour: "", minute: "", meridiem: "" };
    }

    return {
      hour: String(Number(match[1])),
      minute: match[2],
      meridiem: match[3].toUpperCase()
    };
  }

  function hasScheduleDifference() {
    const requestedDate = requestedExamDateField?.value || "";
    const requestedTime = requestedExamTimeField?.value || "";
    const approvedDate = approvedExamDateField?.value || "";
    const approvedTime = toTimeString(
      approvedExamHourField?.value,
      approvedExamMinuteField?.value,
      approvedExamMeridiemField?.value
    );

    return requestedDate !== approvedDate || requestedTime !== approvedTime;
  }

  form.querySelectorAll('input[name="faculty_notes_sheet"]').forEach((radio) => {
    radio.addEventListener("change", toggleNotesSheetDetails);
  });

  if (warningCheckbox && warningConfirm) {
    warningCheckbox.addEventListener("change", () => {
      warningConfirm.disabled = !warningCheckbox.checked;
    });
  }

  if (warningCancel) {
    warningCancel.addEventListener("click", hideWarningDialog);
  }

  closeButton.addEventListener("click", hideModal);
  cancelButton.addEventListener("click", hideModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required faculty exam fields before saving.");
      form.reportValidity();
      return;
    }

    const notesSheetValue =
      form.querySelector('input[name="faculty_notes_sheet"]:checked')?.value || "";

    const payload = {
      provided_to_asa_method: document.getElementById("faculty-delivery-method").value,
      return_method: document.getElementById("faculty-return-method").value,
      approved_exam_date: approvedExamDateField.value,
      approved_start_time: toTimeString(
        approvedExamHourField.value,
        approvedExamMinuteField.value,
        approvedExamMeridiemField.value
      ),
      duration_minutes: document.getElementById("faculty-exam-duration").value,
      calculator_policy: document.getElementById("faculty-calculator-allowed").value,
      notes_sheet_allowed: notesSheetValue === "yes",
      notes_sheet_details: document.getElementById("faculty-notes-sheet-details").value.trim(),
      preferred_contact_method: document.getElementById("faculty-contact-method").value,
      preferred_contact_value: document.getElementById("faculty-contact-value").value.trim(),
      additional_information: document.getElementById("faculty-additional-information").value.trim(),
      approved_time_diff_acknowledged: false,
      submitted_by_user_id: "faculty:mreed@sbu.edu"
    };

    async function persistFacultyResponse(finalPayload) {
      try {
        await submitExamFacultyResponse(requestIdField.value, finalPayload);

        showMessage("success", "Approval form submitted successfully.");

        window.setTimeout(async () => {
          hideModal();
          await renderAll();
        }, 700);
      } catch (error) {
        showMessage("error", error.message);
      }
    }

    if (hasScheduleDifference()) {
      hideWarningDialog();
      warningDialog.hidden = false;

      warningConfirm.onclick = async () => {
        hideWarningDialog();
        await persistFacultyResponse({
          ...payload,
          approved_time_diff_acknowledged: true
        });
      };

      if (warningCancel) {
        warningCancel.onclick = () => {
          hideWarningDialog();
        };
      }

      return;
    }

    await persistFacultyResponse(payload);
  });

  async function openModal(record, course) {
    try {
      const apiDetail = await fetchExamRequestDetail(record.examRequestId || record.id);
      const normalizedRecord = normalizeExamRequestDetail(apiDetail, course.id);
      const preference = getPreferenceByCourseId(course.id);

      requestIdField.value = normalizedRecord.examRequestId || normalizedRecord.id;

      summaryContainer.innerHTML = `
        <section class="letter-preview faculty-exam-modal__summary">
          <div class="letter-preview__header">
            <div>
              <h3 class="letter-preview__title">${normalizedRecord.title}</h3>
              <p class="letter-preview__meta">${course.code}: ${course.title} · Submitted ${normalizedRecord.submittedAt}</p>
            </div>
            <span class="${getStatusClass(normalizedRecord.status)}">${normalizedRecord.status}</span>
          </div>

          <div class="letter-preview__document">
            <div class="letter-preview__document-meta">
              <p><strong>Student:</strong> ${normalizedRecord.studentName}</p>
              <p><strong>Student Email:</strong> ${normalizedRecord.studentEmail}</p>
              <p><strong>Requested Exam Date:</strong> ${normalizedRecord.requestedFor}</p>
              <p><strong>Requested Start Time:</strong> ${normalizedRecord.requestedTime}</p>
            </div>

            <div class="letter-preview__body">
              <p>${normalizedRecord.notes}</p>
            </div>
          </div>
        </section>
      `;

      form.reset();
      message.hidden = true;
      message.textContent = "";
      message.className = "form-message";
      notesSheetDetailsField.hidden = true;
      hideWarningDialog();

      requestedExamDateField.value = normalizedRecord.requestedFor || "";
      requestedExamTimeField.value = normalizedRecord.requestedTime || "";

      if (normalizedRecord.facultyResponse) {
        document.getElementById("faculty-delivery-method").value = normalizedRecord.facultyResponse.deliveryMethod || "";
        document.getElementById("faculty-return-method").value = normalizedRecord.facultyResponse.returnMethod || "";
        document.getElementById("faculty-contact-method").value = normalizedRecord.facultyResponse.preferredContactMethod || "";
        document.getElementById("faculty-contact-value").value = normalizedRecord.facultyResponse.preferredContactValue || "";
        approvedExamDateField.value = normalizedRecord.facultyResponse.approvedExamDate || normalizedRecord.requestedFor || "";

        const parsedApprovedTime = parseTimeString(
          normalizedRecord.facultyResponse.approvedExamTime || normalizedRecord.requestedTime || ""
        );

        approvedExamHourField.value = parsedApprovedTime.hour;
        approvedExamMinuteField.value = parsedApprovedTime.minute;
        approvedExamMeridiemField.value = parsedApprovedTime.meridiem;

        document.getElementById("faculty-exam-duration").value = normalizedRecord.facultyResponse.examDuration || "";
        document.getElementById("faculty-calculator-allowed").value = normalizedRecord.facultyResponse.calculatorAllowed || "";

        const notesRadio = form.querySelector(
          `input[name="faculty_notes_sheet"][value="${normalizedRecord.facultyResponse.notesSheet}"]`
        );
        if (notesRadio) {
          notesRadio.checked = true;
        }

        document.getElementById("faculty-notes-sheet-details").value =
          normalizedRecord.facultyResponse.notesSheetDetails || "";

        document.getElementById("faculty-additional-information").value =
          normalizedRecord.facultyResponse.additionalInformation || "";

        toggleNotesSheetDetails();
      } else {
        approvedExamDateField.value = normalizedRecord.requestedFor || "";

        const parsedRequestedTime = parseTimeString(normalizedRecord.requestedTime || "");
        approvedExamHourField.value = parsedRequestedTime.hour;
        approvedExamMinuteField.value = parsedRequestedTime.minute;
        approvedExamMeridiemField.value = parsedRequestedTime.meridiem;

        document.getElementById("faculty-delivery-method").value = preference?.deliveryMethod || "";
        document.getElementById("faculty-return-method").value = preference?.returnMethod || "";
        document.getElementById("faculty-calculator-allowed").value = preference?.calculatorAllowed || "";
        document.getElementById("faculty-contact-method").value = preference?.preferredContactMethod || "";
        document.getElementById("faculty-contact-value").value = preference?.preferredContactValue || "";
        document.getElementById("faculty-additional-information").value = preference?.additionalInformation || "";

        if (preference?.notesSheet) {
          const prefNotesRadio = form.querySelector(
            `input[name="faculty_notes_sheet"][value="${preference.notesSheet}"]`
          );
          if (prefNotesRadio) {
            prefNotesRadio.checked = true;
          }
        }

        document.getElementById("faculty-notes-sheet-details").value =
          preference?.notesSheetDetails || "";

        toggleNotesSheetDetails();
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const isNoShow = String(normalizedRecord.status).toLowerCase() === "no show";

      if (submitButton) {
        submitButton.disabled = isNoShow;
        submitButton.textContent = isNoShow ? "Marked No Show by ASA" : "Submit Approval Form";
      }

      Array.from(form.elements).forEach((element) => {
        if (element.tagName === "BUTTON" && element.type === "button") return;
        if (element.id === "faculty-exam-request-cancel") return;
        if (element.type === "hidden") return;

        if (element !== submitButton) {
          element.disabled = isNoShow;
        }
      });

      modal.hidden = false;
    } catch (error) {
      showMessage("error", `Could not load exam request details. ${error.message}`);
      modal.hidden = false;
    }
  }

  return { openModal };
}