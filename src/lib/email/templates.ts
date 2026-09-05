import { SCHOOL_NAME, APP_URL } from "./config";

// STAR DreamWorks Schools brand palette — same tokens as tailwind.config.ts
// (brand-navy / brand-red / brand-yellow / brand-green / warm neutrals),
// so emails match the public website's visual identity exactly.
const BRAND = {
  navyDeep: "#131a3e",
  navy: "#1f2a5e",
  red: "#c93720",
  redDark: "#a82a18",
  green: "#1e7a4c",
  yellow: "#f5b301",
  yellowSoft: "#fce9b8",
  paper: "#fff9ec",
  cream: "#fdf3d7",
  ink: "#1b2340",
  body: "#3f4756",
  muted: "#6b7280",
  line: "#e9e2cf",
};

// Site typography: Poppins (headings) + Inter (body), with safe stacks for
// clients that strip webfonts (Gmail falls back to Arial/Helvetica).
const FONT_HEADING = "Poppins, Inter, Arial, Helvetica, sans-serif";
const FONT_BODY = "Inter, Arial, Helvetica, sans-serif";
const FONT_MONO = "Arial, Helvetica, sans-serif";

// The school's actual crest artwork, hosted by the website itself so it is
// reachable (https) from every email client, including Gmail.
const LOGO_URL = `${APP_URL}/images/school-crest.jpg`;

const esc = (value: string | number | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// The real school crest, framed the way the site renders it: rounded badge on
// white with the red DW ring and a soft shadow. Natural 1080x712 proportions.
const crestBadge = (): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
    <tr>
      <td style="background:#ffffff;padding:6px;border-radius:16px;border:2px solid rgba(201,55,32,0.55);box-shadow:0 8px 20px rgba(19,26,62,0.35);">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="sd-crest-td" style="border-radius:11px;overflow:hidden;width:150px;height:99px;font-size:0;line-height:0;">
              <img class="sd-crest-img" src="${LOGO_URL}" alt="STAR DreamWorks Schools crest" width="150" height="99" style="display:block;width:150px;height:99px;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const wrap = (title: string, bodyHtml: string): string =>
  `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${esc(title)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; }
  @media only screen and (max-width:600px) {
    .sd-wrap { padding:14px 10px !important; }
    .sd-card { border-radius:12px !important; }
    .sd-head-pad { padding:30px 20px 26px !important; }
    .sd-body-pad { padding:26px 22px !important; }
    .sd-footer-pad { padding:20px 18px !important; }
    .sd-btn-out { width:100% !important; }
    .sd-btn-td { width:100% !important; }
    .sd-btn-a { width:100% !important; box-sizing:border-box; }
    .sd-crest-td { width:132px !important; height:87px !important; }
    .sd-crest-img { width:132px !important; height:87px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f1e4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table class="sd-wrap" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f1e4;padding:28px 14px;">
    <tr>
      <td align="center" style="padding:0;">
        <table class="sd-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.line};box-shadow:0 12px 34px rgba(19,26,62,0.10);">
          <!-- Header: deep navy band + gold keyline + the school crest + wordmark -->
          <tr>
            <td style="background:${BRAND.navyDeep};border-bottom:3px solid ${BRAND.yellow};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="sd-head-pad" align="center" style="padding:32px 28px 26px;">
                    ${crestBadge()}
                    <div style="font-family:${FONT_BODY};font-size:11px;font-weight:600;color:${BRAND.yellow};letter-spacing:0.34em;text-transform:uppercase;margin-top:16px;">STAR</div>
                    <div style="font-family:${FONT_HEADING};font-size:23px;line-height:1.15;font-weight:700;color:#ffffff;margin-top:2px;">DreamWorks Schools</div>
                    <div style="font-family:${FONT_BODY};font-size:10.5px;font-weight:500;color:${BRAND.yellow};letter-spacing:0.16em;text-transform:uppercase;margin-top:7px;">Caring Nursery, Primary &amp; JSS</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="sd-body-pad" style="padding:30px 30px 34px;font-family:${FONT_BODY};">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer: dark navy matching the site footer -->
          <tr>
            <td style="background:${BRAND.navyDeep};padding:24px 30px 8px;border-top:1px solid rgba(245,179,1,0.35);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,0.85);line-height:1.8;">
                    <strong style="color:${BRAND.yellow};letter-spacing:0.12em;text-transform:uppercase;">STAR&nbsp;DreamWorks&nbsp;Schools</strong><br/>
                    <span style="color:rgba(255,255,255,0.62);">A caring pre-school, nursery, primary and high school in Ajah, Lagos.</span><br/>
                    <a href="${APP_URL}" style="color:${BRAND.yellow};text-decoration:none;font-weight:600;">Visit our website</a> &middot;
                    <a href="${APP_URL}/contact" style="color:${BRAND.yellow};text-decoration:none;font-weight:600;">Contact us</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="sd-footer-pad" align="center" style="background:${BRAND.navyDeep};padding:0 20px 18px;font-family:${FONT_BODY};font-size:10px;color:rgba(255,255,255,0.45);">
              This is an automated message from ${SCHOOL_NAME}. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const heading = (text: string): string =>
  `<div style="font-family:${FONT_HEADING};font-size:18px;font-weight:700;color:${BRAND.ink};margin-bottom:10px;">${esc(text)}</div>`;

const paragraph = (text: string): string =>
  `<div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;">${text}</div>`;

const infoRow = (label: string, value: string): string =>
  `<tr>
    <td style="padding:8px 0;font-size:13px;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0 8px 16px;font-size:13px;color:${BRAND.ink};font-weight:600;">${esc(value)}</td>
  </tr>`;

const infoBlock = (rows: string): string =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};border:1px solid ${BRAND.line};border-radius:11px;padding:10px 16px;margin:16px 0;">
    ${rows}
  </table>`;

// Bulletproof CTA button styled like the site's .sd-btn-apply (red CTA with
// the brand-red glow). VML path renders rounded corners in Outlook.
const button = (label: string, href: string): string =>
  `<table class="sd-btn-out" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 6px;">
    <tr>
      <td class="sd-btn-td" align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:46px;v-text-anchor:middle;" arcsize="22%" strokecolor="${BRAND.red}" fillcolor="${BRAND.red}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:${FONT_MONO};font-size:14px;font-weight:600;">${esc(label)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a class="sd-btn-a" href="${esc(href)}" style="display:inline-block;padding:13px 30px;font-family:${FONT_BODY};font-size:14px;font-weight:600;line-height:20px;color:#ffffff;text-align:center;text-decoration:none;border-radius:10px;background:${BRAND.red};border:1px solid ${BRAND.red};box-shadow:0 6px 18px rgba(201,55,32,0.28);mso-hide:all;">${esc(label)}</a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;

