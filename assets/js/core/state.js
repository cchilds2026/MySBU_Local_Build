const REGISTRATION_STORAGE_KEY = "mysbu_student_registration_state";
const ASA_INTAKE_QUEUE_STORAGE_KEY = "mysbu_asa_intake_queue";
const EXAM_REQUEST_RECORDS_STORAGE_KEY = "mysbu_exam_request_records";
const ACCOMMODATION_LETTER_RECORDS_STORAGE_KEY = "mysbu_accommodation_letter_records";
const DOCUMENTATION_RECORDS_STORAGE_KEY = "mysbu_documentation_records";

const DEFAULT_ASA_INTAKE_QUEUE = [
  {
    studentId: "900123456",
    studentName: "Jordan Ellis",
    requestType: "New registration",
    disabilityType: "ADHD",
    registrationDate: "2026-04-10",
    documentationStatus: "uploaded",
    intakeStatus: "Not Started"
  }
];

function safeReadJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read state for ${key}:`, error);
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save state for ${key}:`, error);
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to clear state for ${key}:`, error);
  }
}

export function getRegistrationState() {
  return safeReadJson(REGISTRATION_STORAGE_KEY, null);
}

export function saveRegistrationState(state) {
  safeWriteJson(REGISTRATION_STORAGE_KEY, state || {});
}

export function clearRegistrationState() {
  safeRemove(REGISTRATION_STORAGE_KEY);
}

export function resetStudentRegistrationDemoState() {
  clearRegistrationState();
}

export function getLatestRegistrationPayload() {
  return getRegistrationState();
}

export function getAsaIntakeQueue() {
  const savedQueue = safeReadJson(ASA_INTAKE_QUEUE_STORAGE_KEY, null);

  if (Array.isArray(savedQueue)) {
    return savedQueue;
  }

  return DEFAULT_ASA_INTAKE_QUEUE;
}

export function setAsaIntakeQueue(queue) {
  safeWriteJson(
    ASA_INTAKE_QUEUE_STORAGE_KEY,
    Array.isArray(queue) ? queue : DEFAULT_ASA_INTAKE_QUEUE
  );
}

export function clearAsaIntakeQueue() {
  safeRemove(ASA_INTAKE_QUEUE_STORAGE_KEY);
}

export function getExamRequestRecords() {
  return safeReadJson(EXAM_REQUEST_RECORDS_STORAGE_KEY, []);
}

export function setExamRequestRecords(records) {
  safeWriteJson(
    EXAM_REQUEST_RECORDS_STORAGE_KEY,
    Array.isArray(records) ? records : []
  );
}

export function clearExamRequestRecords() {
  safeRemove(EXAM_REQUEST_RECORDS_STORAGE_KEY);
}

export function getAccommodationLetterRecords() {
  return safeReadJson(ACCOMMODATION_LETTER_RECORDS_STORAGE_KEY, []);
}

export function setAccommodationLetterRecords(records) {
  safeWriteJson(
    ACCOMMODATION_LETTER_RECORDS_STORAGE_KEY,
    Array.isArray(records) ? records : []
  );
}

export function clearAccommodationLetterRecords() {
  safeRemove(ACCOMMODATION_LETTER_RECORDS_STORAGE_KEY);
}

export function getDocumentationRecords() {
  return safeReadJson(DOCUMENTATION_RECORDS_STORAGE_KEY, []);
}

export function setDocumentationRecords(records) {
  safeWriteJson(
    DOCUMENTATION_RECORDS_STORAGE_KEY,
    Array.isArray(records) ? records : []
  );
}

export function clearDocumentationRecords() {
  safeRemove(DOCUMENTATION_RECORDS_STORAGE_KEY);
}

export function clearAllLegacyDemoState() {
  clearRegistrationState();
  clearAsaIntakeQueue();
  clearExamRequestRecords();
  clearAccommodationLetterRecords();
  clearDocumentationRecords();
}