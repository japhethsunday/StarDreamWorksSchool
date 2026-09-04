import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Events | STAR DreamWorks Schools",
  description:
    "Stay updated with the latest news, announcements and upcoming events at STAR DreamWorks Schools in Ajah, Lagos.",
  alternates: {
    canonical: "https://www.stardreamworksschools.com/news",
  },
  openGraph: {
    title: "News & Events | STAR DreamWorks Schools",
    description:
      "Stay updated with the latest news, announcements and upcoming events at STAR DreamWorks Schools.",
    url: "https://www.stardreamworksschools.com/news",
    images: [{ url: "/images/school-crest.jpg", width: 1200, height: 630, alt: "STAR DreamWorks Schools News" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "News & Events | STAR DreamWorks Schools",
    description:
      "Stay updated with the latest news, announcements and upcoming events at STAR DreamWorks Schools.",
    images: ["/images/school-crest.jpg"],
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