export interface AccountCreatedData {
  name: string;
  role: string;
  email: string;
  password: string;
  studentId?: string;
  teacherId?: string;
}

export const accountCreatedTemplate = ({ name, role, email, password, studentId, teacherId }: AccountCreatedData): { subject: string; html: string } => {
  const roleLabel = role.toLowerCase() === "admin" ? "administrator" : role.toLowerCase();
  return {
    subject: `Welcome to STAR DreamWorks Schools — your ${roleLabel} account is ready`,
    html: wrap(
      `Welcome, ${name}`,
      `${heading(`Welcome to STAR DreamWorks Schools, ${name}`)}
      ${paragraph(`Your ${roleLabel} account has been created on our school portal. Please keep your login details safe and change your password on first sign-in.`)}
      ${infoBlock(
        `${infoRow("Full name", name)}
         ${infoRow("Role", role)}
         ${studentId ? infoRow("Student ID", studentId) : ""}
         ${teacherId ? infoRow("Staff ID", teacherId) : ""}
         ${infoRow("Sign-in email", email)}
         ${infoRow("Temporary password", password)}`
      )}
      ${button("Sign in to your portal", `${APP_URL}/login`)}
      ${paragraph(`If you did not request this account, please contact the school administration office immediately.`)}`
    ),
  };
};

export interface PasswordResetData {
  name: string;
  email: string;
  password: string;
  actor: string;
}

