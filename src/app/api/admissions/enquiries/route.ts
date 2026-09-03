import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_LEVELS = [
  "creche",
  "kindergarten",
  "nursery",
  "primary",
  "secondary",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const childFirstName =
      typeof body.childFirstName === "string" ? body.childFirstName.trim() : "";
    const childLastName =
      typeof body.childLastName === "string" ? body.childLastName.trim() : "";
    const parentName =
      typeof body.parentName === "string" ? body.parentName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    let level = typeof body.level === "string" ? body.level.trim() : "";

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

    return NextResponse.json({ success: true, data: { id: enquiry.id } });
  } catch (error) {
    console.error("Error submitting admission enquiry:", error);
    return NextResponse.json(
      { success: false, error: "Sorry, we could not submit your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
