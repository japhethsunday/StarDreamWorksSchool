"use client";

import Link from "next/link";
import {
  Star,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Users,
  Heart,
  ShieldCheck,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { useSiteContent } from "@/lib/use-site-content";

export default function HomePage() {
  const { settings, levels, loading } = useSiteContent();
  const name = settings["school.name"] || "STAR DreamWorks Schools";
  const tagline = settings["school.tagline"] || "Caring Nursery, Primary & JSS";
  const introTitle = settings["homepage.introTitle"] || "Welcome to STAR DreamWorks Schools";
  const introBody =
    settings["homepage.introBody"] ||
    "STAR DreamWorks Schools is a caring nursery, primary and junior secondary school in Ajah, Lagos. We combine strong academics with good character, giving every child the foundation they need to thrive.";
  const location = settings["school.location"] || "Ajah, Lagos, Nigeria";
  const phone = settings["school.phone"];
  const email = settings["school.email"];
  const admissionOpen = (settings["admissions.status"] || "open").toLowerCase() === "open";

  const ordered = [...levels].sort((a, b) => a.sortOrder - b.sortOrder);
  const displayLevels = ordered.length ? ordered : null;

  const whyUs = [
    {
      icon: GraduationCap,
      title: "Strong academics",
      text: "A caring, structured curriculum that builds real foundations in literacy, numeracy and critical thinking at every stage.",
    },
    {
      icon: Heart,
      title: "Character & values",
      text: "We nurture honesty, discipline and respect, helping children grow into confident, responsible young people.",
    },
    {
      icon: ShieldCheck,
      title: "A safe environment",
      text: "A secure, well-supervised setting where every child feels valued, protected and supported by staff.",
    },
    {
      icon: Users,
      title: "Attentive teaching",
      text: "Small-group attention and dedicated educators who know each child and bring out their best.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-school-dark">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-school-dark via-school-blue to-[#0e2a4d]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-school-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-school-blue/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 rounded-full px-4 py-1.5 mb-7">
              <Star className="w-4 h-4 text-school-gold fill-school-gold/40" />
              <span className="text-sm text-white/80 font-medium">{tagline}</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              A caring school where every child{" "}
              <span className="text-school-gold">learns and grows</span>
            </h1>

            <p className="text-lg text-white/70 max-w-2xl leading-relaxed mb-9">
              {name} is a nursery, primary and junior secondary school in Ajah,
              Lagos. We provide a strong education in a safe, nurturing
              environment — building academic skill and good character together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/admissions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-school-gold text-school-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                {admissionOpen ? "Apply Now" : "Admissions"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/academics"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/15 transition-colors"
              >
                Explore our programmes
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Level quick nav */}
        {displayLevels && (
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <ul className="flex flex-wrap gap-2">
              {displayLevels.map((lvl) => (
                <li key={lvl.id}>
                  <a
                    href="/academics"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/70 border border-white/15 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-school-gold" />
                    {lvl.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ============ ADMISSIONS BANNER ============ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-school-blue mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-school-green opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-school-green" />
              </span>
              Admissions
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-school-dark mb-2">
              {admissionOpen ? "Admission is open" : "Admissions status"}
            </h2>
            <p className="text-gray-600 max-w-2xl leading-relaxed">
              {settings["admissions.message"] ||
                "Applications are open for Creche, Kindergarten, Nursery, Primary and Secondary School."}
            </p>
          </div>
          <Link
            href="/admissions"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-school-dark text-white font-semibold rounded-lg hover:bg-school-blue transition-colors"
          >
            View admissions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============ SCHOOL INTRODUCTION ============ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                About the school
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-6 leading-tight">
                {introTitle}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {introBody}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/about" className="inline-flex items-center gap-2 font-semibold text-school-blue hover:text-school-gold transition-colors">
                  Learn more about us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyUs.map((item) => (
                <div
                  key={item.title}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft-sm"
                >
                  <div className="w-11 h-11 bg-school-dark rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-school-gold" />
                  </div>
                  <h3 className="font-heading font-semibold text-school-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EDUCATIONAL LEVELS ============ */}
      <section id="levels" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Our programmes
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              A learning journey for every age
            </h2>
            <p className="text-gray-600 leading-relaxed">
              From creche through to secondary school, each stage is designed
              to meet children where they are and help them grow.
            </p>
          </div>

          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 bg-gray-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && displayLevels && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayLevels.map((lvl) => (
                <Link
                  key={lvl.id}
                  href="/academics"
                  className="group bg-white border border-gray-100 rounded-2xl p-7 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-school-blue/5 rounded-xl flex items-center justify-center group-hover:bg-school-blue/10 transition-colors">
                      <GraduationCap className="w-6 h-6 text-school-blue" />
                    </div>
                    {lvl.ageRange && (
                      <span className="text-xs font-semibold text-school-gold">
                        {lvl.ageRange}
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-school-dark mb-2">
                    {lvl.name}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {lvl.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-school-blue group-hover:text-school-gold transition-colors">
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ LEARNING EXPERIENCE ============ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 bg-school-dark rounded-3xl p-10 lg:p-14 text-white relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-school-gold/10 rounded-full blur-2xl" />
              <Sparkles className="w-10 h-10 text-school-gold mb-6" />
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-6 leading-tight">
                Learning that goes beyond the classroom
              </h2>
              <ul className="space-y-5">
                {[
                  "Caring, play-based early years",
                  "A structured primary curriculum",
                  "Confidence and study skills for secondary",
                  "Creative, sporting and character development",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-school-gold shrink-0 mt-0.5" />
                    <span className="text-white/85 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                The STAR difference
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-6 leading-tight">
                We help every child develop in mind, character and confidence
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Good schools don&apos;t only teach subjects — they help children
                grow. Our approach balances strong academics with the care,
                discipline and encouragement children need to flourish.
              </p>
              <Link
                href="/academics"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-school-dark text-white font-semibold rounded-lg hover:bg-school-blue transition-colors"
              >
                See our programmes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT / LOCATION ============ */}
      <section className="py-20 lg:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                Visit us
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-school-dark mb-6">
                Find the school
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-school-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-school-dark">Location</p>
                    <p className="text-gray-600">{location}</p>
                  </div>
                </div>
                {phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-school-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-school-dark">Phone</p>
                      <a href={`tel:${phone}`} className="text-gray-600 hover:text-school-blue">
                        {phone}
                      </a>
                    </div>
                  </div>
                )}
                {email && (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-school-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-school-dark">Email</p>
                      <a href={`mailto:${email}`} className="text-gray-600 hover:text-school-blue">
                        {email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 bg-school-dark text-white font-semibold rounded-lg hover:bg-school-blue transition-colors"
              >
                Contact us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10">
              <h3 className="font-heading text-xl font-bold text-school-dark mb-2">
                Admissions enquiry
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Submit an enquiry and our team will be in touch with the
                information you need.
              </p>
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-school-gold text-school-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Start an enquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
