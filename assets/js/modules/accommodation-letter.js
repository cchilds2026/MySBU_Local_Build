import {
  getAccommodationLetterRecords,
  setAccommodationLetterRecords
} from "../core/state.js";

function formatToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getApprovedAccommodations() {
  return Array.from(document.querySelectorAll(".tag-list .tag"))
    .map((tag) => tag.textContent.trim())
    .filter(Boolean);
}

function getStudentFieldValue(id, fallback = "") {
  const element = document.getElementById(id);
  return element ? element.value.trim() : fallback;
}

function buildSelectedCourseRecords(form, requestModeValue, notesValue) {
  const selectedCourses = Array.from(
    form.querySelectorAll('input[name="courses"]:checked')
  );

  const approvedAccommodations = getApprovedAccommodations();
  const submittedAt = formatToday();
  const studentName = getStudentFieldValue("letter-student-name-display", "Student Name");
  const studentId = getStudentFieldValue("letter-student-id-display", "900123456");
  const studentEmail = getStudentFieldValue("letter-student-email-display", "student@sbu.edu");
  const semester = getStudentFieldValue("letter-semester", "Spring 2026");

  return selectedCourses.map((checkbox) => {
    const card = checkbox.closest(".course-checkbox-card");
    const strong = card?.querySelector("strong");
    const meta = card?.querySelector(".course-checkbox-card__meta");

    const course = strong ? strong.textContent.trim() : checkbox.value;
    const instructor = meta ? meta.textContent.trim() : "Instructor";
    const instructorEmail = `${slugify(instructor).replace(/-/g, "")}@sbu.edu`;

    return {
      id: `letter-${slugify(course)}-${Date.now()}`,
      course,
      instructor,
      instructorEmail,
      submittedAt,
      status: "Sent",
      semester,
      studentName,
      studentId,
      studentEmail,
      accommodations: approvedAccommodations,
      notes: notesValue,
      requestMode: requestModeValue
    };
  });
}

function upsertAccommodationLetterRecords(nextRecords) {
  const existing = getAccommodationLetterRecords();

  const merged = [...nextRecords, ...existing].reduce((accumulator, record) => {
    const alreadyExists = accumulator.some(
      (item) =>
        item.course === record.course &&
        item.semester === record.semester &&
        item.submittedAt === record.submittedAt
    );

    if (!alreadyExists) {
      accumulator.push(record);
    }

    return accumulator;
  }, []);

  setAccommodationLetterRecords(merged);
}

