const facultyCourses = [
  {
    id: "eng220",
    code: "ENG-220",
    title: "Writing in Society",
    semester: "Spring 2026",
    enrollment: 22,
    status: "Active"
  },
  {
    id: "psy101",
    code: "PSY-101",
    title: "Intro to Psychology",
    semester: "Spring 2026",
    enrollment: 31,
    status: "Active"
  },
  {
    id: "fye100",
    code: "FYE-100",
    title: "First Year Seminar",
    semester: "Spring 2026",
    enrollment: 18,
    status: "Active"
  }
];

const facultyCourseSectionMap = {
  eng220: "SEC-ENG220-01",
  psy101: "SEC-PSY101-01",
  fye100: "SEC-FYE100-01"
};

const API_BASE_URL = "http://127.0.0.1:5050/api";

let facultyExamRequestsCache = [];
let facultyUploadedExamsCache = [];

const facultyLetters = [
  {
    id: "letter-eng220-1",
    courseId: "eng220",
    title: "Jordan Williams Accommodation Notice",
    receivedAt: "04/12/2026",
    status: "Unread",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing",
      "Note-Taking Support"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for ENG-220."
  },
  {
    id: "letter-psy101-1",
    courseId: "psy101",
    title: "Jordan Williams Accommodation Notice",
    receivedAt: "04/11/2026",
    status: "Read",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for PSY-101."
  },
  {
    id: "letter-fye100-1",
    courseId: "fye100",
    title: "Casey Martin Accommodation Notice",
    receivedAt: "04/08/2026",
    status: "Read",
    studentName: "Casey Martin",
    studentId: "900456789",
    studentEmail: "casey.martin@sbu.edu",
    accommodations: [
      "Accessible Seating",
      "Lecture Recording"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for FYE-100."
  }
];

const facultyExamPreferences = [
  {
    id: "preference-psy101-1",
    courseId: "psy101",
    title: "PSY-101 Exam Delivery Preference",
    status: "Saved",
    preference: "Standard paper exam with Scantron answer sheet",
    notes: "Return completed Scantron and written packet to instructor mailbox.",
    deliveryMethod: "upload",
    returnMethod: "interoffice_mail",
    calculatorAllowed: "scientific",
    notesSheet: "yes",
    notesSheetDetails: "One handwritten 8.5 x 11 sheet, front only.",
    preferredContactMethod: "email",
    preferredContactValue: "psycfaculty@sbu.edu",
    additionalInformation: "Default to the department email for routine coordination."
  },
  {
    id: "preference-eng220-1",
    courseId: "eng220",
    title: "ENG-220 Exam Delivery Preference",
    status: "Saved",
    preference: "Word document with instructor notes attached",
    notes: "Spellcheck allowed only if specifically approved in the student letter.",
    deliveryMethod: "email",
    returnMethod: "scan_email",
    calculatorAllowed: "none",
    notesSheet: "no",
    notesSheetDetails: "",
    preferredContactMethod: "email",
    preferredContactValue: "mreed@sbu.edu",
    additionalInformation: "Email completed materials back as PDF plus Word file when applicable."
  },
  {
    id: "preference-fye100-1",
    courseId: "fye100",
    title: "FYE-100 Exam Delivery Preference",
    status: "Saved",
    preference: "Printed paper exam",
    notes: "Default printed exam workflow for first-year seminar assessments.",
    deliveryMethod: "deliver_office",
    returnMethod: "pickup",
    calculatorAllowed: "none",
    notesSheet: "no",
    notesSheetDetails: "",
    preferredContactMethod: "phone",
    preferredContactValue: "(716) 555-0188",
    additionalInformation: "Call for any day-of changes."
  }
];

async function fetchExamRequestsBySection(sourceSectionId) {
  const response = await fetch(
    `${API_BASE_URL}/exam-requests?source_section_id=${encodeURIComponent(sourceSectionId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchExamRequestDetail(examRequestId) {
  const response = await fetch(
    `${API_BASE_URL}/exam-requests/${encodeURIComponent(examRequestId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchUploadedExamsBySection(sourceSectionId) {
  const response = await fetch(
    `${API_BASE_URL}/uploaded-exams?source_section_id=${encodeURIComponent(sourceSectionId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function mapWorkflowStatusToFacultyBadge(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "faculty_approved") return "Approved";
  if (normalized === "faculty_review") return "Review";
  if (normalized === "no_show") return "No Show";
  if (normalized === "received_by_asa") return "Received";
  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";

  return status || "Review";
}

function normalizeExamRequestSummary(record, selectedCourseId) {
  return {
    id: record.exam_request_id,
    examRequestId: record.exam_request_id,
    courseId: selectedCourseId,
    title: `${record.subject_code}-${record.course_number} Exam Request`,
    submittedAt: record.submitted_at,
    requestedFor: record.requested_exam_date,
    requestedTime: record.requested_start_time,
    status: mapWorkflowStatusToFacultyBadge(record.workflow_status),
    studentName: `${record.student_first_name} ${record.student_last_name}`,
    studentEmail: record.student_email,
    notes: record.student_notes || "",
    facultyResponse: null
  };
}

function normalizeExamRequestDetail(record, selectedCourseId) {
  return {
    id: record.exam_request_id,
    examRequestId: record.exam_request_id,
    courseId: selectedCourseId,
    title: `${record.subject_code}-${record.course_number} Exam Request`,
    submittedAt: record.submitted_at,
    requestedFor: record.requested_exam_date,
    requestedTime: record.requested_start_time,
    status: mapWorkflowStatusToFacultyBadge(record.workflow_status),
    studentName: `${record.student_first_name} ${record.student_last_name}`,
    studentEmail: record.student_email,
    notes: record.student_notes || "",
    facultyResponse: record.exam_request_faculty_response_id
      ? {
          deliveryMethod: record.provided_to_asa_method || "",
          returnMethod: record.return_method || "",
          approvedExamDate: record.approved_exam_date || "",
          approvedExamTime: record.approved_start_time || "",
          examDuration: record.duration_minutes ? String(record.duration_minutes) : "",
          calculatorAllowed: record.calculator_policy || "",
          notesSheet: record.notes_sheet_allowed ? "yes" : "no",
          notesSheetDetails: record.notes_sheet_details || "",
          preferredContactMethod: record.preferred_contact_method || "",
          preferredContactValue: record.preferred_contact_value || "",
          additionalInformation: record.additional_information || ""
        }
      : null
  };
}

function normalizeUploadedExamSummary(record, selectedCourseId) {
  return {
    id: record.uploaded_exam_id,
    courseId: selectedCourseId,
    title: record.title,
    uploadedAt: record.uploaded_at,
    status: "On File",
    fileName: record.file_name,
    deliveryMethod: record.delivery_method,
    notes: record.notes || "",
    classExamDate: record.class_exam_date || "",
    classExamTime: record.class_exam_time || ""
  };
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "read") {
    return "status-badge status-badge--read";
  }

  if (normalized === "no show") {
    return "status-badge status-badge--no-show";
  }

  if (
    normalized === "approved" ||
    normalized === "saved" ||
    normalized === "on file" ||
    normalized === "scheduled" ||
    normalized === "completed" ||
    normalized === "received"
  ) {
    return "status-badge status-badge--success";
  }

  if (
    normalized === "pending" ||
    normalized === "unread" ||
    normalized === "review"
  ) {
    return "status-badge status-badge--pending";
  }

  return "status-badge";
}

function getCourseById(courseId) {
  return facultyCourses.find((course) => course.id === courseId) || null;
}

function getPreferenceByCourseId(courseId) {
  return facultyExamPreferences.find((preference) => preference.courseId === courseId) || null;
}

function setTabLockState(panel, isUnlocked) {
  const gatedTabs = panel.querySelectorAll('.tab-panel__tab[data-requires-course="true"]');

  gatedTabs.forEach((tab) => {
    tab.disabled = !isUnlocked;
    tab.setAttribute("aria-disabled", String(!isUnlocked));
  });
}

function renderCourseContext(course, element) {
  if (!element) return;

  if (!course) {
    element.innerHTML = `
      <div class="faculty-context-banner faculty-context-banner--empty">
        No course selected.
      </div>
    `;
    return;
  }

  element.innerHTML = `
    <div class="faculty-context-banner">
      Showing records for <strong>${course.code}: ${course.title}</strong> · ${course.semester}
    </div>
  `;
}

function renderAllCourseContexts(course) {
  renderCourseContext(course, document.getElementById("faculty-course-context-letters"));
  renderCourseContext(course, document.getElementById("faculty-course-context-exams"));
  renderCourseContext(course, document.getElementById("faculty-course-context-uploaded"));
  renderCourseContext(course, document.getElementById("faculty-course-context-preferences"));

  const selectionBanner = document.getElementById("faculty-course-selection-banner");
  if (!selectionBanner) return;

  selectionBanner.textContent = course
    ? `Selected course: ${course.code}: ${course.title}. The other faculty tabs are now unlocked.`
    : "Select a course to unlock the rest of the faculty dashboard.";
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="faculty-empty-state">${message}</div>`;
}

function renderCourses(panel, selectedCourseId, onSelect) {
  const courseList = panel.querySelector("#faculty-course-list");
  if (!courseList) return;

  courseList.innerHTML = "";

  facultyCourses.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive faculty-course-card";
    button.setAttribute("aria-pressed", String(selectedCourseId === course.id));

    if (selectedCourseId === course.id) {
      button.classList.add("faculty-course-card--selected");
    }

    button.innerHTML = `
      <span>
        <strong>${course.code}: ${course.title}</strong>
        <p>${course.semester} · ${course.enrollment} enrolled students</p>
      </span>
      <span class="${getStatusClass(course.status)}">${course.status}</span>
    `;

    button.addEventListener("click", () => onSelect(course.id));

    courseList.appendChild(button);
  });
}

function switchToTab(panel, targetId) {
  const tabButton = panel.querySelector(`.tab-panel__tab[data-tab-target="${targetId}"]`);
  const tabButtons = panel.querySelectorAll(".tab-panel__tab");
  const tabPanels = panel.querySelectorAll(".tab-panel__content");

  if (!tabButton || tabButton.disabled) return;

  tabButtons.forEach((button) => {
    const isActive = button === tabButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  tabPanels.forEach((tabPanel) => {
    const isActive = tabPanel.id === targetId;
    tabPanel.classList.toggle("is-active", isActive);
    tabPanel.hidden = !isActive;
  });
}

function buildSharedModal(id, title) {
  let modal = document.getElementById(id);
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = id;
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="${id}-title" class="modal-title">${title}</h2>
        </div>
        <button type="button" class="faculty-modal-close" data-modal-close="${id}" aria-label="Close modal">×</button>
      </div>
      <div id="${id}-content"></div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initReadOnlyModal(id, title) {
  const modal = buildSharedModal(id, title);
  const content = document.getElementById(`${id}-content`);
  const closeButton = modal.querySelector(`[data-modal-close="${id}"]`);

  function closeModal() {
    modal.hidden = true;
    content.innerHTML = "";
  }

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  function openModal(html) {
    content.innerHTML = html;
    modal.hidden = false;
  }

  return { openModal, closeModal };
}

function buildLetterModalHtml(record, course) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title}</h3>
          <p class="letter-preview__meta">${course.code} · Received ${record.receivedAt}</p>
        </div>
        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>Student:</strong> ${record.studentName}</p>
          <p><strong>SBU ID:</strong> ${record.studentId}</p>
          <p><strong>Student Email:</strong> ${record.studentEmail}</p>
          <p><strong>Course:</strong> ${course.code}: ${course.title}</p>
        </div>

        <div class="letter-preview__body">
          <p>${record.summary}</p>
          <p><strong>Approved accommodations:</strong></p>
          <ul class="letter-preview__list">
            ${record.accommodations.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
  `;
}

function buildUploadedExamModalHtml(record, course) {
  return `
    <section class="letter-preview">
      <div class="letter-preview__header">
        <div>
          <h3 class="letter-preview__title">${record.title}</h3>
          <p class="letter-preview__meta">${course.code} · Uploaded ${record.uploadedAt}</p>
        </div>
        <span class="${getStatusClass(record.status)}">${record.status}</span>
      </div>

      <div class="letter-preview__document">
        <div class="letter-preview__document-meta">
          <p><strong>File Name:</strong> ${record.fileName}</p>
          <p><strong>Delivery Method:</strong> ${record.deliveryMethod}</p>
          <p><strong>Class Exam Date:</strong> ${record.classExamDate || "Not provided"}</p>
          <p><strong>Class Exam Time:</strong> ${record.classExamTime || "Not provided"}</p>
          <p><strong>Course:</strong> ${course.code}: ${course.title}</p>
        </div>

        <div class="letter-preview__body">
          <p>${record.notes}</p>
        </div>
      </div>
    </section>
  `;
}

function renderModalList(records, listContainer, course, openModal, rowDescriptionBuilder) {
  if (!listContainer) return;

  listContainer.innerHTML = "";

  if (!course) {
    renderEmptyState(listContainer, "Select a course in the My Courses tab to view these records.");
    return;
  }

  if (!records.length) {
    renderEmptyState(listContainer, "No records are available for the selected course.");
    return;
  }

  records.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-row record-row--interactive";

    button.innerHTML = `
      <span>
        <strong>${record.title}</strong>
        <p>${rowDescriptionBuilder(record)}</p>
      </span>
      <span class="${getStatusClass(record.status)}">${record.status}</span>
    `;

    button.addEventListener("click", () => {
      openModal(record, course);
    });

    listContainer.appendChild(button);
  });
}

function buildFacultyUploadExamModal() {
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
          <p class="modal-text">Uploaded exam creation is not API-backed yet.</p>
        </div>
        <button type="button" class="faculty-modal-close" id="faculty-upload-exam-modal-close" aria-label="Close upload exam modal">×</button>
      </div>

      <div class="letter-preview">
        <p>This tab is now reading uploaded exams from the database. Create/upload persistence is the next step.</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function initFacultyUploadExamModal() {
  const modal = buildFacultyUploadExamModal();
  const closeButton = document.getElementById("faculty-upload-exam-modal-close");

  function closeModal() {
    modal.hidden = true;
  }

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  function openModal() {
    modal.hidden = false;
  }

  return { openModal };
}

function renderUploadedExamToolbar() {
  const toolbar = document.getElementById("faculty-uploaded-exam-toolbar");
  if (!toolbar) return;

  toolbar.innerHTML = "";
}

function renderPreferenceForm(course, onSave) {
  const container = document.getElementById("faculty-preference-list");
  if (!container) return;

  container.innerHTML = "";

  if (!course) {
    renderEmptyState(container, "Select a course in the My Courses tab to edit exam preferences.");
    return;
  }

  const preference = getPreferenceByCourseId(course.id);

  if (!preference) {
    renderEmptyState(container, "No exam preference record was found for the selected course.");
    return;
  }

  container.innerHTML = `
    <form class="asa-form" id="faculty-exam-preference-form" novalidate>
      <fieldset class="form-section">
        <legend class="form-section__title">Default Delivery Preferences</legend>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label class="form-label" for="faculty-pref-delivery-method">
              Default Method of Providing the Exam to ASA <span class="form-required">*</span>
            </label>
            <select class="form-select" id="faculty-pref-delivery-method" required>
              <option value="">Select one</option>
              <option value="upload">Uploaded file</option>
              <option value="email">Email asaexams@sbu.edu</option>
              <option value="deliver_office">Deliver to ASA office</option>
              <option value="moodle_online">Student access on Moodle / online</option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <label class="form-label" for="faculty-pref-return-method">
              Default Method of Return for the Completed Exam <span class="form-required">*</span>
            </label>
            <select class="form-select" id="faculty-pref-return-method" required>
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
        <legend class="form-section__title">Default Exam Conditions</legend>

        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="faculty-pref-calculator-allowed">
              Default Calculator Allowed? <span class="form-required">*</span>
            </label>
            <select class="form-select" id="faculty-pref-calculator-allowed" required>
              <option value="">Select one</option>
              <option value="none">No calculator</option>
              <option value="any">Any calculator</option>
              <option value="scientific">Scientific only</option>
              <option value="basic">Basic only</option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <span class="form-label">Default Notes Sheet? <span class="form-required">*</span></span>
            <div class="faculty-inline-options">
              <label class="form-checkbox">
                <input type="radio" name="faculty_pref_notes_sheet" value="yes" required />
                <span>Yes</span>
              </label>

              <label class="form-checkbox">
                <input type="radio" name="faculty_pref_notes_sheet" value="no" required />
                <span>No</span>
              </label>
            </div>
          </div>

          <div class="form-field form-field--full" id="faculty-pref-notes-sheet-details-field" hidden>
            <label class="form-label" for="faculty-pref-notes-sheet-details">
              Default Notes Sheet Details
            </label>
            <textarea
              class="form-textarea"
              id="faculty-pref-notes-sheet-details"
              placeholder="Describe the default allowed note sheet."
            ></textarea>
          </div>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend class="form-section__title">Default Contact Preference</legend>

        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="faculty-pref-contact-method">
              Preferred Method of Contact <span class="form-required">*</span>
            </label>
            <select class="form-select" id="faculty-pref-contact-method" required>
              <option value="">Select one</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div class="form-field">
            <label class="form-label" for="faculty-pref-contact-value">
              Contact Details <span class="form-required">*</span>
            </label>
            <input
              class="form-input"
              id="faculty-pref-contact-value"
              type="text"
              required
              placeholder="Enter email address or phone number"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend class="form-section__title">Default Additional Instructions</legend>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label class="form-label" for="faculty-pref-additional-information">
              Default Additional Information
            </label>
            <textarea
              class="form-textarea"
              id="faculty-pref-additional-information"
              placeholder="Add any standing instructions to prefill future exam request forms."
            ></textarea>
          </div>
        </div>
      </fieldset>

      <div class="form-message" id="faculty-preference-message" hidden aria-live="polite"></div>

      <div class="form-actions">
        <button type="submit" class="button-primary">Save Exam Preferences</button>
      </div>
    </form>
  `;

  const form = document.getElementById("faculty-exam-preference-form");
  const message = document.getElementById("faculty-preference-message");
  const notesDetailsField = document.getElementById("faculty-pref-notes-sheet-details-field");
  const notesDetailsInput = document.getElementById("faculty-pref-notes-sheet-details");

  function showMessage(type, text) {
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  function toggleNotesDetails() {
    const selected = form.querySelector('input[name="faculty_pref_notes_sheet"]:checked');
    const showDetails = selected?.value === "yes";
    notesDetailsField.hidden = !showDetails;

    if (!showDetails) {
      notesDetailsInput.value = "";
    }
  }

  document.getElementById("faculty-pref-delivery-method").value = preference.deliveryMethod || "";
  document.getElementById("faculty-pref-return-method").value = preference.returnMethod || "";
  document.getElementById("faculty-pref-calculator-allowed").value = preference.calculatorAllowed || "";
  document.getElementById("faculty-pref-contact-method").value = preference.preferredContactMethod || "";
  document.getElementById("faculty-pref-contact-value").value = preference.preferredContactValue || "";
  document.getElementById("faculty-pref-additional-information").value = preference.additionalInformation || "";
  document.getElementById("faculty-pref-notes-sheet-details").value = preference.notesSheetDetails || "";

  const notesRadio = form.querySelector(
    `input[name="faculty_pref_notes_sheet"][value="${preference.notesSheet || "no"}"]`
  );
  if (notesRadio) {
    notesRadio.checked = true;
  }

  toggleNotesDetails();

  form.querySelectorAll('input[name="faculty_pref_notes_sheet"]').forEach((radio) => {
    radio.addEventListener("change", toggleNotesDetails);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required exam preference fields before saving.");
      form.reportValidity();
      return;
    }

    const notesSheetValue =
      form.querySelector('input[name="faculty_pref_notes_sheet"]:checked')?.value || "no";

    preference.deliveryMethod = document.getElementById("faculty-pref-delivery-method").value;
    preference.returnMethod = document.getElementById("faculty-pref-return-method").value;
    preference.calculatorAllowed = document.getElementById("faculty-pref-calculator-allowed").value;
    preference.notesSheet = notesSheetValue;
    preference.notesSheetDetails = document.getElementById("faculty-pref-notes-sheet-details").value.trim();
    preference.preferredContactMethod = document.getElementById("faculty-pref-contact-method").value;
    preference.preferredContactValue = document.getElementById("faculty-pref-contact-value").value.trim();
    preference.additionalInformation = document.getElementById("faculty-pref-additional-information").value.trim();

    showMessage("success", "Exam preferences saved successfully.");

    if (typeof onSave === "function") {
      onSave();
    }
  });
}

function buildFacultyExamModal() {
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

function initFacultyExamModal(renderAll) {
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

    async function submitFacultyResponse(finalPayload) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/exam-requests/${requestIdField.value}/faculty-response`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(finalPayload)
          }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || `API returned ${response.status}`);
        }

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
        await submitFacultyResponse({
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

    await submitFacultyResponse(payload);
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

function updateTabCounter(elementId, count) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = String(count);
  element.hidden = count < 1;
}

function renderFacultyTabCounters(selectedCourseId) {
  const unreadLetterCount = facultyLetters.filter(
    (record) =>
      record.courseId === selectedCourseId &&
      String(record.status || "").toLowerCase() === "unread"
  ).length;

  const unapprovedExamCount = facultyExamRequestsCache.filter(
    (record) =>
      record.courseId === selectedCourseId &&
      String(record.status || "").toLowerCase() === "review"
  ).length;

  updateTabCounter("faculty-letters-counter", unreadLetterCount);
  updateTabCounter("faculty-exams-counter", unapprovedExamCount);
}

export function initFacultyDashboard() {
  const panel = document.getElementById("faculty-dashboard-panel");
  if (!panel) return;

  let selectedCourseId = null;

  const letterModal = initReadOnlyModal("faculty-letter-modal", "Accommodation Letter");
  const uploadedModal = initReadOnlyModal("faculty-uploaded-modal", "Uploaded Exam");
  const examModal = initFacultyExamModal(renderAll);
  const uploadExamModal = initFacultyUploadExamModal();

  async function renderAll() {
    const selectedCourse = getCourseById(selectedCourseId);

    setTabLockState(panel, Boolean(selectedCourse));
    renderAllCourseContexts(selectedCourse);
    renderUploadedExamToolbar();

    renderCourses(panel, selectedCourseId, async (courseId) => {
      selectedCourseId = courseId;
      await renderAll();
      switchToTab(panel, "faculty-tab-letters");
    });

    renderModalList(
      facultyLetters.filter((record) => record.courseId === selectedCourseId),
      document.getElementById("faculty-letter-record-list"),
      selectedCourse,
      async (record, course) => {
        if (String(record.status).toLowerCase() === "unread") {
          record.status = "Read";
          await renderAll();
        }

        letterModal.openModal(buildLetterModalHtml(record, course));
      },
      (record) => `Received ${record.receivedAt}`
    );

    const examRequestListContainer = document.getElementById("faculty-exam-request-list");

    if (!selectedCourseId || !selectedCourse) {
      facultyExamRequestsCache = [];
      renderEmptyState(
        examRequestListContainer,
        "Select a course in the My Courses tab to view these records."
      );
    } else {
      try {
        const sourceSectionId = facultyCourseSectionMap[selectedCourseId];
        const apiExamRequests = sourceSectionId
          ? await fetchExamRequestsBySection(sourceSectionId)
          : [];

        facultyExamRequestsCache = apiExamRequests.map((record) =>
          normalizeExamRequestSummary(record, selectedCourseId)
        );

        renderModalList(
          facultyExamRequestsCache,
          examRequestListContainer,
          selectedCourse,
          (record, course) => examModal.openModal(record, course),
          (record) => `Student request submitted for ${record.requestedFor} at ${record.requestedTime}`
        );
      } catch (error) {
        facultyExamRequestsCache = [];
        renderEmptyState(
          examRequestListContainer,
          `Could not load exam requests from the API. ${error.message}`
        );
      }
    }

    renderFacultyTabCounters(selectedCourseId);

    const uploadedExamListContainer = document.getElementById("faculty-uploaded-exam-list");

    if (!selectedCourseId || !selectedCourse) {
      facultyUploadedExamsCache = [];
      renderEmptyState(
        uploadedExamListContainer,
        "Select a course in the My Courses tab to view these records."
      );
    } else {
      try {
        const sourceSectionId = facultyCourseSectionMap[selectedCourseId];
        const apiUploadedExams = sourceSectionId
          ? await fetchUploadedExamsBySection(sourceSectionId)
          : [];

        facultyUploadedExamsCache = apiUploadedExams.map((record) =>
          normalizeUploadedExamSummary(record, selectedCourseId)
        );

        renderModalList(
          facultyUploadedExamsCache,
          uploadedExamListContainer,
          selectedCourse,
          (record, course) => uploadedModal.openModal(buildUploadedExamModalHtml(record, course)),
          (record) => `Uploaded ${record.uploadedAt}`
        );
      } catch (error) {
        facultyUploadedExamsCache = [];
        renderEmptyState(
          uploadedExamListContainer,
          `Could not load uploaded exams from the API. ${error.message}`
        );
      }
    }

    renderPreferenceForm(selectedCourse, renderAll);

    void uploadExamModal;
  }

  renderAll().catch((error) => {
    console.error("Failed to render faculty dashboard:", error);
  });
}