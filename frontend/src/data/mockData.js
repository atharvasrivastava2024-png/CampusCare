export const complaintQueue = [
  {
    id: "CMP-2048",
    student: "Riya Shah",
    category: "Academic fairness",
    campus: "North Hall",
    status: "Awaiting review",
    severity: "High",
    submitted: "2026-10-10",
    summary:
      "Repeated delay in grade publication and inconsistent marking criteria for the Applied Statistics course.",
    triage: "Policy mismatch",
  },
  {
    id: "CMP-2051",
    student: "Marcus Lee",
    category: "Hostel facilities",
    campus: "West Residence",
    status: "In progress",
    severity: "Medium",
    submitted: "2026-10-09",
    summary:
      "Water supply disruptions and poor hygiene conditions in the dormitory washrooms over the past week.",
    triage: "Facilities risk",
  },
  {
    id: "CMP-2057",
    student: "Aisha Noor",
    category: "Harassment",
    campus: "Main Campus",
    status: "Escalated",
    severity: "Critical",
    submitted: "2026-10-08",
    summary:
      "Report of repeated harassment during lab sessions and lack of response from faculty reporting channels.",
    triage: "Safety escalation",
  },
  {
    id: "CMP-2064",
    student: "Nikhil Verma",
    category: "Transport",
    campus: "South Gate",
    status: "Resolved",
    severity: "Low",
    submitted: "2026-10-06",
    summary:
      "Bus route scheduling issues during evening commute causing repeated delays for students in the engineering block.",
    triage: "Operational fix",
  },
];

export const dashboardMetrics = [
  { label: "Open complaints", value: "24", delta: "+12% vs last week" },
  { label: "Awaiting committee", value: "08", delta: "3 require escalation" },
  { label: "Resolved this month", value: "142", delta: "+19% response rate" },
  { label: "AI triage confidence", value: "94%", delta: "Across 170 submissions" },
];

export const categoryBreakdown = [
  { name: "Academic fairness", value: 32, tone: "bg-indigo-500" },
  { name: "Student welfare", value: 24, tone: "bg-cyan-500" },
  { name: "Harassment", value: 18, tone: "bg-rose-500" },
  { name: "Facilities", value: 14, tone: "bg-amber-500" },
  { name: "Transport", value: 12, tone: "bg-emerald-500" },
];

export const policyReferences = [
  { title: "Student Code of Conduct", detail: "Section 6.2 — procedural fairness and reporting confidentiality." },
  { title: "Academic Integrity Policy", detail: "Section 3.1 — grading transparency and reassessment timelines." },
  { title: "Campus Safety Charter", detail: "Section 12 — mandatory response and support for harassment disclosures." },
];

export const issueCategories = [
  "Academic fairness",
  "Harassment",
  "Hostel facilities",
  "Transport",
  "Examination",
  "Faculty conduct",
  "Student welfare",
  "IT access",
  "Other",
];
