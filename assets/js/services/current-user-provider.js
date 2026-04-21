import { portalApi } from "./portal-api.js";
import { DEMO_USERS } from "../shell/demo-role-switcher.js";
import { getStoredDemoRole } from "../shell/demo-role-state.js";

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

  const user = await portalApi.getCurrentUser();
  cachedCurrentUser = user;
  return user;
}

export function clearCurrentUserCache() {
  cachedCurrentUser = null;
}