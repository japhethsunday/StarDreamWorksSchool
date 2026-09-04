import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { v2 as cloudinary } from "cloudinary";

/**
 * Returns a signed upload payload for the admin gallery uploader.
 * The API secret never leaves the server — the browser only receives
 * a short-lived signature.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "Image uploads are not configured yet." },
        { status: 503 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: "stardreamworks/gallery" },
      apiSecret
    );

    return NextResponse.json({
      success: true,
      data: { timestamp, signature, apiKey, cloudName, folder: "stardreamworks/gallery" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not prepare upload. Please try again." },
      { status: 500 }
    );
  }
}