export const passwordResetTemplate = ({ name, email, password, actor }: PasswordResetData): { subject: string; html: string } => {
  return {
    subject: "Your STAR DreamWorks Schools password has been reset",
    html: wrap(
      "Password reset",
      `${heading(`Your password has been reset, ${name}`)}
      ${paragraph(`Your portal password was recently reset ${actor}. A new password has been generated for your account.`)}
      ${infoBlock(
        `${infoRow("Sign-in email", email)}
         ${infoRow("New password", password)}`
      )}
      ${button("Sign in to your portal", `${APP_URL}/login`)}
      ${paragraph(`If you did not request this change, please contact the school administration office immediately.`)}`
    ),
  };
};

export interface PasswordChangedData {
  name: string;
}

export const passwordChangedTemplate = ({ name }: PasswordChangedData): { subject: string; html: string } => {
  return {
    subject: "Your STAR DreamWorks Schools password was changed",
    html: wrap(
      "Password changed",
      `${heading(`Password changed, ${name}`)}
      ${paragraph(`Your portal password was successfully changed. If you made this change, no further action is needed.`)}
      ${paragraph(`If you did NOT change your password, please contact the school administration office immediately.`)}`
    ),
  };
};

export interface AccountStatusData {
  name: string;
  status: string; // ACTIVATED | SUSPENDED
}

