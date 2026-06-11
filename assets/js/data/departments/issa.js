export const issaDepartment = Object.freeze({
  id: "issa",
  name: "International Student Services",
  shortName: "ISSA",
  type: "student-support-office",
  showcase: false,
  sitefinitySection: "/international-student-services",
  audiences: ["international-students", "faculty-staff", "admitted-students"],
  contacts: [
    {
      label: "International Student Services",
      email: "international@sbu.edu",
      phone: "716-375-2000",
      location: "Student Success / Enrollment Support"
    }
  ],
  serviceCategories: [
    "Immigration status",
    "I-20 and visa documents",
    "Travel signatures",
    "Employment authorization",
    "Arrival and orientation",
    "Forms and document requests"
  ],
  reusableComponents: [
    "department-hero",
    "service-catalog-list",
    "resource-list",
    "accordion-faq",
    "contact-card",
    "process-steps",
    "alert-banner",
    "document-checklist",
    "status-badge"
  ],
  customWorkflows: [
    "i20-request",
    "travel-signature-request",
    "cpt-opt-request",
    "immigration-document-upload"
  ],
  chatbotSummary:
    "Use ISSA for international student immigration, I-20 questions, visa/status guidance, travel signatures, CPT/OPT, and arrival support."
});
