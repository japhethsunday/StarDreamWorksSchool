import { prisma } from "@/lib/prisma";
import { sendEmail, type EmailType } from "./send";
import {
  accountStatusTemplate,
  announcementTemplate,
  assignmentTemplate,
  assignmentSubmittedTemplate,
  deadlineReminderTemplate,
  gradeTemplate,
  learningMaterialTemplate,
  passwordChangedTemplate,
  submissionGradedTemplate,
} from "./templates";

interface EmailRecipient {
  name: string;
  email: string;
  userId?: string;
}

const uniqueRecipients = (list: EmailRecipient[]): EmailRecipient[] => {
  const seen = new Set<string>();
  const out: EmailRecipient[] = [];
  for (const item of list) {
    const email = String(item.email ?? "").trim().toLowerCase();
    if (email && email.includes("@") && !seen.has(email)) {
      seen.add(email);
      out.push({ name: item.name, email, userId: item.userId });
    }
  }
  return out;
};

/**
 * Preference field associated with each gated EmailType. Types not listed here
 * are always delivered (account, security, admissions, system alerts).
 */
const PREF_FIELD: Partial<Record<EmailType, "assignment" | "grade" | "feedback" | "announcements" | "materials" | "academicUpdates">> = {
  ASSIGNMENT_PUBLISHED: "assignment",
  ASSIGNMENT_SUBMITTED: "assignment",
  ASSIGNMENT_REMINDER: "assignment",
  ASSIGNMENT_OVERDUE: "assignment",
  ASSIGNMENT_GRADED: "grade",
  GRADE_PUBLISHED: "grade",
  ANNOUNCEMENT: "announcements",
  LEARNING_MATERIAL: "materials",
  ACADEMIC_UPDATE: "academicUpdates",
};

/** Filters recipients by their notification preferences. Users without a
 * preference row default to ENABLED. */
async function applyPreferences(
  list: EmailRecipient[],
  type: EmailType
): Promise<EmailRecipient[]> {
  const field = PREF_FIELD[type];
  if (!field) return list;
  const userIds = list.map((r) => r.userId).filter(Boolean) as string[];
  if (userIds.length === 0) return list;
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
  const byUserId = new Map(prefs.map((p) => [p.userId, p]));
  return list.filter((r) => {
    if (!r.userId) return true;
    const p = byUserId.get(r.userId);
    if (!p) return true;
    return p[field] === true;
  });
}

async function classRecipients(classId: string): Promise<EmailRecipient[]> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true,
          user: { select: { name: true, email: true, isActive: true } },
          parentLinks: {
            select: {
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
                  userId: true,
                  user: { select: { name: true, email: true, isActive: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cls) return [];

  const recipients: EmailRecipient[] = [];
  for (const student of cls.students) {
    if (student.user.isActive) {
      recipients.push({
        name: student.user.name || `${student.firstName} ${student.lastName}`,
        email: student.user.email,
        userId: student.userId,
      });
    }
    for (const link of student.parentLinks) {
      const parent = link.parent;
      if (parent.user.isActive) {
        recipients.push({
          name: parent.user.name || `${parent.firstName} ${parent.lastName}`,
          email: parent.user.email,
          userId: parent.userId,
        });
      }
    }
  }
  return uniqueRecipients(recipients);
}

const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** School-wide announcement: every active student, parent, and teacher account. */
export async function sendSchoolAnnouncement(announcement: {
  id: string;
  title: string;
  content: string;
  priority: string;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["STUDENT", "PARENT", "TEACHER"] },
    },
    select: { name: true, email: true, id: true },
  });

  const recipients = await applyPreferences(
    uniqueRecipients(
      users.map((u) => ({ name: u.name, email: u.email, userId: u.id }))
    ),
    "ANNOUNCEMENT"
  );

  for (const recipient of recipients) {
    const { subject, html } = announcementTemplate({
      recipientName: recipient.name,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetLabel: "School announcement",
    });
    await sendEmail({
      type: "ANNOUNCEMENT",
      to: recipient.email,
      subject,
      html,
      refId: announcement.id,
      userId: recipient.userId,
    });
  }
}

