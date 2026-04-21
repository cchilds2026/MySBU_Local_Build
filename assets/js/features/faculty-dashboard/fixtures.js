export const facultyCourses = [
  {
    id: "SEC-ENG220-01",
    sourceSectionId: "SEC-ENG220-01",
    code: "ENG-220",
    title: "Writing in Society",
    semester: "Spring 2026",
    enrollment: 22,
    status: "Active",
    sectionCode: "01"
  },
  {
    id: "SEC-PSY101-01",
    sourceSectionId: "SEC-PSY101-01",
    code: "PSY-101",
    title: "Intro to Psychology",
    semester: "Spring 2026",
    enrollment: 31,
    status: "Active",
    sectionCode: "01"
  },
  {
    id: "SEC-FYE100-01",
    sourceSectionId: "SEC-FYE100-01",
    code: "FYE-100",
    title: "First Year Seminar",
    semester: "Spring 2026",
    enrollment: 18,
    status: "Active",
    sectionCode: "01"
  }
];

export const facultyLetters = [
  {
    id: "letter-eng220-1",
    courseId: "SEC-ENG220-01",
    title: "Jordan Williams Accommodation Notice",
    receivedAt: "04/12/2026",
    status: "Unread",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing",
      "Note-Taking Support"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for ENG-220."
  },
  {
    id: "letter-psy101-1",
    courseId: "SEC-PSY101-01",
    title: "Jordan Williams Accommodation Notice",
    receivedAt: "04/11/2026",
    status: "Read",
    studentName: "Jordan Williams",
    studentId: "900123456",
    studentEmail: "jordan.williams@sbu.edu",
    accommodations: [
      "Extended Time on Exams",
      "Reduced Distraction Testing"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for PSY-101."
  },
  {
    id: "letter-fye100-1",
    courseId: "SEC-FYE100-01",
    title: "Casey Martin Accommodation Notice",
    receivedAt: "04/08/2026",
    status: "Read",
    studentName: "Casey Martin",
    studentId: "900456789",
    studentEmail: "casey.martin@sbu.edu",
    accommodations: [
      "Accessible Seating",
      "Lecture Recording"
    ],
    summary:
      "Student has approved accommodations on file through Accessibility Services and Accommodations for FYE-100."
  }
];