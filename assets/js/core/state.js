import { readStorage, writeStorage } from "./storage.js";
import { defaultAsaAllowlist } from "../data/permissions.js";
import { currentPrototypeUser } from "../data/staff.js";

export function getPrototypeUser() {
  return currentPrototypeUser;
}

export function getStaffAllowlist() {
  return readStorage("asaStaffAllowlist", defaultAsaAllowlist);
}

export function setStaffAllowlist(list) {
  writeStorage("asaStaffAllowlist", list);
}

export function getRegistrationState() {
  return readStorage("asaRegistrationState", {
    registrationComplete: false,
    documentationStatus: "not_started",
    submittedToQueue: false
  });
}

export function setRegistrationState(nextState) {
  writeStorage("asaRegistrationState", nextState);
}

export function getAsaIntakeQueue() {
  return readStorage("asaIntakeQueue", []);
}

export function setAsaIntakeQueue(queue) {
  writeStorage("asaIntakeQueue", queue);
}

export function getLatestRegistrationPayload() {
  return readStorage("asaLatestRegistrationPayload", null);
}

export function setLatestRegistrationPayload(payload) {
  writeStorage("asaLatestRegistrationPayload", payload);
}

export function getAccommodationLetterRecords() {
  return readStorage("asaAccommodationLetterRecords", []);
}

export function setAccommodationLetterRecords(records) {
  writeStorage("asaAccommodationLetterRecords", records);
}

export function getExamRequestRecords() {
  return readStorage("asaExamRequestRecords", []);
}

export function setExamRequestRecords(records) {
  writeStorage("asaExamRequestRecords", records);
}

export function getDocumentationRecords() {
  return readStorage("asaDocumentationRecords", []);
}

export function setDocumentationRecords(records) {
  writeStorage("asaDocumentationRecords", records);
}