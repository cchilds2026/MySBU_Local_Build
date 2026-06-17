import { initAsaStaffInbox } from "./inbox.js";
import { initIntakePacketsPanel } from "./intake-packets.js";
import { initStudentAgreementsPanel } from "./student-agreements.js";
import { initTestingRoomsPanel } from "./testing-rooms.js";
import { initLegacyMysbuPanel } from "./legacy-mysbu.js";
import { initWorkflowLetterRequestsPanel } from "./workflow-letter-requests.js";

export function initAsaStaffWorkspace() {
  initAsaStaffInbox();
  initIntakePacketsPanel();
  initStudentAgreementsPanel();
  initTestingRoomsPanel();
  initLegacyMysbuPanel();
  initWorkflowLetterRequestsPanel();
}
