export const hrDepartment = Object.freeze({
  id: "hr",
  name: "Human Resources",
  shortName: "HR",
  type: "administrative-office",
  showcase: false,
  sitefinitySection: "/human-resources",
  audiences: ["faculty-staff", "student-employees", "managers"],
  contacts: [
    {
      label: "Human Resources",
      email: "hr@sbu.edu",
      phone: "716-375-2115",
      location: "Hopkins Hall"
    }
  ],
  serviceCategories: [
    "Benefits",
    "Payroll",
    "Employment",
    "Hiring and onboarding",
    "Policies",
    "Leave and workplace support"
  ],
  reusableComponents: [
    "department-hero",
    "service-catalog-list",
    "resource-list",
    "accordion-faq",
    "contact-card",
    "process-steps",
    "alert-banner",
    "staff-directory",
    "policy-library"
  ],
  customWorkflows: [
    "employment-forms-routing",
    "policy-acknowledgment",
    "manager-request-intake"
  ],
  chatbotSummary:
    "Use HR for employment, benefits, payroll, hiring, onboarding, leave, workplace policies, and employee support."
});