/** Class announcement: students in the class, their parents, and the class teacher. */
export async function sendClassAnnouncement(announcement: {
  id: string;
  title: string;
  content: string;
  priority: string;
  classId: string | null;
}, className: string): Promise<void> {
  if (!announcement.classId) return;
  const recipients = await applyPreferences(
    await classRecipients(announcement.classId),
    "ANNOUNCEMENT"
  );

  const klass = await prisma.class.findUnique({
    where: { id: announcement.classId },
    select: {
      teacher: {
        include: {
          user: { select: { name: true, email: true, isActive: true } },
        },
      },
    },
  });

  const all = uniqueRecipients([
    ...recipients,
    ...(klass?.teacher?.user?.isActive
      ? [{ name: klass.teacher.user.name, email: klass.teacher.user.email }]
      : []),
  ]);

  for (const recipient of all) {
    const { subject, html } = announcementTemplate({
      recipientName: recipient.name,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetLabel: `Announcement for ${className}`,
    });
    await sendEmail({
      type: "ANNOUNCEMENT",
      to: recipient.email,
      subject,
      html,
      refId: announcement.id,
      userId: recipient.userId,
    });
  }
}

export async function sendAssignmentEmails(assignment: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | string;
  maxScore: number;
  classId: string;
  subject: { name: string };
  class: { name: string };
}): Promise<void> {
  const recipients = await applyPreferences(
    await classRecipients(assignment.classId),
    "ASSIGNMENT_PUBLISHED"
  );

  for (const recipient of recipients) {
    const { subject, html } = assignmentTemplate({
      recipientName: recipient.name,
      title: assignment.title,
      description: assignment.description ?? "",
      subjectName: assignment.subject.name,
      className: assignment.class.name,
      dueDate: formatDate(assignment.dueDate),
      maxScore: assignment.maxScore,
    });
    await sendEmail({
      type: "ASSIGNMENT_PUBLISHED",
      to: recipient.email,
      subject,
      html,
      refId: assignment.id,
      userId: recipient.userId,
    });
  }
}

export async function sendGradeEmails(grade: {
  id: string;
  score: number;
  grade: string;
  remarks: string | null;
  term: string;
  academicSession: string;
  studentId: string;
  subject: { name: string };
  class: { name: string };
}): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: grade.studentId },
    select: {
      firstName: true,
      lastName: true,
      userId: true,
      user: { select: { name: true, email: true, isActive: true } },
      parentLinks: {
        select: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
              userId: true,
              user: { select: { name: true, email: true, isActive: true } },
            },
          },
        },
      },
    },
  });

  if (!student) return;

  const studentRecipients: EmailRecipient[] = [
    ...(student.user.isActive && student.user.email
      ? [
          {
            name:
              student.user.name || `${student.firstName} ${student.lastName}`,
            email: student.user.email,
            userId: student.userId,
          },
        ]
      : []),
  ];
  for (const link of student.parentLinks) {
    const parent = link.parent;
    if (parent.user.isActive && parent.user.email) {
      studentRecipients.push({
        name: parent.user.name || `${parent.firstName} ${parent.lastName}`,
        email: parent.user.email,
        userId: parent.userId,
      });
    }
  }

  const studentName = `${student.firstName} ${student.lastName}`;

  for (const recipient of await applyPreferences(
    uniqueRecipients(studentRecipients),
    "GRADE_PUBLISHED"
  )) {
    const { subject, html } = gradeTemplate({
      recipientName: recipient.name,
      studentName,
      subjectName: grade.subject.name,
      score: String(grade.score),
      grade: grade.grade,
      remarks: grade.remarks ?? "",
      term: grade.term,
      academicSession: grade.academicSession,
      className: grade.class.name,
    });
    await sendEmail({
      type: "GRADE_PUBLISHED",
      to: recipient.email,
      subject,
      html,
      refId: grade.id,
      userId: recipient.userId,
    });
  }
}

