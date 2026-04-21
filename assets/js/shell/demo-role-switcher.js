import { clearCurrentUserCache } from "../services/current-user-provider.js";
import { getStoredDemoRole, setStoredDemoRole } from "./demo-role-state.js";

export const DEMO_USERS = {
  student: {
    user_id: "student:jwilliams@sbu.edu",
    email: "jwilliams@sbu.edu",
    display_name: "Jordan Williams",
    roles: ["student"],
    authentication_source: "demo-override"
  },
  faculty: {
    user_id: "faculty:mreed@sbu.edu",
    email: "mreed@sbu.edu",
    display_name: "Megan Reed",
    roles: ["faculty"],
    authentication_source: "demo-override"
  },
  graduate: {
    user_id: "graduate:gradstudent@sbu.edu",
    email: "gradstudent@sbu.edu",
    display_name: "Graduate Student",
    roles: ["graduate"],
    authentication_source: "demo-override"
  },
  asa_staff: {
    user_id: "asa_staff:staff@sbu.edu",
    email: "staff@sbu.edu",
    display_name: "ASA Staff",
    roles: ["asa_staff"],
    authentication_source: "demo-override"
  }
};

function formatRoleLabel(role) {
  if (!role) {
    return "None";
  }

  if (role === "asa_staff") {
    return "ASA Staff";
  }

  return String(role)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function initHomeDemoToggle() {
  const toggleButton = document.getElementById("home-demo-toggle");
  if (!toggleButton) return;

  toggleButton.addEventListener("click", () => {
    const currentRole = getStoredDemoRole();

    const nextRole =
      currentRole === ""
        ? "faculty"
        : currentRole === "faculty"
          ? "asa_staff"
          : currentRole === "asa_staff"
            ? "student"
            : currentRole === "student"
              ? "graduate"
              : "";

    setStoredDemoRole(nextRole);
    clearCurrentUserCache();
    window.location.reload();
  });

  const currentRole = getStoredDemoRole();
  toggleButton.setAttribute("aria-pressed", String(Boolean(currentRole)));
  toggleButton.textContent = `Current Role = ${formatRoleLabel(currentRole)}`;
}