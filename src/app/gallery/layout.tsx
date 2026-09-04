import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse photos of school life at STAR DreamWorks Schools in Ajah, Lagos — classrooms, activities, events, and more.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/gallery",
  },
  openGraph: {
    title: "Gallery — STAR DreamWorks Schools",
    description:
      "Browse photos of school life at STAR DreamWorks Schools in Ajah, Lagos.",
    url: "https://www.stardreamworksschools.com/gallery",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools Gallery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery — STAR DreamWorks Schools",
    description:
      "Browse photos of school life at STAR DreamWorks Schools in Ajah, Lagos.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