/** Student submits (or resubmits) an assignment → notify the responsible teacher. */
export async function sendAssignmentSubmittedEmail(input: {
  assignmentId: string;
  title: string;
  subjectName: string;
  className: string;
  studentName: string;
  resubmitted: boolean;
}): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: input.assignmentId },
    select: {
      teacher: {
        select: {
          firstName: true,
          lastName: true,
          userId: true,
          user: { select: { name: true, email: true, isActive: true } },
        },
      },
    },
  });

  if (!assignment?.teacher?.user?.isActive) return;

  const recipients = await applyPreferences(
    [
      {
        name:
          assignment.teacher.user.name ||
          `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        email: assignment.teacher.user.email,
        userId: assignment.teacher.userId,
      },
    ],
    "ASSIGNMENT_SUBMITTED"
  );
  if (recipients.length === 0) return;

  const teacherName =
    assignment.teacher.user.name ||
    `${assignment.teacher.firstName} ${assignment.teacher.lastName}`;

  for (const recipient of recipients) {
    const { subject, html } = assignmentSubmittedTemplate({
      teacherName,
      studentName: input.studentName,
      title: input.title,
      subjectName: input.subjectName,
      className: input.className,
      resubmitted: input.resubmitted,
    });
    await sendEmail({
      type: "ASSIGNMENT_SUBMITTED",
      to: recipient.email,
      subject,
      html,
      refId: `${input.assignmentId}:${recipient.email}:${Date.now()}`,
      userId: recipient.userId,
    });
  }
}

/** Teacher grades a submission → notify the student and, where enabled, parents. */
export async function sendSubmissionGradedEmail(input: {
  submissionId: string;
  assignmentTitle: string;
  subjectName: string;
  score: number;
  maxScore: number;
  feedback: string | null;
}): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    select: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          userId: true,
          user: { select: { name: true, email: true, isActive: true } },
          parentLinks: {
            select: {
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
                  userId: true,
                  user: { select: { name: true, email: true, isActive: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!submission) return;
  const student = submission.student;
  const studentName = `${student.firstName} ${student.lastName}`;

  const recipients: EmailRecipient[] = [
    ...(student.user.isActive && student.user.email
      ? [
          {
            name: student.user.name || studentName,
            email: student.user.email,
            userId: student.userId,
          },
        ]
      : []),
  ];
  for (const link of student.parentLinks) {
    const parent = link.parent;
    if (parent.user.isActive && parent.user.email) {
      recipients.push({
        name: parent.user.name || `${parent.firstName} ${parent.lastName}`,
        email: parent.user.email,
        userId: parent.userId,
      });
    }
  }

  for (const recipient of await applyPreferences(
    uniqueRecipients(recipients),
    "ASSIGNMENT_GRADED"
  )) {
    const { subject, html } = submissionGradedTemplate({
      recipientName: recipient.name,
      studentName,
      title: input.assignmentTitle,
      subjectName: input.subjectName,
      score: String(input.score),
      maxScore: String(input.maxScore),
      feedback: input.feedback ?? "",
    });
    await sendEmail({
      type: "ASSIGNMENT_GRADED",
      to: recipient.email,
      subject,
      html,
      refId: input.submissionId,
      userId: recipient.userId,
    });
  }
}

/** Teacher uploads a learning material → notify the target class. */
export async function sendMaterialEmails(material: {
  id: string;
  title: string;
  description: string | null;
  type: string;
  classId: string | null;
  subject: { name: string } | null;
  class: { name: string } | null;
}): Promise<void> {
  if (!material.classId) return;
  const recipients = await applyPreferences(
    await classRecipients(material.classId),
    "LEARNING_MATERIAL"
  );

  for (const recipient of recipients) {
    const { subject, html } = learningMaterialTemplate({
      recipientName: recipient.name,
      title: material.title,
      description: material.description ?? "",
      type: material.type,
      subjectName: material.subject?.name ?? "General",
      className: material.class?.name ?? "",
    });
    await sendEmail({
      type: "LEARNING_MATERIAL",
      to: recipient.email,
      subject,
      html,
      refId: material.id,
      userId: recipient.userId,
    });
  }
}

/**
 * Sweeps assignments due within 48 hours (or already overdue) and sends
 * reminders / overdue notices to students who have not yet submitted, plus
 * their linked parents. Idempotent per (assignment, recipient, day).
 */
export async function runDuePrompts(): Promise<void> {
  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const assignments = await prisma.assignment.findMany({
    where: { dueDate: { lte: soon } },
    include: {
      subject: { select: { name: true } },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 200,
  });

  const dayKey = now.toISOString().slice(0, 10);

  for (const assignment of assignments) {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignment.id },
      select: { studentId: true },
    });
    const submittedIds = new Set(submissions.map((s) => s.studentId));

    const klass = await prisma.class.findUnique({
      where: { id: assignment.class.id },
      select: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            user: { select: { name: true, email: true, isActive: true } },
            parentLinks: {
              select: {
                parent: {
                  select: {
                    firstName: true,
                    lastName: true,
                    userId: true,
                    user: { select: { name: true, email: true, isActive: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!klass) continue;

    const pending = klass.students.filter((s) => !submittedIds.has(s.id));
    if (pending.length === 0) continue;

    const recipients: EmailRecipient[] = [];
    for (const student of pending) {
      if (student.user.isActive) {
        recipients.push({
          name: student.user.name || `${student.firstName} ${student.lastName}`,
          email: student.user.email,
          userId: student.userId,
        });
      }
      for (const link of student.parentLinks) {
        const parent = link.parent;
        if (parent.user.isActive) {
          recipients.push({
            name: parent.user.name || `${parent.firstName} ${parent.lastName}`,
            email: parent.user.email,
            userId: parent.userId,
          });
        }
      }
    }

    const overdue = now > assignment.dueDate;
    const filtered = await applyPreferences(
      uniqueRecipients(recipients),
      overdue ? "ASSIGNMENT_OVERDUE" : "ASSIGNMENT_REMINDER"
    );

    for (const recipient of filtered) {
      const { subject, html } = deadlineReminderTemplate({
        recipientName: recipient.name,
        title: assignment.title,
        subjectName: assignment.subject.name,
        className: assignment.class.name,
        dueDate: formatDate(assignment.dueDate),
        status: overdue ? "overdue" : "reminder",
      });
      await sendEmail({
        type: overdue ? "ASSIGNMENT_OVERDUE" : "ASSIGNMENT_REMINDER",
        to: recipient.email,
        subject,
        html,
        refId: `${assignment.id}:${recipient.email}:${dayKey}`,
        userId: recipient.userId,
      });
    }
  }
}

/** Account activated or suspended → notify the account holder (always sent). */
export async function sendAccountStatusEmail(input: {
  userId: string;
  name: string;
  email: string;
  activated: boolean;
}): Promise<void> {
  const { subject, html } = accountStatusTemplate({
    name: input.name,
    status: input.activated ? "ACTIVATED" : "SUSPENDED",
  });
  await sendEmail({
    type: "ACCOUNT_STATUS",
    to: input.email,
    subject,
    html,
    refId: `${input.userId}:${input.activated ? "activated" : "suspended"}`,
    userId: input.userId,
  });
}

/** Password changed by the user themselves → security confirmation (always sent). */
export async function sendPasswordChangedEmail(input: {
  userId: string;
  name: string;
  email: string;
}): Promise<void> {
  const { subject, html } = passwordChangedTemplate({ name: input.name });
  await sendEmail({
    type: "PASSWORD_CHANGED",
    to: input.email,
    subject,
    html,
    refId: input.userId,
    userId: input.userId,
  });
}