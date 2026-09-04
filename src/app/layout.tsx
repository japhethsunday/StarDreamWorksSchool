import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stardreamworksschools.com"),
  title: {
    default: "STAR DreamWorks Schools | Pre-School, Nursery, Primary & High School in Ajah, Lagos",
    template: "%s | STAR DreamWorks Schools",
  },
  description:
    "STAR DreamWorks Schools is a caring pre-school, nursery, primary and high school in Ajah, Lagos, Nigeria. Quality education from Pre-School through High School with a focus on academic excellence and character development.",
  keywords: [
    "STAR DreamWorks Schools",
    "school in Ajah Lagos",
    "nursery school in Ajah",
    "primary school in Ajah",
    "high school in Ajah",
    "kindergarten school in Ajah",
    "creche in Ajah",
    "admissions in Ajah Lagos",
    "Lagos school",
    "quality education Lagos",
  ],
  authors: [{ name: "STAR DreamWorks Schools" }],
  creator: "STAR DreamWorks Schools",
  publisher: "STAR DreamWorks Schools",
  metadataBase: new URL("https://www.stardreamworksschools.com"),
  alternates: {
    canonical: "https://www.stardreamworksschools.com",
  },
  openGraph: {
    title: "STAR DreamWorks Schools | Pre-School, Nursery, Primary & High School in Ajah, Lagos",
    description:
      "Admission is open — Creche, Kindergarten, Nursery, Primary and Secondary School in Ajah, Lagos, Nigeria.",
    url: "https://www.stardreamworksschools.com",
    siteName: "STAR DreamWorks Schools",
    images: [
      {
        url: "/images/school-crest.jpg",
        width: 1200,
        height: 630,
        alt: "STAR DreamWorks Schools - School Logo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAR DreamWorks Schools | Pre-School, Nursery, Primary & High School in Ajah, Lagos",
    description:
      "Admission is open — Creche, Kindergarten, Nursery, Primary and Secondary School in Ajah, Lagos, Nigeria.",
    images: ["/images/school-crest.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/images/icon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="msapplication-TileColor" content="#1e3a5f" />
      </head>
      <body className="font-[family-name:var(--font-inter)] antialiased">
        <Providers>{children}</Providers>
        <JsonLd />
      </body>
    </html>
  );
}
