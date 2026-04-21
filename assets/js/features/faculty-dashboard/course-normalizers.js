export function normalizeFacultyCourse(record) {
  const subjectCode = record.subject_code || "";
  const courseNumber = record.course_number || "";
  const sectionCode = record.section_code || "";
  const sourceSectionId = record.source_section_id || `${subjectCode}-${courseNumber}-${sectionCode}`;

  return {
    id: sourceSectionId,
    sourceSectionId,
    code: `${subjectCode}-${courseNumber}`,
    title: record.course_title || "Untitled Course",
    semester: record.term_name || "Unknown Term",
    enrollment: Number(record.enrollment || 0),
    status: "Active",
    sectionCode
  };
}