export function initAccommodationLetterForm() {
  const form = document.getElementById("accommodation-letter-form");
  if (!form) return;

  const message = document.getElementById("accommodation-letter-message");
  const acknowledgment = document.getElementById("accommodation-letter-acknowledgment");
  const existingLetterRequest = document.getElementById("existing-letter-request");
  const requestMode = document.getElementById("letter-request-mode");
  const existingRequestConfirmed = document.getElementById("existing-request-confirmed");
  const requestTypeDisplay = document.getElementById("letter-request-type-display");

  const existingRequestModal = document.getElementById("existing-letter-request-modal");
  const existingRequestContinue = document.getElementById("existing-letter-request-continue");
  const existingRequestCancel = document.getElementById("existing-letter-request-cancel");

  function showMessage(type, text) {
    if (!message) return;
    message.hidden = false;
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
  }

  function clearMessage() {
    if (!message) return;
    message.hidden = true;
    message.textContent = "";
    message.className = "form-message";
  }

  function showAcknowledgment() {
    if (acknowledgment) acknowledgment.hidden = false;
  }

  function hideAcknowledgment() {
    if (acknowledgment) acknowledgment.hidden = true;
  }

  function hideExistingRequestModal() {
    if (existingRequestModal) existingRequestModal.hidden = true;
  }

  function showExistingRequestModal() {
    if (existingRequestModal) existingRequestModal.hidden = false;
  }

  function syncRequestMode() {
    const hasExistingRequest = existingLetterRequest?.value === "true";
    const mode = hasExistingRequest ? "update" : "original";

    if (requestMode) requestMode.value = mode;

    if (requestTypeDisplay) {
      requestTypeDisplay.value =
        mode === "update"
          ? "Update to Existing Semester Letters"
          : "Original Semester Letter Request";
    }
  }

  function getUnlockedCourseCheckboxes() {
    return Array.from(form.querySelectorAll('input[name="courses"]:not([data-locked="true"])'));
  }

  function getLockedCourseCheckboxes() {
    return Array.from(form.querySelectorAll('input[name="courses"][data-locked="true"]'));
  }

  function getNewlySelectedCourses() {
    return getUnlockedCourseCheckboxes().filter((checkbox) => checkbox.checked);
  }

  function hasNewlySelectedCourses() {
    return getNewlySelectedCourses().length > 0;
  }

  function hasAnySelectedCourses() {
    return (
      getLockedCourseCheckboxes().length > 0 ||
      getUnlockedCourseCheckboxes().some((checkbox) => checkbox.checked)
    );
  }

  function ensureLockedHiddenInput(courseValue) {
    const existingHidden = Array.from(form.querySelectorAll('input[name="courses_locked"]')).find(
      (input) => input.value === courseValue
    );

    if (existingHidden) return;

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "courses_locked";
    hiddenInput.value = courseValue;
    form.appendChild(hiddenInput);
  }

  function appendLockedStatus(card) {
    if (!card || card.querySelector(".course-checkbox-card__status")) return;

    const textContainer = card.querySelector("span");
    if (!textContainer) return;

    const status = document.createElement("span");
    status.className = "course-checkbox-card__status";
    status.textContent = "Already included in semester request";

    textContainer.appendChild(document.createElement("br"));
    textContainer.appendChild(status);
  }

  function lockSelectedCourses() {
    getNewlySelectedCourses().forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.defaultChecked = true;
      checkbox.disabled = true;
      checkbox.setAttribute("checked", "");
      checkbox.setAttribute("disabled", "");
      checkbox.setAttribute("data-locked", "true");

      ensureLockedHiddenInput(checkbox.value);

      const card = checkbox.closest(".course-checkbox-card");
      if (card) {
        card.classList.add("course-checkbox-card--locked");
        appendLockedStatus(card);
      }
    });
  }

  function resetUnlockedCourses() {
    getUnlockedCourseCheckboxes().forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  function restoreLockedCourses() {
    getLockedCourseCheckboxes().forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.disabled = true;
    });
  }

  function persistSubmittedLetters() {
    const notesField = document.getElementById("letter-notes");
    const notesValue = notesField ? notesField.value.trim() : "";
    const requestModeValue = requestMode?.value || "update";

    const records = buildSelectedCourseRecords(form, requestModeValue, notesValue);

    if (records.length > 0) {
      upsertAccommodationLetterRecords(records);
    }
  }

  function finalizeAccommodationSubmission() {
    hideExistingRequestModal();
    syncRequestMode();

    persistSubmittedLetters();
    lockSelectedCourses();

    if (existingLetterRequest) existingLetterRequest.value = "true";
    if (requestMode) requestMode.value = "update";
    if (existingRequestConfirmed) existingRequestConfirmed.value = "true";

    form.reset();

    window.setTimeout(() => {
      restoreLockedCourses();
      resetUnlockedCourses();
      clearMessage();
      showAcknowledgment();
      window.scrollTo({ top: 0, behavior: "smooth" });
      syncRequestMode();
    }, 0);
  }

  syncRequestMode();
  hideAcknowledgment();

  getUnlockedCourseCheckboxes().forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      clearMessage();
      hideAcknowledgment();
    });
  });

  const notesField = document.getElementById("letter-notes");
  if (notesField) {
    notesField.addEventListener("input", () => {
      clearMessage();
      hideAcknowledgment();
    });
  }

  if (existingRequestContinue) {
    existingRequestContinue.addEventListener("click", () => {
      if (existingRequestConfirmed) existingRequestConfirmed.value = "true";
      hideExistingRequestModal();
    });
  }

  if (existingRequestCancel) {
    existingRequestCancel.addEventListener("click", hideExistingRequestModal);
  }

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      hideExistingRequestModal();
      clearMessage();
      hideAcknowledgment();
      restoreLockedCourses();
      resetUnlockedCourses();
      syncRequestMode();
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    hideExistingRequestModal();
    clearMessage();
    hideAcknowledgment();
    syncRequestMode();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required fields before submitting your request.");
      form.reportValidity();
      return;
    }

    if (requestMode?.value === "update") {
      if (!hasNewlySelectedCourses()) {
        showMessage(
          "error",
          "Please select at least one additional course or instructor before submitting an update."
        );
        return;
      }
    } else if (!hasAnySelectedCourses()) {
      showMessage("error", "Please select at least one course recipient before submitting your request.");
      return;
    }

    finalizeAccommodationSubmission();
  });

  if (existingLetterRequest?.value === "true" && existingRequestConfirmed?.value !== "true") {
    showExistingRequestModal();
  }
}