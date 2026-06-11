const API_BASE_URL =
  window.__MYSBU_API_BASE_URL__ || "http://127.0.0.1:5050/api";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", ""]);

const LOCAL_PREVIEW_MODE =
  window.__MYSBU_LOCAL_PREVIEW_MODE__ ??
  LOCAL_HOSTNAMES.has(window.location.hostname);

export const apiConfig = Object.freeze({
  baseUrl: API_BASE_URL,
  timeoutMs: 15000
});

export const runtimeConfig = Object.freeze({
  localPreviewMode: Boolean(LOCAL_PREVIEW_MODE)
});

export const systemRegistry = Object.freeze({
  cms: {
    id: "cms",
    name: "Sitefinity",
    role: "experience-layer",
    writeMode: "content-only"
  },
  workflow: {
    id: "workflow",
    name: "MySBU Workflow API",
    role: "orchestration-layer",
    writeMode: "workflow-owned"
  },
  sis: {
    id: "sis",
    name: "Ellucian Colleague",
    role: "record-of-truth",
    writeMode: "read-only-import"
  },
  lms: {
    id: "lms",
    name: "Moodle",
    role: "learning-system",
    writeMode: "integration"
  },
  navigate: {
    id: "navigate",
    name: "EAB Navigate360",
    role: "coordinated-care",
    writeMode: "integration"
  },
  housing: {
    id: "housing",
    name: "Adirondack Housing Director",
    role: "housing-operations",
    writeMode: "integration"
  },
  access: {
    id: "access",
    name: "RFID Access Control",
    role: "physical-access",
    writeMode: "integration"
  }
});

export const workflowCatalog = Object.freeze([
  {
    id: "accommodations",
    title: "Accessibility & Accommodations",
    audience: ["student"],
    owner: "workflow",
    route: "/student/accommodations",
    integrations: ["sis", "navigate"],
    summary:
      "Start requests, upload documentation, track review, and complete intake."
  },
  {
    id: "letters",
    title: "Course Accommodation Letters",
    audience: ["student", "faculty"],
    owner: "workflow",
    route: "/student/course-accommodations",
    integrations: ["sis"],
    summary:
      "Request semester letters by enrolled course and track delivery status."
  },
  {
    id: "exam-requests",
    title: "Exam Requests",
    audience: ["student", "faculty", "asa-staff"],
    owner: "workflow",
    route: "/student/exams",
    integrations: ["sis"],
    summary:
      "Request, approve, schedule, and complete accommodated exams."
  },
  {
    id: "student-success",
    title: "Advising & Support",
    audience: ["student", "advisor"],
    owner: "navigate",
    route: "/student/support",
    integrations: ["navigate", "lms"],
    summary:
      "Appointments, referrals, progress outreach, and actionable next steps."
  },
  {
    id: "housing",
    title: "Housing & Residential Support",
    audience: ["student", "reslife"],
    owner: "workflow",
    route: "/student/housing-support",
    integrations: ["housing", "access"],
    summary:
      "Track housing accommodation review, assignment coordination, and access outcomes."
  }
]);

export function getWorkflowsForAudience(audience) {
  return workflowCatalog.filter((workflow) =>
    workflow.audience.includes(audience)
  );
}
