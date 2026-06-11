export const asaDepartment = Object.freeze({
  id: "asa",
  name: "Accessibility Services and Accommodations",
  shortName: "ASA",
  type: "student-support-office",
  showcase: true,
  sitefinitySection: "/accessibility-services",
  audiences: ["students", "faculty-staff", "graduate-students"],
  contacts: [
    {
      label: "ASA Office",
      email: "asa@sbu.edu",
      phone: "716-375-2065",
      location: "Academic Success Center"
    }
  ],
  serviceCategories: [
    "Academic accommodations",
    "Testing accommodations",
    "Documentation review",
    "Housing accommodation coordination",
    "Faculty guidance"
  ],
  reusableComponents: [
    "department-hero",
    "service-catalog-list",
    "resource-list",
    "accordion-faq",
    "contact-card",
    "process-steps",
    "alert-banner",
    "status-badge",
    "tab-panel"
  ],
  customWorkflows: [
    "student-accommodation-registration",
    "documentation-review-queue",
    "exam-accommodation-request",
    "asa-staff-inbox",
    "student-lifecycle-management"
  ],
  chatbotSummary:
    "Use ASA for accommodation requests, documentation guidance, exam accommodations, faculty accommodation questions, and disability-related support."
});
