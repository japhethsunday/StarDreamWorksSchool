export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY,
  from:
    process.env.EMAIL_FROM ||
    "STAR DreamWorks Schools <school@info.stardreamworksschools.com>",
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
};

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://www.stardreamworksschools.com";

export const SCHOOL_NAME = "STAR DreamWorks Schools";