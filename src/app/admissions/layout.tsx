import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Apply to STAR DreamWorks Schools in Ajah, Lagos. Admission is open for Creche, Kindergarten, Nursery, Primary and Secondary School. Start your enquiry today.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/admissions",
  },
  openGraph: {
    title: "Admissions — STAR DreamWorks Schools",
    description:
      "Apply to STAR DreamWorks Schools in Ajah, Lagos. Admission is open for Creche, Kindergarten, Nursery, Primary and Secondary School.",
    url: "https://www.stardreamworksschools.com/admissions",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools Admissions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Admissions — STAR DreamWorks Schools",
    description:
      "Apply to STAR DreamWorks Schools in Ajah, Lagos. Admission is open for Creche, Kindergarten, Nursery, Primary and Secondary School.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
