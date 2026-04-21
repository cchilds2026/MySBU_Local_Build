const STORAGE_KEY = "mysbu_demo_user_role";

export function getStoredDemoRole() {
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredDemoRole(role) {
  if (!role) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, role);
  }
}