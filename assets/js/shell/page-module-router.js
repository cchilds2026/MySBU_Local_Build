import { initFacultyDashboard } from "../features/faculty-dashboard/index.js";
import { initAsaExamOperations } from "../features/asa-exam-operations.js";
import { initAsaStudentRecord } from "../features/asa-student-record.js";
import { initAsaStudentsDirectory } from "../features/asa-students-directory.js";
import { initAsaStaffExamRequests } from "../asa-staff-exams.js";
import { initAsaStaffDocumentationQueue } from "../features/asa-staff-documentation-queue.js";
import { initAsaStaffLetterApprovals } from "../features/asa-staff-letter-approvals.js";
import { initAsaStaffRegistrationIntake } from "../features/asa-staff-registration-intake.js";
import { initAsaPublicResources } from "../features/asa-resources/public-resource-list.js";
import { initAsaResourceAdmin } from "../features/asa-resources/resource-admin.js";
import { initAsaStaffWorkspace } from "../features/asa-staff-workspace/index.js";
import { initStudentRegistrationForm } from "../modules/student-registration.js";
import { initAsaStaffUtilityNav } from "./asa-staff-utility-nav.js";
import { initHomeDemoToggle } from "./demo-role-switcher.js";
import { initAsaStaffDashboardSummary } from "./asa-staff-dashboard-summary.js";
import {
  canAccessAsaStaffPortal,
  canAccessFacultyPortal,
  canAccessGraduatePortal,
  canAccessStudentPortal
} from "./role-utils.js";
import {
  shouldRedirectToStudentRegistration
} from "./student-registration-gate.js";

function initSharedUi() {
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabPanels.forEach((panel) => {
    const tabButtons = panel.querySelectorAll(".tab-panel__tab");
    const tabContents = panel.querySelectorAll(".tab-panel__content");

    if (!tabButtons.length || !tabContents.length) return;

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab-target");
        if (!targetId || button.disabled) return;

        tabButtons.forEach((tabButton) => {
          const isActive = tabButton === button;
          tabButton.classList.toggle("is-active", isActive);
          tabButton.setAttribute("aria-selected", String(isActive));
          tabButton.tabIndex = isActive ? 0 : -1;
        });

        tabContents.forEach((content) => {
          const isActive = content.id === targetId;
          content.classList.toggle("is-active", isActive);
          content.hidden = !isActive;
        });
      });
    });
  });

  initAsaStaffUtilityNav();
}

function getPageName() {
  return document.body?.dataset?.page || "";
}

function redirectToHome() {
  window.location.href = "/pages/index.html";
}

function redirectToStudentRegistration() {
  window.location.href = "/pages/student-registration.html";
}

function isStudentFacingPage(page) {
  return [
    "student-portal",
    "request-exam",
    "request-accommodation-letter",
    "upload-documentation"
  ].includes(page);
}

function isAsaStaffPage(page) {
  return [
    "asa-staff-portal",
    "asa-student-directory",
    "asa-student-record",
    "asa-exam-operations",
    "asa-intake-form",
    "asa-resources-admin"
  ].includes(page);
}

function ensurePageAccess(user, page) {
  if (page === "home") return true;
  if (page === "student-registration") return true;

  if (isStudentFacingPage(page)) {
    return canAccessStudentPortal(user);
  }

  if (page === "graduate-portal") {
    return canAccessGraduatePortal(user);
  }

  if (page === "faculty-portal") {
    return canAccessFacultyPortal(user);
  }

  if (isAsaStaffPage(page)) {
    return canAccessAsaStaffPortal(user);
  }

  /*
    Retired page:
    ASA staff access is now expected to be managed by IT/AD or another backend
    identity system, not by MySBU.
  */
  if (page === "asa-staff-access") {
    return false;
  }

  return true;
}

async function applyRegistrationGate(user, page) {
  if (
    page === "student-portal" ||
    page === "graduate-portal" ||
    page === "faculty-portal" ||
    page === "request-exam" ||
    page === "request-accommodation-letter" ||
    page === "upload-documentation"
  ) {
    if (await shouldRedirectToStudentRegistration(user)) {
      redirectToStudentRegistration();
      return false;
    }
  }

  /*
    Keep the registration form reachable during the local rebuild.
    This avoids redirect loops while the student registration gate is still
    being refined.
  */
  if (page === "student-registration") {
    return true;
  }

  return true;
}

async function initLegacyStudentPortal() {
  const [
    { initStudentLetterRecords },
    { initStudentExamRecords },
    { initStudentDocumentRecords }
  ] = await Promise.all([
    import("../modules/student-letter-records.js"),
    import("../modules/student-exam-records.js"),
    import("../modules/student-document-records.js")
  ]);

  initStudentLetterRecords();
  initStudentExamRecords();
  initStudentDocumentRecords();
}

async function initLegacyExamRequest() {
  const { initExamRequestForm } = await import("../modules/exam-request.js");
  initExamRequestForm();
}

async function initLegacyAccommodationLetter() {
  const { initAccommodationLetterForm } = await import("../modules/accommodation-letter.js");
  initAccommodationLetterForm();
}

async function initLegacyUploadDocumentation() {
  const { initUploadDocumentationForm } = await import("../modules/upload-documentation.js");
  initUploadDocumentationForm();
}

async function initLegacyAsaIntakeForm() {
  const [{ renderAsaIntakeQueue }, { initAsaIntakeForm }] = await Promise.all([
    import("../modules/asa-intake-queue.js"),
    import("../modules/asa-intake.js")
  ]);

  renderAsaIntakeQueue();
  initAsaIntakeForm();
}

const pageInitializers = {
  home() {
    initHomeDemoToggle();
  },

  "student-registration"() {
    initStudentRegistrationForm();
  },

  async "student-portal"() {
    await initLegacyStudentPortal();
    await initAsaPublicResources("student");
  },

  "request-exam"() {
    return initLegacyExamRequest();
  },

  "request-accommodation-letter"() {
    return initLegacyAccommodationLetter();
  },

  "upload-documentation"() {
    return initLegacyUploadDocumentation();
  },

  "asa-intake-form"() {
    return initLegacyAsaIntakeForm();
  },

  "faculty-portal"() {
    initFacultyDashboard();
    return initAsaPublicResources("faculty_staff");
  },

  "asa-student-directory"() {
    initAsaStudentsDirectory();
  },

  "asa-student-record"() {
    initAsaStudentRecord();
  },

  "asa-exam-operations"() {
    initAsaExamOperations();
  },

  "asa-staff-portal"() {
    initAsaStaffWorkspace();
    initAsaStaffDashboardSummary();
    initAsaStaffExamRequests();
    initAsaStaffRegistrationIntake();
    initAsaStaffLetterApprovals();
    initAsaStaffDocumentationQueue();
  },

  "asa-resources-admin"() {
    initAsaResourceAdmin();
  },

  "graduate-portal"() {}
};

export async function initPageModules(user) {
  initSharedUi();

  const page = getPageName();

  if (!ensurePageAccess(user, page)) {
    redirectToHome();
    return;
  }

  if (!(await applyRegistrationGate(user, page))) {
    return;
  }

  const initializer = pageInitializers[page];
  if (!initializer) return;

  try {
    await initializer(user);
  } catch (error) {
    console.error(`Page initialization failed for "${page}":`, error);
  }
}