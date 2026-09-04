export const PERMISSION_CATALOG = [
  { key: "MANAGE_STUDENTS", label: "Manage Students", description: "Create, edit, delete, and view student records" },
  { key: "MANAGE_TEACHERS", label: "Manage Teachers", description: "Create, edit, delete, and view teacher records" },
  { key: "MANAGE_PARENTS", label: "Manage Parents", description: "Create, edit, delete, and view parent records" },
  { key: "MANAGE_CLASSES", label: "Manage Classes", description: "Create, edit, and delete classes" },
  { key: "MANAGE_SUBJECTS", label: "Manage Subjects", description: "Create, edit, and delete subjects" },
  { key: "MANAGE_ASSIGNMENTS", label: "Manage Assignments", description: "Create, edit, and delete assignments" },
  { key: "MANAGE_MATERIALS", label: "Manage Materials", description: "Create, edit, and delete learning materials" },
  { key: "MANAGE_ANNOUNCEMENTS", label: "Manage Announcements", description: "Create, edit, publish, and delete announcements" },
  { key: "MANAGE_NEWS", label: "Manage News", description: "Create, edit, publish, and delete news" },
  { key: "MANAGE_EVENTS", label: "Manage Events", description: "Create, edit, publish, and delete events" },
  { key: "MANAGE_GALLERY", label: "Manage Gallery", description: "Create, edit, publish, and delete gallery items" },
  { key: "MANAGE_ADMISSIONS", label: "Manage Admissions", description: "Create, edit, and process admission applications" },
  { key: "MANAGE_LEVELS", label: "Manage Educational Levels", description: "Create, edit, and delete educational levels" },
  { key: "MANAGE_SETTINGS", label: "Manage Settings", description: "Update site settings and content" },
  { key: "VIEW_ACTIVITY", label: "View Activity Log", description: "View the audit and activity log" },
] as const;

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key) as PermissionKey[];

const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.key, p.label])
);

export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] || key;
}