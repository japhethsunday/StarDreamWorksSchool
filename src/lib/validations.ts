import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Gender is required" }),
  classId: z.string().optional(),
  parentContact: z.string().optional(),
  address: z.string().optional(),
  academicSession: z.string().optional(),
});

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

export const createParentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().optional(),
  level: z.enum(["NURSERY", "PRIMARY", "JSS"], {
    required_error: "Class level is required",
  }),
  classTeacherId: z.string().optional(),
  academicSession: z.string().optional(),
  capacity: z.number().int().min(1).default(40),
  description: z.string().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
  level: z.enum(["NURSERY", "PRIMARY", "JSS"], {
    required_error: "Subject level is required",
  }),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.number().int().min(1).default(100),
  attachments: z.string().optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  targetType: z.enum(["SCHOOL", "CLASS"], {
    required_error: "Target type is required",
  }),
  classId: z.string().optional(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
  isPublished: z.boolean().default(false),
});

export const createNewsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().optional(),
  image: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateParentInput = z.infer<typeof createParentSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
