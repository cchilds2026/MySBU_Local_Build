import { getRegistrationState, saveRegistrationState } from "../core/state.js";
import { getCurrentUser } from "../services/current-user-provider.js";
import { portalApi } from "../services/portal-api.js";
import {
  clearStudentRegistrationStatusCache,
  getPostRegistrationHref
} from "../shell/student-registration-gate.js";

function populateSavedValues(state) {
  if (!state) return;

  const simpleFields = [
    "registration-request-type",
    "registration-disability-type",
    "registration-academic-impact",
    "registration-daily-life-impact",
    "registration-prior-accommodations",
    "registration-prior-accommodations-details",
    "registration-requested-accommodations-other"
  ];

  simpleFields.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (input && state[fieldId] !== undefined && state[fieldId] !== null) {
      input.value = state[fieldId];
    }
  });

  const docsPending = document.getElementById("registration-docs-pending");
  if (docsPending) {
    docsPending.checked = Boolean(state["registration-docs-pending"]);
  }

  const releaseConsent = document.getElementById("registration-release-consent");
  if (releaseConsent) {
    releaseConsent.checked = Boolean(state["registration-release-consent"]);
  }

  const selectedAccommodations = Array.isArray(state.requestedAccommodations)
    ? state.requestedAccommodations
    : [];

  document
    .querySelectorAll('input[name="requested_accommodations"]')
    .forEach((checkbox) => {
      checkbox.checked = selectedAccommodations.includes(checkbox.value);
    });
}

function getSelectedRequestedAccommodations() {
  return Array.from(
    document.querySelectorAll('input[name="requested_accommodations"]:checked')
  ).map((input) => input.value);
}

function togglePriorAccommodationsDetails() {
  const select = document.getElementById("registration-prior-accommodations");
  const detailsField = document.getElementById(
    "registration-prior-accommodations-details-field"
  );

  if (!select || !detailsField) return;

  detailsField.hidden = select.value !== "yes";
}

function toggleRequestedAccommodationsSection() {
  const requestType = document.getElementById("registration-request-type");
  const section = document.getElementById(
    "registration-requested-accommodations-section"
  );

  if (!requestType || !section) return;

  section.hidden = requestType.value !== "academic";
}

function getFormDataForLocalState() {
  return {
    "registration-request-type":
      document.getElementById("registration-request-type")?.value?.trim() || "",
    "registration-disability-type":
      document.getElementById("registration-disability-type")?.value?.trim() || "",
    "registration-academic-impact":
      document.getElementById("registration-academic-impact")?.value?.trim() || "",
    "registration-daily-life-impact":
      document.getElementById("registration-daily-life-impact")?.value?.trim() || "",
    "registration-prior-accommodations":
      document.getElementById("registration-prior-accommodations")?.value?.trim() || "",
    "registration-prior-accommodations-details":
      document.getElementById("registration-prior-accommodations-details")?.value?.trim() || "",
    "registration-requested-accommodations-other":
      document.getElementById("registration-requested-accommodations-other")?.value?.trim() || "",
    "registration-docs-pending":
      Boolean(document.getElementById("registration-docs-pending")?.checked),
    "registration-release-consent":
      Boolean(document.getElementById("registration-release-consent")?.checked),
    requestedAccommodations: getSelectedRequestedAccommodations()
  };
}

function buildApiPayload() {
  const documentInput = document.getElementById("registration-document-upload");
  const selectedFile = documentInput?.files?.[0] || null;

  return {
    request_type:
      document.getElementById("registration-request-type")?.value?.trim() || "",
    disability_type:
      document.getElementById("registration-disability-type")?.value?.trim() || "",
    academic_impact:
      document.getElementById("registration-academic-impact")?.value?.trim() || "",
    daily_life_impact:
      document.getElementById("registration-daily-life-impact")?.value?.trim() || "",
    prior_accommodations:
      document.getElementById("registration-prior-accommodations")?.value?.trim() || "",
    prior_accommodations_details:
      document.getElementById("registration-prior-accommodations-details")?.value?.trim() || "",
    requested_accommodations: getSelectedRequestedAccommodations(),
    requested_accommodations_other:
      document.getElementById("registration-requested-accommodations-other")?.value?.trim() || "",
    document_file_name: selectedFile?.name || null,
    document_storage_path: selectedFile
      ? `/demo-storage/student-registration/${selectedFile.name}`
      : null,
    docs_pending_acknowledged:
      Boolean(document.getElementById("registration-docs-pending")?.checked),
    release_consent:
      Boolean(document.getElementById("registration-release-consent")?.checked),
    submitted_by_user_id: "portal:student-registration-form"
  };
}

function markLocalRegistrationComplete(localState) {
  saveRegistrationState({
    ...localState,
    studentRegistrationComplete: true,
    studentRegistrationCompletedAt: new Date().toISOString()
  });

  clearStudentRegistrationStatusCache();
}

function showMessage(type, text) {
  const message = document.getElementById("student-registration-message");
  if (!message) return;

  message.hidden = false;
  message.className = `form-message form-message--${type}`;
  message.textContent = text;
}

function showAcknowledgment() {
  const acknowledgment = document.getElementById(
    "student-registration-acknowledgment"
  );
  if (!acknowledgment) return;
  acknowledgment.hidden = false;
}

async function continueToDestination() {
  const currentUser = await getCurrentUser();
  window.location.href = getPostRegistrationHref(currentUser);
}

export async function initStudentRegistrationForm() {
  const form = document.getElementById("student-registration-form");
  if (!form) return;

  const requestType = document.getElementById("registration-request-type");
  const priorAccommodations = document.getElementById(
    "registration-prior-accommodations"
  );
  const demoCompleteButton = document.getElementById(
    "student-registration-demo-complete"
  );

  const savedState = getRegistrationState();
  populateSavedValues(savedState);
  toggleRequestedAccommodationsSection();
  togglePriorAccommodationsDetails();

  requestType?.addEventListener("change", toggleRequestedAccommodationsSection);
  priorAccommodations?.addEventListener("change", togglePriorAccommodationsDetails);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showMessage("error", "Please complete all required registration fields.");
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const localState = getFormDataForLocalState();
    const payload = buildApiPayload();

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      await portalApi.createStudentRegistrationRequest(payload);

      markLocalRegistrationComplete(localState);
      showAcknowledgment();
      showMessage("success", "Registration submitted successfully.");

      window.setTimeout(async () => {
        await continueToDestination();
      }, 500);
    } catch (error) {
      console.error("Failed to submit registration request:", error);
      showMessage("error", error.message || "Could not submit registration.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Registration";
      }
    }
  });

  if (demoCompleteButton) {
    demoCompleteButton.addEventListener("click", async () => {
      const localState = getFormDataForLocalState();
      markLocalRegistrationComplete(localState);
      await continueToDestination();
    });
  }
}