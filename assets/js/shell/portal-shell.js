import { getCurrentUser } from "../services/current-user-provider.js";
import {
  canSeeAsaStaffCard,
  canSeeFacultyCard,
  canSeeGraduateCard,
  canSeeStudentCard
} from "./role-utils.js";

function setHiddenById(id, isHidden) {
  const element = document.getElementById(id);
  if (!element) return;
  element.hidden = isHidden;
}

function applyAudienceCardVisibility(user) {
  setHiddenById("student-portal-card", !canSeeStudentCard(user));
  setHiddenById("faculty-portal-card", !canSeeFacultyCard(user));
  setHiddenById("graduate-portal-card", !canSeeGraduateCard(user));
  setHiddenById("asa-staff-portal-link", !canSeeAsaStaffCard(user));
}

export async function initPortalShell() {
  try {
    const user = await getCurrentUser();
    applyAudienceCardVisibility(user);
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