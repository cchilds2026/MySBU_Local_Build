export const serviceCatalog = Object.freeze([
  {
    id: "asa-accommodation-registration",
    departmentId: "asa",
    title: "Request academic accommodations",
    category: "Academic accommodations",
    audiences: ["students", "graduate-students"],
    serviceType: "workflow",
    fulfillmentModel: "custom-app",
    sitefinityPath: "/accessibility-services/request-accommodations",
    summary:
      "Start an accommodation request, submit documentation, and move into ASA review and intake.",
    keywords: ["accommodations", "disability", "documentation", "intake", "asa"],
    components: ["process-steps", "form-panel", "resource-list", "alert-banner"],
    chatbotIntent: "start_accommodation_request"
  },
  {
    id: "asa-exam-accommodations",
    departmentId: "asa",
    title: "Manage accommodated exam requests",
    category: "Testing accommodations",
    audiences: ["students", "faculty-staff", "asa-staff"],
    serviceType: "workflow",
    fulfillmentModel: "custom-app",
    sitefinityPath: "/accessibility-services/exam-accommodations",
    summary:
      "Request, review, schedule, and track accommodated exam arrangements.",
    keywords: ["exam", "testing", "extended time", "faculty", "schedule"],
    components: ["service-card", "status-badge", "tab-panel", "contact-card"],
    chatbotIntent: "exam_accommodation_help"
  },
  {
    id: "asa-resource-library",
    departmentId: "asa",
    title: "Find ASA forms, guides, and policies",
    category: "Resources",
    audiences: ["students", "faculty-staff", "graduate-students"],
    serviceType: "content",
    fulfillmentModel: "sitefinity-cms",
    sitefinityPath: "/accessibility-services/resources",
    summary:
      "Browse published ASA documents, forms, documentation guidance, and policy resources.",
    keywords: ["forms", "resources", "guides", "policies", "download"],
    components: ["resource-list", "accordion-faq", "service-card"],
    chatbotIntent: "find_asa_resource"
  },
  {
    id: "hr-benefits",
    departmentId: "hr",
    title: "Benefits information and forms",
    category: "Benefits",
    audiences: ["faculty-staff"],
    serviceType: "content",
    fulfillmentModel: "sitefinity-cms",
    sitefinityPath: "/human-resources/benefits",
    summary:
      "Find benefits information, enrollment guidance, forms, and support contacts.",
    keywords: ["benefits", "insurance", "retirement", "forms", "hr"],
    components: ["resource-list", "accordion-faq", "contact-card", "alert-banner"],
    chatbotIntent: "hr_benefits_help"
  },
  {
    id: "hr-hiring-onboarding",
    departmentId: "hr",
    title: "Hiring and onboarding support",
    category: "Hiring and onboarding",
    audiences: ["faculty-staff", "managers"],
    serviceType: "guided-content",
    fulfillmentModel: "sitefinity-cms-plus-workflow",
    sitefinityPath: "/human-resources/hiring-onboarding",
    summary:
      "Guide managers and new employees through hiring, onboarding, and required paperwork.",
    keywords: ["hiring", "onboarding", "new employee", "manager", "forms"],
    components: ["process-steps", "resource-list", "contact-card", "service-card"],
    chatbotIntent: "hr_hiring_help"
  },
  {
    id: "issa-maintain-status",
    departmentId: "issa",
    title: "Maintain immigration status",
    category: "Immigration status",
    audiences: ["international-students"],
    serviceType: "guided-content",
    fulfillmentModel: "sitefinity-cms-plus-workflow",
    sitefinityPath: "/international-student-services/maintain-status",
    summary:
      "Understand enrollment, address, travel, and employment rules for maintaining status.",
    keywords: ["visa", "status", "immigration", "f-1", "international"],
    components: ["accordion-faq", "process-steps", "alert-banner", "resource-list"],
    chatbotIntent: "issa_status_help"
  },
  {
    id: "issa-travel-signature",
    departmentId: "issa",
    title: "Request a travel signature",
    category: "Travel",
    audiences: ["international-students"],
    serviceType: "workflow",
    fulfillmentModel: "custom-app-or-sitefinity-form",
    sitefinityPath: "/international-student-services/travel-signature",
    summary:
      "Submit or prepare a request for travel signature review before leaving the United States.",
    keywords: ["travel", "signature", "i-20", "visa", "international"],
    components: ["process-steps", "document-checklist", "form-panel", "contact-card"],
    chatbotIntent: "issa_travel_signature"
  }
]);

export function getServicesByDepartment(departmentId) {
  return serviceCatalog.filter((service) => service.departmentId === departmentId);
}

export function getServicesForAudience(audience) {
  return serviceCatalog.filter((service) =>
    service.audiences.includes(audience)
  );
}

export function searchServices(searchTerm) {
  const normalized = String(searchTerm || "").trim().toLowerCase();
  if (!normalized) return serviceCatalog;

  return serviceCatalog.filter((service) => {
    const searchable = [
      service.title,
      service.category,
      service.summary,
      service.departmentId,
      ...(service.keywords || [])
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalized);
  });
}
