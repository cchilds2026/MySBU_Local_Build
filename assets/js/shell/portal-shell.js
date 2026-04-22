import { getCurrentUser } from "../services/current-user-provider.js";
import {
  canSeeAsaStaffCard,
  canSeeFacultyCard,
  canSeeGraduateCard,
  canSeeStudentCard
} from "./role-utils.js";
import {
  getFacultyPortalEntryHref,
  getGraduatePortalEntryHref,
  getStudentPortalEntryHref
} from "./student-registration-gate.js";

function setHiddenById(id, isHidden) {
  const element = document.getElementById(id);
  if (!element) return;
  element.hidden = isHidden;
}

function setHrefById(id, href) {
  const element = document.getElementById(id);
  if (!element) return;
  element.setAttribute("href", href);
}

function applyAudienceCardVisibility(user) {
  setHiddenById("student-portal-card", !canSeeStudentCard(user));
  setHiddenById("faculty-portal-card", !canSeeFacultyCard(user));
  setHiddenById("graduate-portal-card", !canSeeGraduateCard(user));
  setHiddenById("asa-staff-portal-link", !canSeeAsaStaffCard(user));
}

async function applyPortalEntryLinks(user) {
  const [studentHref, graduateHref, facultyHref] = await Promise.all([
    getStudentPortalEntryHref(user),
    getGraduatePortalEntryHref(user),
    getFacultyPortalEntryHref(user)
  ]);

  setHrefById("student-portal-card", studentHref);
  setHrefById("graduate-portal-card", graduateHref);
  setHrefById("faculty-portal-card", facultyHref);
}

export async function initPortalShell() {
  try {
    const user = await getCurrentUser();
    applyAudienceCardVisibility(user);
    await applyPortalEntryLinks(user);
    return user;
  } catch (error) {
    console.error("Failed to initialize portal shell:", error);

    setHiddenById("student-portal-card", false);
    setHiddenById("graduate-portal-card", false);
    setHiddenById("faculty-portal-card", true);
    setHiddenById("asa-staff-portal-link", true);

    return null;
  }
}