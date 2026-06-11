import { portalApi } from "../../services/portal-api.js";
import { getCurrentUser } from "../../services/current-user-provider.js";

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setBadge(id, label, statusClass) {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = label;
  element.className = `status-badge ${statusClass}`.trim();
}

function formatRoles(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return roles.length ? roles.join(", ") : "No roles returned";
}

export async function initAsaStaffSystemStatus() {
  const panel = document.getElementById("asa-system-status-panel");
  if (!panel) return;

  setBadge("asa-system-api-status", "Checking", "status-badge--pending");
  setBadge("asa-system-db-status", "Checking", "status-badge--pending");
  setText("asa-system-user", "Loading current user...");
  setText("asa-system-roles", "Loading roles...");

  try {
    const [health, user] = await Promise.all([
      portalApi.health(),
      getCurrentUser()
    ]);

    const apiOk = health?.api === "ok" || health?.status === "ok";
    const dbOk = health?.database === "ok";

    setBadge(
      "asa-system-api-status",
      apiOk ? "Online" : "Degraded",
      apiOk ? "status-badge--success" : "status-badge--pending"
    );

    setBadge(
      "asa-system-db-status",
      dbOk ? "Online" : "Check API",
      dbOk ? "status-badge--success" : "status-badge--pending"
    );

    setText(
      "asa-system-user",
      user?.email || user?.display_name || "No current user returned"
    );
    setText("asa-system-roles", formatRoles(user));
  } catch (error) {
    console.warn("System status check failed.", error);

    setBadge("asa-system-api-status", "Offline", "status-badge--read");
    setBadge("asa-system-db-status", "Unavailable", "status-badge--read");
    setText("asa-system-user", "Unavailable");
    setText("asa-system-roles", "Start Flask API to verify roles");
  }
}
