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
  Star,
  X,
  ClipboardList,
  FolderOpen,
  Layers,
  MessageSquare,
  Globe,
} from "lucide-react";

interface SidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Teachers", href: "/dashboard/admin/teachers", icon: <GraduationCap className="w-5 h-5" /> },
  { label: "Students", href: "/dashboard/admin/students", icon: <Users className="w-5 h-5" /> },
  { label: "Parents", href: "/dashboard/admin/parents", icon: <UserCheck className="w-5 h-5" /> },
  { label: "Classes", href: "/dashboard/admin/classes", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Subjects", href: "/dashboard/admin/subjects", icon: <FileText className="w-5 h-5" /> },
  { label: "Assignments", href: "/dashboard/admin/assignments", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Announcements", href: "/dashboard/admin/announcements", icon: <Megaphone className="w-5 h-5" /> },
  { label: "News", href: "/dashboard/admin/news", icon: <Newspaper className="w-5 h-5" /> },
  { label: "Events", href: "/dashboard/admin/events", icon: <Calendar className="w-5 h-5" /> },
  { label: "Gallery", href: "/dashboard/admin/gallery", icon: <Image className="w-5 h-5" /> },
  { label: "Admissions", href: "/dashboard/admin/admissions", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Educational Levels", href: "/dashboard/admin/educational-levels", icon: <Layers className="w-5 h-5" /> },
  { label: "Site Content", href: "/dashboard/admin/site-content", icon: <Globe className="w-5 h-5" /> },
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

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
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

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);
  const homeHref = `/dashboard/${role.toLowerCase()}`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-school-dark via-[#0d1e36] to-primary flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link href={homeHref} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-school-gold to-secondary rounded-xl flex items-center justify-center shadow-glow-gold">
              <Star className="w-5 h-5 text-white fill-white/30" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white leading-tight">
                STAR DreamWorks
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">
                {role} Portal
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-white/15 text-white shadow-inner-soft"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                <span
                  className={`transition-colors ${
                    isActive ? "text-school-gold" : "text-white/40 group-hover:text-white/70"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-school-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-white/30 text-center">
              STAR DreamWorks Schools
            </p>
            <p className="text-[10px] text-white/20 text-center mt-0.5">
              Caring Nursery, Primary & JSS
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
