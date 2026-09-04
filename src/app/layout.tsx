import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import Providers from "@/components/Providers";
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
  metadataBase: new URL("https://stardreamworksschool.vercel.app"),
  title: "STAR DreamWorks Schools | Caring Nursery, Primary & JSS",
  description:
    "STAR DreamWorks Schools - A leading educational institution in Ajah, Lagos, Nigeria. Providing quality Nursery, Primary, and Junior Secondary education with a focus on academic excellence, character development, and nurturing every child's potential.",
  keywords: [
    "school in Ajah",
    "Lagos school",
    "nursery school",
    "primary school",
    "JSS school",
    "STAR DreamWorks Schools",
    "quality education Lagos",
  ],
  openGraph: {
    title: "STAR DreamWorks Schools | Caring Nursery, Primary & JSS",
    description:
      "Admission is open — Creche, Kindergarten, Nursery, Primary and Secondary School in Ajah, Lagos.",
    url: "https://stardreamworksschool.vercel.app",
    siteName: "STAR DreamWorks Schools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAR DreamWorks Schools | Caring Nursery, Primary & JSS",
    description:
      "Admission is open — Creche, Kindergarten, Nursery, Primary and Secondary School in Ajah, Lagos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="font-[family-name:var(--font-inter)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
