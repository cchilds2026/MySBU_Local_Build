import { initAsaStaffInbox } from "./inbox.js";
import { initIntakePacketsPanel } from "./intake-packets.js";
import { initStudentAgreementsPanel } from "./student-agreements.js";
import { initTestingRoomsPanel } from "./testing-rooms.js";

export function initAsaStaffWorkspace() {
  initAsaStaffInbox();
  initIntakePacketsPanel();
  initStudentAgreementsPanel();
  initTestingRoomsPanel();
}
