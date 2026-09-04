import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | STAR DreamWorks Schools",
  description:
    "Get in touch with STAR DreamWorks Schools in Ajah, Lagos, Nigeria. Call us, visit us, or send an enquiry. We'd love to hear from you.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/contact",
  },
  openGraph: {
    title: "Contact Us | STAR DreamWorks Schools",
    description:
      "Get in touch with STAR DreamWorks Schools in Ajah, Lagos. Call, visit, or send an enquiry.",
    url: "https://www.stardreamworksschools.com/contact",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | STAR DreamWorks Schools",
    description:
      "Get in touch with STAR DreamWorks Schools in Ajah, Lagos. Call, visit, or send an enquiry.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
