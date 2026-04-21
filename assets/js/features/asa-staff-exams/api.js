import { portalApi } from "../../services/portal-api.js";

export function fetchExamRequests() {
  return portalApi.getExamRequests();
}

export function fetchExamRequestDetail(examRequestId) {
  return portalApi.getExamRequest(examRequestId);
}

export function updateExamStaffStatus(examRequestId, payload) {
  return portalApi.updateExamStaffStatus(examRequestId, payload);
}