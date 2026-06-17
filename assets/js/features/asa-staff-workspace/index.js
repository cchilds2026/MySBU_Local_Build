import { initAsaStaffInbox } from "./inbox.js";
import { initTestingRoomsPanel } from "./testing-rooms.js";

export function initAsaStaffWorkspace() {
  initAsaStaffInbox();
  initTestingRoomsPanel();
}