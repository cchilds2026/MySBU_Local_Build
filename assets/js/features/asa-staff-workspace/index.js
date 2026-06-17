import { initAsaStaffInbox } from "./inbox.js";
import { initIntakePacketsPanel } from "./intake-packets.js";
import { initTestingRoomsPanel } from "./testing-rooms.js";

export function initAsaStaffWorkspace() {
  initAsaStaffInbox();
  initIntakePacketsPanel();
  initTestingRoomsPanel();
}
