"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const user = session?.user as any;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const roleBadge: Record<string, string> = {
    ADMIN: "Administrator",
    TEACHER: "Teacher",
    STUDENT: "Student",
    PARENT: "Parent",
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-line">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-brand-body hover:text-brand-navy hover:bg-brand-paper transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-brand-ink tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`hidden sm:flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 transition-all duration-150 ${
              searchFocused
                ? "border-brand-navy ring-2 ring-brand-navy/10 w-64"
                : "border-gray-200 w-56"
            }`}
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder:text-gray-400"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <button
            className="relative p-2.5 rounded-lg text-brand-muted hover:text-brand-navy hover:bg-brand-paper transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-brand-paper transition-colors"
              aria-expanded={dropdownOpen}
            >
              <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-brand-ink leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[11px] text-brand-muted">
                  {roleBadge[user?.role] || user?.role}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-brand-muted transition-transform duration-150 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-lg border border-brand-line py-2 animate-slide-down">
                <div className="px-4 py-3 border-b border-brand-line">
                  <p className="text-sm font-bold text-brand-ink">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/dashboard/admin/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-paper hover:text-brand-navy transition-colors"
                >
                  <Settings className="w-4 h-4 text-brand-muted" />
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-red hover:bg-brand-red/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
