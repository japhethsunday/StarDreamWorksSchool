import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about STAR DreamWorks Schools in Ajah, Lagos — our core values of integrity, compassion, excellence and growth, and our commitment to nurturing every child's potential.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/about",
  },
  openGraph: {
    title: "About Us — STAR DreamWorks Schools",
    description:
      "Learn about STAR DreamWorks Schools in Ajah, Lagos — our core values and commitment to nurturing every child.",
    url: "https://www.stardreamworksschools.com/about",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us — STAR DreamWorks Schools",
    description:
      "Learn about STAR DreamWorks Schools in Ajah, Lagos — our core values and commitment to nurturing every child.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
