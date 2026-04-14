import { getRegistrationState } from "../core/state.js";

export function initHomeRouting() {
  const studentPortalCard = document.getElementById("student-portal-card");
  if (!studentPortalCard) return;

  studentPortalCard.addEventListener("click", (event) => {
    event.preventDefault();

    const registrationState = getRegistrationState();

    if (!registrationState.registrationComplete) {
      window.location.href = "/pages/student-registration.html";
      return;
    }

    window.location.href = "/pages/student-portal.html";
  });
}