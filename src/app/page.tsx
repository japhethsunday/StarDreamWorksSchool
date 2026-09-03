"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Users,
  Heart,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Reveal from "@/components/public/Reveal";
import Logo from "@/components/public/Logo";
import UniformIllustration from "@/components/public/UniformIllustration";
import { useSiteContent } from "@/lib/use-site-content";
import {
  displayPhones,
  displayAddress,
  telHref,
  formatPhone,
  ADMISSION_LEVELS,
  SCHOOL_MOTTO_LINES,
  SCHOOL_SIGNATURE_LINE,
  SCHOOL_LEVELS_RIBBON,
} from "@/lib/school-contact";

export default function HomePage() {
  const { settings, levels, loading } = useSiteContent();
  const tagline = settings["school.tagline"] || "Caring Nursery, Primary & JSS";
  const introTitle = settings["homepage.introTitle"] || "Welcome to STAR DreamWorks Schools";
  const introBody =
    settings["homepage.introBody"] ||
    "STAR DreamWorks Schools is a caring nursery, primary and junior secondary school in Ajah, Lagos. We combine strong academics with good character, giving every child the foundation they need to thrive.";
  const address = displayAddress(settings["school.location"]);
  const phones = displayPhones(settings["school.phone"]);
  const email = settings["school.email"];
  const admissionOpen = (settings["admissions.status"] || "open").toLowerCase() === "open";

  const ordered = [...levels].sort((a, b) => a.sortOrder - b.sortOrder);
  const displayLevels = ordered.length ? ordered : null;
  const levelChips = displayLevels
    ? displayLevels.map((l) => l.name)
    : [...ADMISSION_LEVELS];

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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden sd-hero-surface">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-14 items-center">
            {/* Copy */}
            <div>
              <p
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 sd-enter"
                style={{ "--enter-delay": "0ms" } as React.CSSProperties}
              >
                <span className="sd-live-dot inline-block h-2 w-2 rounded-full bg-brand-green" />
                <span className="text-[13px] font-bold text-brand-yellow tracking-wide">
                  {admissionOpen
                    ? "Admission is Open — Creche to Secondary School"
                    : tagline}
                </span>
              </p>

              <h1
                className="font-heading font-bold text-white leading-[1.05] tracking-tight text-[2.6rem] sm:text-6xl lg:text-[4.2rem] mb-4 sd-enter"
                style={{ "--enter-delay": "90ms" } as React.CSSProperties}
              >
                STAR{" "}
                <span className="text-brand-yellow">DreamWorks</span>{" "}
                Schools
              </h1>
              <p
                className="font-heading text-lg sm:text-xl font-medium text-white/85 mb-5 sd-enter"
                style={{ "--enter-delay": "160ms" } as React.CSSProperties}
              >
                “{tagline}”
              </p>

              <p
                className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed mb-7 sd-enter"
                style={{ "--enter-delay": "230ms" } as React.CSSProperties}
              >
                A caring nursery, primary and junior secondary school in Ajah,
                Lagos — strong learning and good character, together.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3.5 mb-8 sd-enter"
                style={{ "--enter-delay": "300ms" } as React.CSSProperties}
              >
                <Link
                  href="/admissions"
                  className="sd-btn sd-btn-apply px-8 py-4 text-[15px]"
                >
                  Apply for Admission
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="sd-btn sd-btn-outline-light px-8 py-4 text-[15px]"
                >
                  Contact the School
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-9 sd-enter"
                style={{ "--enter-delay": "370ms" } as React.CSSProperties}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Call us
                </span>
                {phones.map((p) => (
                  <a
                    key={p}
                    href={telHref(p)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-brand-yellow transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-yellow" />
                    {formatPhone(p)}
                  </a>
                ))}
              </div>

              <ul
                className="flex flex-wrap gap-2 sd-enter"
                style={{ "--enter-delay": "440ms" } as React.CSSProperties}
                aria-label="School levels"
              >
                {levelChips.map((name) => (
                  <li key={name}>
                    <Link
                      href="/academics"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 border border-white/20 rounded-full hover:bg-white/10 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-brand-yellow" />
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Flyer-echo card */}
            <div
              className="sd-enter-scale"
              style={{ "--enter-delay": "250ms" } as React.CSSProperties}
            >
              <div className="relative bg-brand-paper border border-brand-line rounded-2xl overflow-hidden shadow-soft-lg max-w-md mx-auto lg:ml-auto">
                <div className="bg-brand-red text-white text-center text-[11px] sm:text-xs font-bold uppercase py-2 px-4" style={{ letterSpacing: "0.18em" }}>
                  {SCHOOL_LEVELS_RIBBON}
                </div>
                <div className="p-7 sm:p-8">
                  <div className="flex justify-center mb-5">
                    <Logo crestClassName="w-16 h-16" tagline={undefined} />
                  </div>
                  <dl className="space-y-2.5 text-center">
                    {SCHOOL_MOTTO_LINES.map((m) => (
                      <div
                        key={m.left}
                        className="flex items-center justify-center gap-3 font-heading text-sm sm:text-[15px] font-bold tracking-wide text-brand-navy"
                      >
                        <dt>{m.left}</dt>
                        <dd aria-hidden="true" className="text-brand-red">=</dd>
                        <dd>{m.right}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 pt-5 border-t border-brand-line text-center">
                    <p className="font-heading text-sm font-bold italic text-brand-red">
                      “{SCHOOL_SIGNATURE_LINE}”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sd-gold-rule" />
      </section>

      {/* ============ ADMISSIONS BAND ============ */}
      <section className="border-b border-brand-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Reveal>
            <p className="sd-eyebrow mb-2.5">Admissions</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight mb-2">
              {admissionOpen ? "Admission is open" : "Admissions status"}
            </h2>
            <p className="text-brand-body max-w-2xl leading-relaxed">
              {settings["admissions.message"] ||
                "Applications are open for Creche, Kindergarten, Nursery, Primary and Secondary School."}
            </p>
          </Reveal>
          <Reveal delay={120} className="shrink-0">
            <Link href="/admissions" className="sd-btn sd-btn-apply px-7 py-3.5 text-[15px]">
              Apply for Admission
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ SCHOOL INTRODUCTION ============ */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <p className="sd-eyebrow mb-3">About the school</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink mb-6 leading-tight tracking-tight">
                {introTitle}
              </h2>
              <p className="text-brand-body text-lg leading-relaxed mb-8">
                {introBody}
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 font-bold text-brand-red hover:text-brand-red-dark transition-colors"
              >
                Learn more about us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyUs.map((item, i) => (
                <Reveal key={item.title} delay={i * 90}>
                  <div className="sd-card p-6 h-full">
                    <div className="w-11 h-11 bg-brand-navy rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <h3 className="font-heading font-bold text-brand-ink mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EDUCATIONAL LEVELS ============ */}
      <section id="levels" className="py-20 lg:py-24 bg-brand-paper border-y border-brand-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-12">
            <p className="sd-eyebrow mb-3">Our programmes</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink mb-4 tracking-tight">
              A learning journey for every age
            </h2>
            <p className="text-brand-body leading-relaxed">
              From creche through to secondary school, each stage is designed
              to meet children where they are and help them grow.
            </p>
          </Reveal>

          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 bg-brand-line/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !displayLevels && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: "Creche", ageRange: "0 – 2 years" },
                { name: "Kindergarten", ageRange: "Age 3" },
                { name: "Nursery", ageRange: "Ages 4 – 5" },
                { name: "Primary", ageRange: "Ages 6 – 11" },
                { name: "Secondary School", ageRange: "Ages 12+" },
              ].map((lvl, i) => (
                <Reveal key={lvl.name} delay={(i % 3) * 90}>
                  <Link href="/admissions" className="sd-card group block p-7 h-full">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 bg-brand-navy/5 border border-brand-line rounded-xl flex items-center justify-center group-hover:bg-brand-red/5 group-hover:border-brand-red/20 transition-colors">
                        <GraduationCap className="w-6 h-6 text-brand-red" />
                      </div>
                      <span className="text-xs font-bold text-brand-navy bg-brand-yellow/25 px-2.5 py-1 rounded-full">
                        {lvl.ageRange}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-brand-ink mb-2">
                      {lvl.name}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      Contact the school office to learn more about {lvl.name.toLowerCase()} places.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
                      Enquire now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {!loading && displayLevels && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayLevels.map((lvl, i) => (
                <Reveal key={lvl.id} delay={(i % 3) * 90}>
                  <Link href="/academics" className="sd-card group block p-7 h-full">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 bg-brand-navy/5 border border-brand-line rounded-xl flex items-center justify-center group-hover:bg-brand-red/5 group-hover:border-brand-red/20 transition-colors">
                        <GraduationCap className="w-6 h-6 text-brand-red" />
                      </div>
                      {lvl.ageRange && (
                        <span className="text-xs font-bold text-brand-navy bg-brand-yellow/25 px-2.5 py-1 rounded-full">
                          {lvl.ageRange}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-brand-ink mb-2">
                      {lvl.name}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed line-clamp-3">
                      {lvl.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
                      Learn more
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ LEARNING EXPERIENCE ============ */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal className="order-2 lg:order-1">
              <UniformIllustration className="w-full h-auto" />
              <p className="mt-3 text-xs text-brand-muted text-center">
                Illustration of pupils in the STAR DreamWorks Schools uniform.
              </p>
            </Reveal>

            <div className="order-1 lg:order-2">
              <Reveal>
                <p className="sd-eyebrow mb-3">The STAR difference</p>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink mb-6 leading-tight tracking-tight">
                  We help every child develop in mind, character and confidence
                </h2>
                <p className="text-brand-body text-lg leading-relaxed mb-8">
                  Good schools don&apos;t only teach subjects — they help children
                  grow. Our approach balances strong academics with the care,
                  discipline and encouragement children need to flourish.
                </p>
              </Reveal>
              <ul className="space-y-3.5 mb-9">
                {[
                  "Caring, play-based early years",
                  "A structured primary curriculum",
                  "Confidence and study skills for secondary",
                  "Creative, sporting and character development",
                ].map((item, i) => (
                  <Reveal key={item} delay={i * 70}>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <span className="text-brand-body leading-relaxed">{item}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal>
                <Link href="/academics" className="sd-btn sd-btn-navy px-7 py-3.5 text-[15px]">
                  See our programmes
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MOTTO BAND ============ */}
      <section className="bg-brand-navy-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {SCHOOL_MOTTO_LINES.map((m) => (
                <div key={m.left}>
                  <p className="font-heading text-sm sm:text-base font-bold text-white tracking-wide">
                    {m.left}
                  </p>
                  <p className="font-heading text-brand-yellow font-bold my-0.5">=</p>
                  <p className="font-heading text-sm sm:text-base font-bold text-white tracking-wide">
                    {m.right}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-9 text-center font-heading text-base sm:text-lg font-bold italic text-brand-yellow">
              “{SCHOOL_SIGNATURE_LINE}”
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ CONTACT / LOCATION ============ */}
      <section className="py-20 lg:py-24 bg-gray-50 border-t border-brand-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <Reveal>
              <p className="sd-eyebrow mb-3">Visit us</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink mb-7 tracking-tight">
                Find the school
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white border border-brand-line rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-bold text-brand-ink">Address</p>
                    <p className="text-brand-body">{address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-white border border-brand-line rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-bold text-brand-ink">Phone</p>
                    <div className="space-y-1">
                      {phones.map((p) => (
                        <p key={p}>
                          <a
                            href={telHref(p)}
                            className="text-brand-body font-semibold hover:text-brand-red transition-colors"
                          >
                            {formatPhone(p)}
                          </a>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                {email && (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white border border-brand-line rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="font-bold text-brand-ink">Email</p>
                      <a href={`mailto:${email}`} className="text-brand-body hover:text-brand-red transition-colors break-all">
                        {email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/contact"
                className="sd-btn sd-btn-navy mt-8 px-7 py-3.5 text-[15px]"
              >
                Contact us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>

            <Reveal delay={140}>
              <div className="sd-card p-8 lg:p-10">
                <p className="sd-eyebrow mb-3">Admissions enquiry</p>
                <h3 className="font-heading text-xl font-bold text-brand-ink mb-2">
                  Start the conversation
                </h3>
                <p className="text-brand-muted text-sm leading-relaxed mb-6">
                  Submit an enquiry and our team will be in touch with the
                  information you need.
                </p>
                <Link href="/admissions" className="sd-btn sd-btn-apply px-6 py-3.5 text-[15px]">
                  Start an enquiry
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