export const accountStatusTemplate = ({ name, status }: AccountStatusData): { subject: string; html: string } => {
  const activated = status === "ACTIVATED";
  return {
    subject: `Your STAR DreamWorks Schools account has been ${activated ? "activated" : "suspended"}`,
    html: wrap(
      "Account status update",
      `${heading(`${activated ? "Welcome back" : "Account suspended"}, ${name}`)}
      ${activated
        ? paragraph(`Your account has been <strong>activated</strong>. You can now sign in to the school portal and use your account normally.`)
        : paragraph(`Your account has been <strong>suspended</strong>. If you believe this is a mistake, please contact the school administration office.`)}
      ${button("Visit the school portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface SecurityAlertData {
  name: string;
  details: string;
}

export const securityAlertTemplate = ({ name, details }: SecurityAlertData): { subject: string; html: string } => {
  return {
    subject: "Security alert — STAR DreamWorks Schools",
    html: wrap(
      "Security alert",
      `${heading(`Security alert, ${name}`)}
      ${paragraph(details)}
      ${paragraph(`If this was you, you can safely ignore this message. If this was NOT you, please contact the school administration office immediately.`)}`
    ),
  };
};

export interface AssignmentSubmittedData {
  teacherName: string;
  studentName: string;
  title: string;
  subjectName: string;
  className: string;
  resubmitted: boolean;
}

export const assignmentSubmittedTemplate = ({ teacherName, studentName, title, subjectName, className, resubmitted }: AssignmentSubmittedData): { subject: string; html: string } => {
  return {
    subject: `${studentName} ${resubmitted ? "resubmitted" : "submitted"}: ${title} — STAR DreamWorks Schools`,
    html: wrap(
      `Submission: ${title}`,
      `${heading(`${studentName} ${resubmitted ? "resubmitted their" : "submitted their"} assignment`)}
      ${paragraph(`Dear ${teacherName},`)}
      ${infoBlock(
        `${infoRow("Student", studentName)}
         ${infoRow("Assignment", title)}
         ${infoRow("Subject", subjectName)}
         ${infoRow("Class", className)}`
      )}
      ${button("Review submission in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface SubmissionGradedData {
  recipientName: string;
  studentName: string;
  title: string;
  subjectName: string;
  score: string;
  maxScore: string;
  feedback: string;
}

export const submissionGradedTemplate = ({ recipientName, studentName, title, subjectName, score, maxScore, feedback }: SubmissionGradedData): { subject: string; html: string } => {
  return {
    subject: `Assignment graded: ${title} (${score}/${maxScore}) — STAR DreamWorks Schools`,
    html: wrap(
      `Grade: ${title}`,
      `${heading(`Assignment graded: ${title}`)}
      ${paragraph(`Dear ${recipientName},`)}
      ${infoBlock(
        `${infoRow("Student", studentName)}
         ${infoRow("Assignment", title)}
         ${infoRow("Subject", subjectName)}
         ${infoRow("Score", `${score} / ${maxScore}`)}`
      )}
      ${feedback ? `<div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;"><strong>Teacher feedback:</strong> ${esc(feedback)}</div>` : ""}
      ${button("View grade in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface DeadlineReminderData {
  recipientName: string;
  title: string;
  subjectName: string;
  className: string;
  dueDate: string;
  status: "reminder" | "overdue";
}

export const deadlineReminderTemplate = ({ recipientName, title, subjectName, className, dueDate, status }: DeadlineReminderData): { subject: string; html: string } => {
  const overdue = status === "overdue";
  return {
    subject: `${overdue ? "Assignment overdue" : "Assignment due soon"}: ${title} — STAR DreamWorks Schools`,
    html: wrap(
      overdue ? "Assignment overdue" : "Assignment reminder",
      `${heading(overdue ? `Assignment overdue: ${title}` : `Assignment due soon: ${title}`)}
      ${paragraph(`Dear ${recipientName},`)}
      ${overdue
        ? paragraph(`The submission deadline for <strong>${esc(title)}</strong> has passed. Please submit it as soon as possible to avoid missing marks.`)
        : paragraph(`This is a friendly reminder that <strong>${esc(title)}</strong> is due ${dueDate}. Please make sure you submit it on time.`)}
      ${infoBlock(
        `${infoRow("Assignment", title)}
         ${infoRow("Subject", subjectName)}
         ${infoRow("Class", className)}
         ${infoRow("Due date", dueDate)}`
      )}
      ${button("Open assignment in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface LearningMaterialData {
  recipientName: string;
  title: string;
  description: string;
  type: string;
  subjectName: string;
  className: string;
}

export const learningMaterialTemplate = ({ recipientName, title, description, type, subjectName, className }: LearningMaterialData): { subject: string; html: string } => {
  return {
    subject: `New learning material: ${title} — STAR DreamWorks Schools`,
    html: wrap(
      `Learning material: ${title}`,
      `${heading(`New learning material: ${title}`)}
      ${paragraph(`Dear ${recipientName},`)}
      ${infoBlock(
        `${infoRow("Material type", type)}
         ${infoRow("Subject", subjectName)}
         ${infoRow("Class", className)}`
      )}
      <div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;">${esc(description ?? "")}</div>
      ${button("View material in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface AcademicUpdateData {
  recipientName: string;
  studentName: string;
  title: string;
  details: string;
}

export const academicUpdateTemplate = ({ recipientName, studentName, title, details }: AcademicUpdateData): { subject: string; html: string } => {
  return {
    subject: `Academic update: ${title} — STAR DreamWorks Schools`,
    html: wrap(
      "Academic update",
      `${heading(title)}
      ${paragraph(`Dear ${recipientName},`)}
      ${studentName ? `<div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;"><strong>Student:</strong> ${esc(studentName)}</div>` : ""}
      <div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;">${esc(details)}</div>
      ${button("View in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface EnquiryReceivedData {
  parentName: string;
  childName: string;
  level: string;
}

export const enquiryReceivedTemplate = ({ parentName, childName, level }: EnquiryReceivedData): { subject: string; html: string } => {
  return {
    subject: "We received your admission enquiry — STAR DreamWorks Schools",
    html: wrap(
      "Admission enquiry received",
      `${heading(`Thank you, ${parentName}!`)}
      ${paragraph(`We have received your admission enquiry for <strong>${esc(childName)}</strong> at the <strong>${esc(level)}</strong> level. Our admissions team will review it and reach out to you soon.`)}
      ${button("Learn more about admissions", `${APP_URL}/admissions`)}
      ${paragraph(`If you have any questions in the meantime, please contact our admissions office through the contact page.`)}`
    ),
  };
};

export interface EnquiryStatusData {
  parentName: string;
  childName: string;
  status: string;
  level: string;
}

export const enquiryStatusTemplate = ({ parentName, childName, status, level }: EnquiryStatusData): { subject: string; html: string } => {
  const statusLine =
    status === "APPROVED"
      ? "We are delighted to inform you that your child has been <strong>admitted</strong> to STAR DreamWorks Schools. Welcome aboard!"
      : status === "CONTACTED"
      ? "We have reached out and our admissions team is now in touch with you about the next steps."
      : "Our admissions team has provided an update on your enquiry. Please contact us if you have questions.";
  return {
    subject: `Admission status update: ${status} — STAR DreamWorks Schools`,
    html: wrap(
      "Admission status update",
      `${heading(`Admission update for ${childName}`)}
      ${paragraph(`Dear ${parentName},`)}
      ${infoBlock(`${infoRow("Child", childName)} ${infoRow("Level", level)} ${infoRow("Status", status)}`)}
      ${paragraph(statusLine)}
      ${button("Contact admissions", `${APP_URL}/contact`)}`
    ),
  };
};

export interface AnnouncementData {
  recipientName: string;
  title: string;
  content: string;
  priority: string;
  targetLabel: string;
}

export const announcementTemplate = ({ recipientName, title, content, priority, targetLabel }: AnnouncementData): { subject: string; html: string } => {
  const urgent = String(priority).toUpperCase() === "URGENT";
  return {
    subject: `[${urgent ? "Urgent" : "Announcement"}] ${title} — STAR DreamWorks Schools`,
    html: wrap(
      title,
      `${heading(urgent ? `URGENT ${targetLabel.toUpperCase()}` : targetLabel)}
      ${paragraph(`Dear ${recipientName},`) }
      <div style="font-size:17px;font-weight:700;color:${BRAND.navy};margin:6px 0 10px;">${esc(title)}</div>
      <div style="font-size:14px;color:${BRAND.body};line-height:1.75;white-space:pre-wrap;margin-bottom:14px;">${esc(content)}</div>
      ${button("View in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface AssignmentData {
  recipientName: string;
  title: string;
  description: string;
  subjectName: string;
  className: string;
  dueDate: string;
  maxScore: number | string;
}

export const assignmentTemplate = ({ recipientName, title, description, subjectName, className, dueDate, maxScore }: AssignmentData): { subject: string; html: string } => {
  return {
    subject: `New assignment: ${title} (${subjectName}) — STAR DreamWorks Schools`,
    html: wrap(
      `Assignment: ${title}`,
      `${heading(`New assignment: ${title}`)}
      ${paragraph(`Dear ${recipientName},`)}
      ${infoBlock(
        `${infoRow("Subject", subjectName)}
         ${infoRow("Class", className)}
         ${infoRow("Due date", dueDate)}
         ${infoRow("Maximum score", String(maxScore))}`
      )}
      <div style="font-size:14px;color:${BRAND.body};line-height:1.75;margin-bottom:14px;">${esc(description ?? "")}</div>
      ${button("Open assignment", `${APP_URL}/login`)}`
    ),
  };
};

export interface GradeData {
  recipientName: string;
  studentName: string;
  subjectName: string;
  score: string;
  grade: string;
  remarks: string;
  term: string;
  academicSession: string;
  className: string;
}

export const gradeTemplate = ({ recipientName, studentName, subjectName, score, grade, remarks, term, academicSession, className }: GradeData): { subject: string; html: string } => {
  return {
    subject: `Result published: ${subjectName} (${grade}) — STAR DreamWorks Schools`,
    html: wrap(
      `Result: ${subjectName}`,
      `${heading(`Result published for ${studentName}`)}
      ${paragraph(`Dear ${recipientName},`)}
      ${infoBlock(
        `${infoRow("Student", studentName)}
         ${infoRow("Class", className)}
         ${infoRow("Subject", subjectName)}
         ${infoRow("Term", term)}
         ${infoRow("Session", academicSession)}
         ${infoRow("Score", score)}
         ${infoRow("Grade", grade)}
         ${infoRow("Remarks", remarks || "—")}`
      )}
      ${button("View results in portal", `${APP_URL}/login`)}`
    ),
  };
};

export interface AdminAlertData {
  title: string;
  details: string;
}

export const adminAlertTemplate = ({ title, details }: AdminAlertData): { subject: string; html: string } => {
  return {
    subject: `[School notification] ${title}`,
    html: wrap(
      title,
      `${heading(title)}
      <div style="font-size:14px;color:${BRAND.body};line-height:1.75;white-space:pre-wrap;">${esc(details)}</div>`
    ),
  };
};

export const sendTestTemplate = (): { subject: string; html: string } => ({
  subject: "STAR DreamWorks Schools — email service test",
  html: wrap(
    "Email test",
    `${heading("Email service test")}
    ${paragraph("This is a test email confirming that the school's transactional email service (Resend) is working correctly and delivering branded messages.")}
    ${button("Open the school portal", `${APP_URL}/login`)}`
  ),
});