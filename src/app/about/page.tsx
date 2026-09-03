"use client";

import { Target, Eye, Heart, ShieldCheck, Sparkles, Star } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import { useSiteContent } from "@/lib/use-site-content";

export default function AboutPage() {
  const { settings } = useSiteContent();
  const name = settings["school.name"] || "STAR DreamWorks Schools";
  const location = settings["school.location"] || "Ajah, Lagos, Nigeria";
  const introBody =
    settings["homepage.introBody"] ||
    "STAR DreamWorks Schools is a caring nursery, primary and junior secondary school in Ajah, Lagos. We combine strong academics with good character, giving every child the foundation they need to thrive.";

  const values = [
    {
      icon: ShieldCheck,
      title: "Integrity",
      text: "We model honesty and responsibility, and encourage the same in every child.",
    },
    {
      icon: Heart,
      title: "Compassion",
      text: "Every child is known, valued and supported in a caring environment.",
    },
    {
      icon: Sparkles,
      title: "Excellence",
      text: "We aim for the best in teaching, learning and character — and help children aim high too.",
    },
    {
      icon: Star,
      title: "Growth",
      text: "We help each child grow in confidence, skill and understanding at their own pace.",
    },
  ];

  const foundations = [
    {
      icon: Target,
      title: "Our mission",
      text: "To provide a caring education that helps every child develop strong academic foundations, good character and the confidence to thrive.",
    },
    {
      icon: Eye,
      title: "Our vision",
      text: "To be a trusted school in Ajah, Lagos, known for genuinely caring for children, strong learning, and building responsible young people.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="About us"
        title={`About ${name}`}
        description="A caring nursery, primary and junior secondary school in Ajah, Lagos, built on strong academics and good character."
      />

      {/* School intro */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Who we are
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-6 leading-tight">
              A school built on care and strong learning
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-5">{introBody}</p>
            <p className="text-gray-600 leading-relaxed mb-5">
              We are proud to serve families in {location}. Our focus is the
              whole child: strong academics, good character, and the confidence
              to take on the next stage of their education.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {foundations.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-soft-sm">
                <div className="w-12 h-12 bg-school-dark rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-school-gold" />
                </div>
                <h3 className="font-heading text-xl font-bold text-school-dark mb-3 capitalize">
                  {f.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              What we value
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark">
              The values we encourage in every child
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-soft-sm">
                <div className="w-11 h-11 bg-school-blue/5 rounded-xl flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-school-blue" />
                </div>
                <h3 className="font-heading font-semibold text-school-dark mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-school-dark text-white rounded-3xl p-8 lg:p-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">
              Come and see the school for yourself
            </h2>
            <p className="text-white/70 leading-relaxed max-w-2xl mb-8">
              The best way to learn about {name} is to visit. We&apos;re happy
              to show you around and answer your questions about our
              programmes and admissions.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/admissions"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-school-gold text-school-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Enquire about admissions
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/15 transition-colors"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
