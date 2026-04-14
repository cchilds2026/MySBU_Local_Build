import { getPrototypeUser, getStaffAllowlist } from "../core/state.js";

export function initStaffGates() {
  const facultyPortalCard = document.getElementById("faculty-portal-card");
  const asaStaffPortalLink = document.getElementById("asa-staff-portal-link");
  const currentUser = getPrototypeUser();
  const allowlist = getStaffAllowlist();

  if (facultyPortalCard) {
    const facultyAllowed =
      currentUser.role === "faculty_staff" ||
      currentUser.role === "asa_staff" ||
      currentUser.email.toLowerCase().endsWith("@sbu.edu");

    facultyPortalCard.hidden = !facultyAllowed;
  }

  if (asaStaffPortalLink) {
    const isAllowed =
      currentUser.role === "asa_staff" ||
      allowlist.some((user) => user.email.toLowerCase() === currentUser.email.toLowerCase());

    asaStaffPortalLink.hidden = !isAllowed;
  }
}