import { initFacultyDashboard } from "../features/faculty-dashboard/index.js";
import { initAsaExamOperations } from "../features/asa-exam-operations.js";
import { initAsaStudentRecord } from "../features/asa-student-record.js";
import { initAsaStudentsDirectory } from "../features/asa-students-directory.js";
import { initAsaStaffExamRequests } from "../asa-staff-exams.js";
import { initAsaStaffDocumentationQueue } from "../features/asa-staff-documentation-queue.js";
import { initAsaStaffLetterApprovals } from "../features/asa-staff-letter-approvals.js";
import { initAsaStaffRegistrationIntake } from "../features/asa-staff-registration-intake.js";
import { initStudentRegistrationForm } from "../modules/student-registration.js";
import { initAsaStaffUtilityNav } from "./asa-staff-utility-nav.js";
import { initHomeDemoToggle } from "./demo-role-switcher.js";
import {
  canAccessAsaStaffPortal,
  canAccessFacultyPortal,
  canAccessGraduatePortal,
  canAccessStudentPortal
} from "./role-utils.js";
import {
  getPostRegistrationHref,
  shouldBypassStudentRegistration,
  shouldRedirectToStudentRegistration
} from "./student-registration-gate.js";
import { initAsaStaffDashboardSummary } from "./asa-staff-dashboard-summary.js";

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

function redirectToPostRegistrationDestination(user) {
  window.location.href = getPostRegistrationHref(user);
}

function ensurePageAccess(user, page) {
  if (page === "home") return true;
  if (page === "student-registration") return true;
  if (page === "student-portal") return canAccessStudentPortal(user);
  if (page === "graduate-portal") return canAccessGraduatePortal(user);
  if (page === "faculty-portal") return canAccessFacultyPortal(user);
  if (page === "asa-staff-portal") return canAccessAsaStaffPortal(user);
  if (page === "asa-student-directory") return canAccessAsaStaffPortal(user);
  if (page === "asa-student-record") return canAccessAsaStaffPortal(user);
  if (page === "asa-exam-operations") return canAccessAsaStaffPortal(user);
  if (page === "asa-staff-access") return canAccessAsaStaffPortal(user);
  return true;
}

async function applyRegistrationGate(user, page) {
  if (
    page === "student-portal" ||
    page === "graduate-portal" ||
    page === "faculty-portal"
  ) {
    if (await shouldRedirectToStudentRegistration(user)) {
      redirectToStudentRegistration();
      return false;
    }
  }

  if (page === "student-registration") {
    if (await shouldBypassStudentRegistration(user)) {
      redirectToPostRegistrationDestination(user);
      return false;
    }
  }

  return true;
}

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

  if (page === "home") {
    initHomeDemoToggle();
    return;
  }

  if (page === "student-registration") {
    initStudentRegistrationForm();
    return;
  }

  if (page === "faculty-portal") {
    initFacultyDashboard();
    return;
  }

  if (page === "asa-student-directory") {
    initAsaStudentsDirectory();
    return;
  }

  if (page === "asa-student-record") {
    initAsaStudentRecord();
    return;
  }

  if (page === "asa-exam-operations") {
    initAsaExamOperations();
    return;
  }

    if (page === "asa-staff-portal") {
    initAsaStaffDashboardSummary();
    initAsaStaffExamRequests();
    initAsaStaffRegistrationIntake();
    initAsaStaffLetterApprovals();
    initAsaStaffDocumentationQueue();
    return;
  }
}