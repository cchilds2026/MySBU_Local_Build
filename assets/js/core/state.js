const REGISTRATION_STORAGE_KEY = "mysbu_student_registration_state";

export function getRegistrationState() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read registration state:", error);
    return null;
  }
}

export function saveRegistrationState(state) {
  try {
    window.localStorage.setItem(
      REGISTRATION_STORAGE_KEY,
      JSON.stringify(state || {})
    );
  } catch (error) {
    console.error("Failed to save registration state:", error);
  }
}

export function clearRegistrationState() {
  try {
    window.localStorage.removeItem(REGISTRATION_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear registration state:", error);
  }
}