const navigationItems = [
  { path: "/admin", label: "Dashboard", icon: "▦", end: true },
  { path: "/admin/students", label: "Students", icon: "♙" },
  { path: "/admin/teachers", label: "Teachers", icon: "✎" },
  { path: "/admin/subjects", label: "Subjects", icon: "◤" },
  { path: "/admin/exams", label: "Exams", icon: "◣" },
  { path: "/admin/results", label: "Results", icon: "◈" },
];

const teacherNavigationItems = [
  { path: "/teacher", label: "Dashboard", icon: "▦", end: true },
  { path: "/teacher/marks", label: "Enter Marks", icon: "✎" },
];

export default navigationItems;
export { teacherNavigationItems };
