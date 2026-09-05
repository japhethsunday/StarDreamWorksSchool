import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, notifyAdmins } from "@/lib/email/send";
import { enquiryReceivedTemplate, adminAlertTemplate } from "@/lib/email/templates";

const VALID_LEVELS = [
  "creche",
  "kindergarten",
  "nursery",
  "primary",
  "secondary",
];

export async function POST(request: Request) {
  try {
    // Rate limit: 5 enquiries per IP per 15 minutes
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rl = rateLimit(`admissions:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot: bots fill the hidden "website" field; humans never see it.
    // Pretend success without storing anything.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true, data: { id: null } });
    }

    const childFirstName =
      typeof body.childFirstName === "string" ? body.childFirstName.trim() : "";
    const childLastName =
      typeof body.childLastName === "string" ? body.childLastName.trim() : "";
    const parentName =
      typeof body.parentName === "string" ? body.parentName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const level = typeof body.level === "string" ? body.level.trim() : "";

    if (!childFirstName) {
      return NextResponse.json(
        { success: false, error: "Child's first name is required." },
        { status: 400 }
      );
    }
    if (!parentName) {
      return NextResponse.json(
        { success: false, error: "Parent/guardian name is required." },
        { status: 400 }
      );
    }
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "A contact phone number is required." },
        { status: 400 }
      );
    }
    if (!level || !VALID_LEVELS.includes(level.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Please select a school level." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.admissionEnquiry.create({
      data: {
        childFirstName,
        childLastName: childLastName || null,
        dateOfBirth:
          typeof body.dateOfBirth === "string" && body.dateOfBirth
            ? body.dateOfBirth
            : null,
        level: level.toLowerCase(),
        studentClass:
          typeof body.studentClass === "string" ? body.studentClass : null,
        parentName,
        phone,
        email:
          typeof body.email === "string" ? body.email.trim() : "",
        address: typeof body.address === "string" ? body.address : null,
        message: typeof body.message === "string" ? body.message : null,
        status: "NEW",
      },
    });

    const childName = `${childFirstName}${childLastName ? ` ${childLastName}` : ""}`;
    const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

    // Send the parent a confirmation (only if they provided an email).
    if (enquiry.email) {
      const { subject, html } = enquiryReceivedTemplate({
        parentName,
        childName,
        level: levelLabel,
      });
      await sendEmail({
        type: "ADMISSION_ENQUIRY_RECEIVED",
        to: enquiry.email,
        subject,
        html,
        refId: enquiry.id,
      });
    }

    // Notify the school's administrators of the new enquiry.
    const { subject: alertSubject, html: alertHtml } = adminAlertTemplate({
      title: "New admission enquiry received",
      details: `Child: ${childName}\nLevel: ${levelLabel}\nParent: ${parentName}\nPhone: ${phone}\nEmail: ${enquiry.email || "not provided"}`,
    });
    await notifyAdmins("SYSTEM_ALERT", alertSubject, alertHtml, enquiry.id);

    return NextResponse.json({ success: true, data: { id: enquiry.id } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Sorry, we could not submit your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
