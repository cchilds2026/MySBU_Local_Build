import { initAsaStaffInbox } from "./inbox.js";
import { initAsaStaffSystemStatus } from "./system-status.js";

export function initAsaStaffWorkspace() {
  initAsaStaffSystemStatus();
  initAsaStaffInbox();
}
