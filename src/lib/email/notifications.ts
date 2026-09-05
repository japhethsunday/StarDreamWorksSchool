import { prisma } from "@/lib/prisma";
import { sendEmail } from "./send";
import {
  announcementTemplate,
  assignmentTemplate,
  gradeTemplate,
} from "./templates";

interface EmailRecipient {
  name: string;
  email: string;
}

const uniqueRecipients = (list: EmailRecipient[]): EmailRecipient[] => {
  const seen = new Set<string>();
  const out: EmailRecipient[] = [];
  for (const item of list) {
    const email = String(item.email ?? "").trim().toLowerCase();
    if (email && email.includes("@") && !seen.has(email)) {
      seen.add(email);
      out.push({ name: item.name, email });
    }
  }
  return out;
};

async function classRecipients(classId: string): Promise<EmailRecipient[]> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { name: true, email: true, isActive: true } },
          parentLinks: {
            select: {
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
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
      });
    }
    for (const link of student.parentLinks) {
      const parent = link.parent;
      if (parent.user.isActive) {
        recipients.push({
          name: parent.user.name || `${parent.firstName} ${parent.lastName}`,
          email: parent.user.email,
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
    select: { name: true, email: true },
  });

  const recipients = uniqueRecipients(
    users.map((u) => ({ name: u.name, email: u.email }))
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
  const recipients = await classRecipients(announcement.classId);

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
  const recipients = await classRecipients(assignment.classId);

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
      user: { select: { name: true, email: true, isActive: true } },
      parentLinks: {
        select: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
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
      });
    }
  }

  const studentName = `${student.firstName} ${student.lastName}`;

  for (const recipient of uniqueRecipients(studentRecipients)) {
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
    });
  }
}