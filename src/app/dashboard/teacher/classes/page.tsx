"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  AlertCircle,
  ArrowLeft,
  Mail,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import DataTable from "@/components/dashboard/DataTable";

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section?: string;
  academicSession?: string;
  _count?: { students: number };
  students?: { count: number };
  studentCount?: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  gender: string;
  email?: string;
  status: string;
}

function getLevelBadge(level: string) {
  const map: Record<string, string> = {
    NURSERY: "bg-green-100 text-green-700",
    PRIMARY: "bg-blue-100 text-blue-700",
    JSS: "bg-purple-100 text-purple-700",
  };
  return map[level] || "bg-gray-100 text-gray-700";
}

export default function TeacherClasses() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load classes.");
      }
      const json = await res.json();
      setClasses(json.data || json || []);
    } catch (err: any) {
      setError(err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const openClass = async (cls: ClassItem) => {
    setSelectedClass(cls);
    setStudents([]);
    setStudentsError("");
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/teacher/classes/${cls.id}/students`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load students.");
      }
      const json = await res.json();
      setStudents(json.data || json || []);
    } catch (err: any) {
      setStudentsError(err.message || "Failed to load students.");
    } finally {
      setStudentsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your classes..." fullScreen />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={fetchClasses}
          className="px-4 py-2 bg-school-blue text-white text-sm font-medium rounded-xl hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
          My Classes
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Classes currently assigned to you.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm">
          <EmptyState
            icon={<BookOpen className="w-9 h-9 text-gray-400" />}
            title="No classes assigned"
            description="You haven't been assigned to any classes yet. Contact the administrator."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {classes.map((cls) => {
            const studentCount =
              cls.studentCount ??
              cls._count?.students ??
              cls.students?.count ??
              0;
            return (
              <button
                key={cls.id}
                onClick={() => openClass(cls)}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5 sm:p-6 hover:shadow-soft-md hover:scale-[1.01] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-school-blue to-primary rounded-xl flex items-center justify-center shadow-glow-blue">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getLevelBadge(
                      cls.level
                    )}`}
                  >
                    {cls.level}
                  </span>
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-poppins)] font-bold text-school-dark text-lg group-hover:text-school-blue transition-colors">
                  {cls.name}
                  {cls.section ? ` - ${cls.section}` : ""}
                </h3>
                {cls.academicSession && (
                  <p className="text-xs text-gray-400 mt-0.5">{cls.academicSession}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="w-4 h-4 text-school-green" />
                    <span className="font-semibold text-school-dark">{studentCount}</span>
                    students
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-school-blue">
                  View students
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        title={selectedClass ? `${selectedClass.name} - Students` : "Students"}
        size="lg"
      >
        <div className="space-y-4">
          <button
            onClick={() => setSelectedClass(null)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-school-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to classes
          </button>

          {studentsLoading ? (
            <LoadingSpinner text="Loading students..." />
          ) : studentsError ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-gray-600">{studentsError}</p>
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-9 h-9 text-gray-400" />}
              title="No students in this class"
              description="Students will appear here once they are assigned to this class."
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "name",
                  label: "Student",
                  render: (_, row) => (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-school-blue to-primary rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {row.firstName?.[0]}
                        {row.lastName?.[0]}
                      </div>
                      <span className="font-medium text-gray-800">
                        {row.firstName} {row.lastName}
                      </span>
                    </div>
                  ),
                },
                { key: "studentId", label: "ID", render: (v) => <span className="text-gray-500 font-mono text-xs">{v}</span> },
                { key: "gender", label: "Gender", render: (v) => <span className="capitalize">{v?.toLowerCase()}</span> },
                {
                  key: "status",
                  label: "Status",
                  render: (v) => (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        v === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {v}
                    </span>
                  ),
                },
                {
                  key: "email",
                  label: "Contact",
                  render: (v) =>
                    v ? (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{v}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    ),
                },
                {
                  key: "actions",
                  label: "Profile",
                  render: (_, row) => (
                    <button
                      onClick={() => router.push(`/dashboard/teacher/students?id=${row.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-school-blue hover:underline"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      View
                    </button>
                  ),
                },
              ]}
              data={students}
              emptyMessage="No students in this class"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
