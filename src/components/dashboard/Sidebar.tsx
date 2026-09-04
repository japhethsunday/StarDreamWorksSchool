"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Baby,
  BookOpen,
  FileText,
  Megaphone,
  Newspaper,
  Calendar,
  Image,
  Settings,
  X,
  ClipboardList,
  FolderOpen,
  Activity,
  Layers,
  MessageSquare,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { Crest } from "@/components/public/Logo";

interface SidebarProps {
  role: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Teachers", href: "/dashboard/admin/teachers", icon: <GraduationCap className="w-5 h-5" />, permission: "MANAGE_TEACHERS" },
  { label: "Students", href: "/dashboard/admin/students", icon: <Users className="w-5 h-5" />, permission: "MANAGE_STUDENTS" },
  { label: "Parents", href: "/dashboard/admin/parents", icon: <UserCheck className="w-5 h-5" />, permission: "MANAGE_PARENTS" },
  { label: "Classes", href: "/dashboard/admin/classes", icon: <BookOpen className="w-5 h-5" />, permission: "MANAGE_CLASSES" },
  { label: "Subjects", href: "/dashboard/admin/subjects", icon: <FileText className="w-5 h-5" />, permission: "MANAGE_SUBJECTS" },
  { label: "Assignments", href: "/dashboard/admin/assignments", icon: <ClipboardList className="w-5 h-5" />, permission: "MANAGE_ASSIGNMENTS" },
  { label: "Materials", href: "/dashboard/admin/materials", icon: <FolderOpen className="w-5 h-5" />, permission: "MANAGE_MATERIALS" },
  { label: "Announcements", href: "/dashboard/admin/announcements", icon: <Megaphone className="w-5 h-5" />, permission: "MANAGE_ANNOUNCEMENTS" },
  { label: "News", href: "/dashboard/admin/news", icon: <Newspaper className="w-5 h-5" />, permission: "MANAGE_NEWS" },
  { label: "Events", href: "/dashboard/admin/events", icon: <Calendar className="w-5 h-5" />, permission: "MANAGE_EVENTS" },
  { label: "Gallery", href: "/dashboard/admin/gallery", icon: <Image className="w-5 h-5" />, permission: "MANAGE_GALLERY" },
  { label: "Admissions", href: "/dashboard/admin/admissions", icon: <MessageSquare className="w-5 h-5" />, permission: "MANAGE_ADMISSIONS" },
  { label: "Educational Levels", href: "/dashboard/admin/educational-levels", icon: <Layers className="w-5 h-5" />, permission: "MANAGE_LEVELS" },
  { label: "Site Content", href: "/dashboard/admin/site-content", icon: <Globe className="w-5 h-5" />, permission: "MANAGE_SETTINGS" },
  { label: "Activity", href: "/dashboard/admin/activity", icon: <Activity className="w-5 h-5" />, permission: "VIEW_ACTIVITY" },
  { label: "Settings", href: "/dashboard/admin/settings", icon: <Settings className="w-5 h-5" /> },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Classes", href: "/dashboard/teacher/classes", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Assignments", href: "/dashboard/teacher/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Students", href: "/dashboard/teacher/students", icon: <Users className="w-5 h-5" /> },
  { label: "Materials", href: "/dashboard/teacher/materials", icon: <FolderOpen className="w-5 h-5" /> },
  { label: "Announcements", href: "/dashboard/teacher/announcements", icon: <Megaphone className="w-5 h-5" /> },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Assignments", href: "/dashboard/student/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Grades", href: "/dashboard/student/grades", icon: <FileText className="w-5 h-5" /> },
  { label: "Materials", href: "/dashboard/student/materials", icon: <FolderOpen className="w-5 h-5" /> },
  { label: "Announcements", href: "/dashboard/student/announcements", icon: <Megaphone className="w-5 h-5" /> },
];

const parentNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/parent", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "My Children", href: "/dashboard/parent/children", icon: <Baby className="w-5 h-5" /> },
  { label: "Grades", href: "/dashboard/parent/grades", icon: <FileText className="w-5 h-5" /> },
  { label: "Announcements", href: "/dashboard/parent/announcements", icon: <Megaphone className="w-5 h-5" /> },
];

function canAccess(item: NavItem, permissions?: string[]): boolean {
  if (!item.permission) return true;
  if (!permissions || permissions.length === 0) return true;
  return permissions.includes(item.permission);
}

function getNavItems(role: string, isSuperAdmin: boolean, permissions?: string[]): NavItem[] {
  switch (role) {
    case "ADMIN": {
      const visible = adminNav.filter((item) => canAccess(item, permissions));
      if (!isSuperAdmin) return visible;
      return [
        ...visible.slice(0, -1),
        { label: "Admin Management", href: "/dashboard/admin/admin-management", icon: <ShieldCheck className="w-5 h-5" /> },
        ...visible.slice(-1),
      ];
    }
    case "TEACHER":
      return teacherNav;
    case "STUDENT":
      return studentNav;
    case "PARENT":
      return parentNav;
    default:
      return adminNav;
  }
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin Portal",
  TEACHER: "Teacher Portal",
  STUDENT: "Student Portal",
  PARENT: "Parent Portal",
};

export default function Sidebar({ role, isSuperAdmin = false, permissions, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role, isSuperAdmin, permissions);
  const homeHref = `/dashboard/${role.toLowerCase()}`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-navy-deep/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-brand-navy-deep flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-[68px] border-b border-white/10 shrink-0">
          <Link href={homeHref} className="flex items-center gap-2.5 min-w-0">
            <Crest className="w-9 h-9 shrink-0" />
            <div className="min-w-0 leading-none">
              <p className="font-heading text-[15px] font-bold text-white truncate">
                STAR <span className="text-brand-yellow">DreamWorks</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold text-white/45 uppercase tracking-widest">
                {roleLabel[role] || `${role} Portal`}
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Dashboard">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-yellow" />
                )}
                <span className={isActive ? "text-brand-yellow" : "text-white/40"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <p className="text-[11px] leading-relaxed text-white/35 text-center">
            STAR DreamWorks Schools
            <br />
            <span className="italic text-brand-yellow/70">
              “Your Dream Is Your Signature”
            </span>
          </p>
        </div>
      </aside>
    </>
  );
}
