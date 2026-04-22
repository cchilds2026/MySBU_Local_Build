import { getRegistrationState } from "../core/state.js";
import { portalApi } from "../services/portal-api.js";
import {
  isAsaStaffUser,
  isFacultyUser,
  isGraduateUser,
  isStudentUser
} from "./role-utils.js";

let cachedRegistrationStatus = null;

export function clearStudentRegistrationStatusCache() {
  cachedRegistrationStatus = null;
}

export function hasLearnerContext(user) {
  return (
    isStudentUser(user) ||
    isGraduateUser(user) ||
    isFacultyUser(user)
  );
}

export function requiresStudentRegistration(user) {
  if (isAsaStaffUser(user)) {
    return false;
  }

  return hasLearnerContext(user);
}

function getLocalDemoRegistrationOverride() {
  const localState = getRegistrationState();

  if (localState?.studentRegistrationComplete) {
    return {
      matched_student: null,
      student_registration_complete: true,
      student_registration_completed_at: localState.studentRegistrationCompletedAt || null,
      source: "demo-local"
    };
  }

  return null;
}

export async function getStudentRegistrationStatus(user, options = {}) {
  const { forceRefresh = false } = options;

  if (!requiresStudentRegistration(user)) {
    return {
      matched_student: null,
      student_registration_complete: true,
      student_registration_completed_at: null,
      source: "registration-not-required"
    };
  }

  const localOverride = getLocalDemoRegistrationOverride();
  if (localOverride) {
    cachedRegistrationStatus = localOverride;
    return localOverride;
  }

  if (!forceRefresh && cachedRegistrationStatus) {
    return cachedRegistrationStatus;
  }

  try {
    const status = await portalApi.getMyStudentRegistrationStatus();
    cachedRegistrationStatus = status;
    return status;
  } catch (error) {
    console.error("Failed to load student registration status:", error);

    cachedRegistrationStatus = {
      matched_student: null,
      student_registration_complete: false,
      student_registration_completed_at: null,
      source: "api-error"
    };

    return cachedRegistrationStatus;
  }
}

export async function shouldRedirectToStudentRegistration(user) {
  if (!requiresStudentRegistration(user)) {
    return false;
  }

  const status = await getStudentRegistrationStatus(user);
  return !Boolean(status?.student_registration_complete);
}

export async function shouldBypassStudentRegistration(user) {
  return !(await shouldRedirectToStudentRegistration(user));
}

export async function getStudentPortalEntryHref(user) {
  return (await shouldRedirectToStudentRegistration(user))
    ? "/pages/student-registration.html"
    : "/pages/student-portal.html";
}

export async function getGraduatePortalEntryHref(user) {
  return (await shouldRedirectToStudentRegistration(user))
    ? "/pages/student-registration.html"
    : "/pages/graduate-portal.html";
}

export async function getFacultyPortalEntryHref(user) {
  return (await shouldRedirectToStudentRegistration(user))
    ? "/pages/student-registration.html"
    : "/pages/faculty-portal.html";
}

export function getPostRegistrationHref(user) {
  if (isGraduateUser(user)) {
    return "/pages/graduate-portal.html";
  }

  if (isFacultyUser(user)) {
    return "/pages/faculty-portal.html";
  }

  return "/pages/student-portal.html";
}