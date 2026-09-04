import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "Explore academic programmes at STAR DreamWorks Schools in Ajah, Lagos. From Pre-school through High School, a caring learning journey at every stage.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/academics",
  },
  openGraph: {
    title: "Academics — STAR DreamWorks Schools",
    description:
      "Explore academic programmes at STAR DreamWorks Schools in Ajah, Lagos — from Pre-school through High School.",
    url: "https://www.stardreamworksschools.com/academics",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools Academics" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academics — STAR DreamWorks Schools",
    description:
      "Explore academic programmes at STAR DreamWorks Schools in Ajah, Lagos — from Pre-school through High School.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
