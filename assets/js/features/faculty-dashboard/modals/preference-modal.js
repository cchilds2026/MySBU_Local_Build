export function buildFacultyPreferenceModal() {
  let modal = document.getElementById("faculty-preference-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "faculty-preference-modal";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog--faculty-exam" role="dialog" aria-modal="true" aria-labelledby="faculty-preference-modal-title">
      <div class="faculty-exam-modal__header">
        <div>
          <h2 id="faculty-preference-modal-title" class="modal-title">Exam Preferences</h2>
          <p class="modal-text">Set default exam handling preferences for the selected course.</p>
        </div>
        <button type="button" class="faculty-modal-close" id="faculty-preference-modal-close" aria-label="Close exam preferences modal">×</button>
      </div>

      <div id="faculty-preference-modal-content"></div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

export function initFacultyPreferenceModal() {
  const modal = buildFacultyPreferenceModal();
  const closeButton = document.getElementById("faculty-preference-modal-close");
  const content = document.getElementById("faculty-preference-modal-content");

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

  return { openModal, closeModal, content };
}

export function buildPreferenceFormMarkup() {
  return `
    <form class="asa-form" id="faculty-exam-preference-form" novalidate>
      <fieldset class="form-section">
        <legend class="form-section__title">Default Delivery Preferences</legend>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label class="form-label" for="faculty-pref-delivery-method">
              Default Method of Providing the Exam to ASA
            </label>
            <select class="form-select" id="faculty-pref-delivery-method">
              <option value="">Select one</option>
              <option value="upload">Uploaded file</option>
              <option value="email">Email asaexams@sbu.edu</option>
              <option value="deliver_office">Deliver to ASA office</option>
              <option value="moodle_online">Student access on Moodle / online</option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <label class="form-label" for="faculty-pref-return-method">
              Default Method of Return for the Completed Exam
            </label>
            <select class="form-select" id="faculty-pref-return-method">
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
              Default Calculator Allowed?
            </label>
            <select class="form-select" id="faculty-pref-calculator-allowed">
              <option value="">Select one</option>
              <option value="none">No calculator</option>
              <option value="any">Any calculator</option>
              <option value="scientific">Scientific only</option>
              <option value="basic">Basic only</option>
            </select>
          </div>

          <div class="form-field form-field--full">
            <span class="form-label">Default Notes Sheet?</span>
            <div class="faculty-inline-options">
              <label class="form-checkbox">
                <input type="radio" name="faculty_pref_notes_sheet" value="yes" />
                <span>Yes</span>
              </label>

              <label class="form-checkbox">
                <input type="radio" name="faculty_pref_notes_sheet" value="no" />
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
              Preferred Method of Contact
            </label>
            <select class="form-select" id="faculty-pref-contact-method">
              <option value="">Select one</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div class="form-field">
            <label class="form-label" for="faculty-pref-contact-value">
              Contact Details
            </label>
            <input
              class="form-input"
              id="faculty-pref-contact-value"
              type="text"
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

      <div class="modal-actions">
        <button type="button" class="button-secondary" id="faculty-preference-close-button">Close</button>
        <button type="submit" class="button-primary">Save Exam Preferences</button>
      </div>
    </form>
  `;
}