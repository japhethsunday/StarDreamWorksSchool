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

export const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "LONG_ANSWER",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const examStatusSchema = z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "ARCHIVED"]);

export const createExamSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().optional(),
  academicSession: z.string().min(1, "Academic session is required"),
  term: z.enum(["FIRST", "SECOND", "THIRD"], { required_error: "Term is required" }),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute"),
  passMark: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  status: examStatusSchema.default("DRAFT"),
  restrictToAssigned: z.boolean().default(false),
  assignedStudentIds: z.array(z.string()).optional(),
  showResults: z.boolean().default(false),
  allowAnswerReview: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(true),
});

export const examQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(QUESTION_TYPES),
  question: z.string().min(1, "Question text is required"),
  marks: z.number().int().min(1, "Marks must be at least 1"),
  correctAnswer: z.string().nullable().optional(),
  guidance: z.string().optional(),
  options: z
    .array(
      z.object({
        key: z.string().min(1),
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean().default(false),
      })
    )
    .optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type CreateExamQuestionInput = z.infer<typeof examQuestionSchema>;

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
