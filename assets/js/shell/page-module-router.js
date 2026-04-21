import { initFacultyDashboard } from "../features/faculty-dashboard/index.js";
import { initAsaStaffExamRequests } from "../asa-staff-exams.js";
import { initHomeDemoToggle } from "./demo-role-switcher.js";
import {
  canAccessAsaStaffPortal,
  canAccessFacultyPortal,
  canAccessGraduatePortal,
  canAccessStudentPortal
} from "./role-utils.js";

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
}

function getPageName() {
  return document.body?.dataset?.page || "";
}

function redirectToHome() {
  window.location.href = "./index.html";
}

function ensurePageAccess(user, page) {
  if (page === "home") return true;
  if (page === "student-portal") return canAccessStudentPortal(user);
  if (page === "graduate-portal") return canAccessGraduatePortal(user);
  if (page === "faculty-portal") return canAccessFacultyPortal(user);
  if (page === "asa-staff-portal") return canAccessAsaStaffPortal(user);
  return true;
}

export function initPageModules(user) {
  initSharedUi();

  const page = getPageName();

  if (!ensurePageAccess(user, page)) {
    redirectToHome();
    return;
  }

  if (page === "home") {
    initHomeDemoToggle();
    return;
  }

  if (page === "faculty-portal") {
    initFacultyDashboard();
    return;
  }

  if (page === "asa-staff-portal") {
    initAsaStaffExamRequests();
  }
}