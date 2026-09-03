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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-[family-name:var(--font-poppins)] text-lg sm:text-xl font-bold text-school-dark">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`hidden sm:flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2 transition-all duration-200 ${
              searchFocused
                ? "border-school-blue ring-2 ring-school-blue/10 w-64"
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

          <button className="relative p-2.5 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {roleBadge[user?.role] || user?.role}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-lg border border-gray-100 py-2 animate-slide-down">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/dashboard/admin/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
