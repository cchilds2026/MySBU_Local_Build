import { portalApi } from "./portal-api.js";
import { runtimeConfig } from "../data/site-config.js";
import { DEMO_USERS } from "../shell/demo-role-switcher.js";
import { getStoredDemoRole } from "../shell/demo-role-state.js";

const LOCAL_PREVIEW_USER = Object.freeze({
  user_id: "local-preview:cchilds@sbu.edu",
  email: "cchilds@sbu.edu",
  display_name: "Local Preview User",
  roles: ["student", "faculty", "graduate", "asa_staff"],
  authentication_source: "local-preview-fallback"
});

let cachedCurrentUser = null;

export async function getCurrentUser() {
  if (cachedCurrentUser) {
    return cachedCurrentUser;
  }

  const demoRole = getStoredDemoRole();

  if (demoRole && DEMO_USERS[demoRole]) {
    cachedCurrentUser = DEMO_USERS[demoRole];
    return cachedCurrentUser;
  }

  try {
    const user = await portalApi.getCurrentUser();

    cachedCurrentUser = user || LOCAL_PREVIEW_USER;
    return cachedCurrentUser;
  } catch (error) {
    if (!runtimeConfig.localPreviewMode) {
      throw error;
    }

    console.warn(
      "Could not load /api/me. Using local preview user for Live Server.",
      error
    );

    cachedCurrentUser = LOCAL_PREVIEW_USER;
    return cachedCurrentUser;
  }
}

export function clearCurrentUserCache() {
  cachedCurrentUser = null;
}
