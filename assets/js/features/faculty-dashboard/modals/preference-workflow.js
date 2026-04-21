export function renderPreferenceForm({
  course,
  preferenceModal,
  dashboardState,
  getPreferenceByCourseId,
  getStatusClass,
  renderEmptyState,
  buildPreferenceFormMarkup,
  facultyCourseSectionMap,
  normalizeExamPreference,
  saveExamPreferenceBySection
}) {
  const container = document.getElementById("faculty-preference-list");
  if (!container) return;

  container.innerHTML = "";

  if (!course) {
    renderEmptyState(container, "Select a course in the My Courses tab to manage exam preferences.");
    return;
  }

  const preference = getPreferenceByCourseId(
    dashboardState.facultyExamPreferencesCache,
    course.id
  );

  container.innerHTML = `
    <div class="faculty-preference-launcher">
      <div class="letter-preview">
        <div class="letter-preview__header">
          <div>
            <h3 class="letter-preview__title">${course.code}: ${course.title}</h3>
          </div>
          <span class="${getStatusClass(preference ? "saved" : "pending")}">${preference ? "Saved" : "Not Set"}</span>
        </div>

        <div class="faculty-preference-launcher__footer">
          <button type="button" class="button-primary faculty-preference-launcher__button" id="faculty-open-preferences-modal">
            ${preference ? "Edit Exam Preferences" : "Set Exam Preferences"}
          </button>
        </div>
      </div>
    </div>
  `;

  const openButton = document.getElementById("faculty-open-preferences-modal");
  if (!openButton) return;

  openButton.addEventListener("click", () => {
    const currentPreference =
      getPreferenceByCourseId(dashboardState.facultyExamPreferencesCache, course.id) || {
        id: "",
        courseId: course.id,
        title: `${course.code} Exam Delivery Preference`,
        status: "Draft",
        deliveryMethod: "",
        returnMethod: "",
        calculatorAllowed: "",
        notesSheet: "no",
        notesSheetDetails: "",
        preferredContactMethod: "",
        preferredContactValue: "",
        additionalInformation: ""
      };

    preferenceModal.openModal(buildPreferenceFormMarkup());

    const form = document.getElementById("faculty-exam-preference-form");
    const message = document.getElementById("faculty-preference-message");
    const notesDetailsField = document.getElementById("faculty-pref-notes-sheet-details-field");
    const notesDetailsInput = document.getElementById("faculty-pref-notes-sheet-details");
    const closeFormButton = document.getElementById("faculty-preference-close-button");

    let fadeTimeoutId = null;
    let hideTimeoutId = null;

    function clearMessageTimers() {
      if (fadeTimeoutId) {
        window.clearTimeout(fadeTimeoutId);
        fadeTimeoutId = null;
      }

      if (hideTimeoutId) {
        window.clearTimeout(hideTimeoutId);
        hideTimeoutId = null;
      }
    }

    function showMessage(type, text, options = {}) {
      const {
        autoHide = false,
        visibleMs = 5000,
        fadeMs = 500
      } = options;

      clearMessageTimers();

      message.hidden = false;
      message.className = `form-message form-message--${type}`;
      message.textContent = text;

      if (!autoHide) return;

      fadeTimeoutId = window.setTimeout(() => {
        message.classList.add("form-message--fade-out");
      }, visibleMs);

      hideTimeoutId = window.setTimeout(() => {
        message.hidden = true;
        message.className = "form-message";
        message.textContent = "";
      }, visibleMs + fadeMs);
    }

    function toggleNotesDetails() {
      const selected = form.querySelector('input[name="faculty_pref_notes_sheet"]:checked');
      const showDetails = selected?.value === "yes";
      notesDetailsField.hidden = !showDetails;

      if (!showDetails) {
        notesDetailsInput.value = "";
      }
    }

    document.getElementById("faculty-pref-delivery-method").value = currentPreference.deliveryMethod || "";
    document.getElementById("faculty-pref-return-method").value = currentPreference.returnMethod || "";
    document.getElementById("faculty-pref-calculator-allowed").value = currentPreference.calculatorAllowed || "";
    document.getElementById("faculty-pref-contact-method").value = currentPreference.preferredContactMethod || "";
    document.getElementById("faculty-pref-contact-value").value = currentPreference.preferredContactValue || "";
    document.getElementById("faculty-pref-additional-information").value = currentPreference.additionalInformation || "";
    document.getElementById("faculty-pref-notes-sheet-details").value = currentPreference.notesSheetDetails || "";

    const notesRadio = form.querySelector(
      `input[name="faculty_pref_notes_sheet"][value="${currentPreference.notesSheet || "no"}"]`
    );
    if (notesRadio) {
      notesRadio.checked = true;
    }

    toggleNotesDetails();

    form.querySelectorAll('input[name="faculty_pref_notes_sheet"]').forEach((radio) => {
      radio.addEventListener("change", toggleNotesDetails);
    });

    closeFormButton.addEventListener("click", () => {
      preferenceModal.closeModal();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const sourceSectionId = facultyCourseSectionMap[course.id];

      if (!sourceSectionId) {
        showMessage("error", "No section mapping was found for the selected course.");
        return;
      }

      const selectedNotesOption =
        form.querySelector('input[name="faculty_pref_notes_sheet"]:checked')?.value || "";

      const payload = {
        provided_to_asa_method: document.getElementById("faculty-pref-delivery-method").value || "",
        return_method: document.getElementById("faculty-pref-return-method").value || "",
        calculator_policy: document.getElementById("faculty-pref-calculator-allowed").value || "",
        notes_sheet_allowed: selectedNotesOption === "yes",
        notes_sheet_details: document.getElementById("faculty-pref-notes-sheet-details").value.trim(),
        preferred_contact_method: document.getElementById("faculty-pref-contact-method").value || "",
        preferred_contact_value: document.getElementById("faculty-pref-contact-value").value.trim(),
        additional_information: document.getElementById("faculty-pref-additional-information").value.trim(),
        updated_by_user_id: "faculty:mreed@sbu.edu"
      };

      const submitButton = form.querySelector('button[type="submit"]');

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Saving...";
        }

        const savedRecord = await saveExamPreferenceBySection(sourceSectionId, payload);
        const normalizedPreference = normalizeExamPreference(savedRecord, course.id);

        dashboardState.facultyExamPreferencesCache =
          dashboardState.facultyExamPreferencesCache.filter(
            (record) => record.courseId !== course.id
          );
        dashboardState.facultyExamPreferencesCache.push(normalizedPreference);

        renderPreferenceForm({
          course,
          preferenceModal,
          dashboardState,
          getPreferenceByCourseId,
          getStatusClass,
          renderEmptyState,
          buildPreferenceFormMarkup,
          facultyCourseSectionMap,
          normalizeExamPreference,
          saveExamPreferenceBySection
        });

        showMessage("success", "Exam preferences saved successfully.", {
          autoHide: true,
          visibleMs: 5000,
          fadeMs: 500
        });
      } catch (error) {
        showMessage("error", `Could not save exam preferences. ${error.message}`);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Save Exam Preferences";
        }
      }
    });
  });
}