"use client";

import { Target, Eye, Heart, ShieldCheck, Sparkles, Star, Phone } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import Reveal from "@/components/public/Reveal";
import { useSiteContent } from "@/lib/use-site-content";
import {
  displayPhones,
  displayAddress,
  telHref,
  formatPhone,
  SCHOOL_MOTTO_LINES,
  SCHOOL_SIGNATURE_LINE,
} from "@/lib/school-contact";

export default function AboutPage() {
  const { settings } = useSiteContent();
  const name = settings["school.name"] || "STAR DreamWorks Schools";
  const location = displayAddress(settings["school.location"]);
  const phones = displayPhones(settings["school.phone"]);
  const introBody =
    settings["homepage.introBody"] ||
    "STAR DreamWorks Schools is a caring pre-school, nursery, primary and high school in Ajah, Lagos. We combine strong academics with good character, giving every child the foundation they need to thrive.";

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
      <main id="main-content">
      <PageHero
        eyebrow="About us"
        title={`About ${name}`}
        description="A caring pre-school, nursery, primary and high school in Ajah, Lagos, built on strong academics and good character."
      />

      {/* School intro */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          <Reveal className="max-w-3xl">
            <p className="sd-eyebrow mb-3">Who we are</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mb-6 leading-tight">
              A school built on care and strong learning
            </h2>
            <p className="text-brand-body text-lg leading-relaxed mb-5">{introBody}</p>
            <p className="text-brand-body leading-relaxed mb-5">
              We are proud to serve families in {location}. Our focus is the
              whole child: strong academics, good character, and the confidence
              to take on the next stage of their education.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="relative bg-brand-paper border border-brand-line rounded-2xl overflow-hidden max-w-md mx-auto lg:ml-auto w-full">
              <div className="bg-brand-red text-white text-center text-[11px] font-bold uppercase py-2 px-4" style={{ letterSpacing: "0.18em" }}>
                Pre-School, Nursery, Primary & High School
              </div>
              <div className="p-7">
                <dl className="space-y-2 text-center">
                  {SCHOOL_MOTTO_LINES.map((m) => (
                    <div
                      key={m.left}
                      className="flex items-center justify-center gap-3 font-heading text-sm font-bold tracking-wide text-brand-navy"
                    >
                      <dt>{m.left}</dt>
                      <dd aria-hidden="true" className="text-brand-red">=</dd>
                      <dd>{m.right}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 pt-4 border-t border-brand-line text-center">
                  <p className="font-heading text-sm font-bold italic text-brand-red">
                    “{SCHOOL_SIGNATURE_LINE}”
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-20 bg-brand-paper border-y border-brand-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-5">
            {foundations.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
              <div className="sd-card p-8 h-full">
                <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-brand-yellow" />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-ink mb-3 capitalize">
                  {f.title}
                </h3>
                <p className="text-brand-body leading-relaxed">{f.text}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-12">
            <p className="sd-eyebrow mb-3">What we value</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">
              The values we encourage in every child
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 4) * 80}>
              <div className="sd-card p-7 h-full">
                <div className="w-11 h-11 bg-brand-red/5 border border-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-brand-red" />
                </div>
                <h3 className="font-heading font-bold text-brand-ink mb-2">{v.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{v.text}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
          <div className="sd-hero-surface rounded-2xl p-8 lg:p-12">
            <p className="sd-eyebrow sd-eyebrow-on-dark mb-3">Visit the school</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
              Come and see the school for yourself
            </h2>
            <p className="text-white/70 leading-relaxed max-w-2xl mb-6">
              The best way to learn about {name} is to visit. We&apos;re happy
              to show you around and answer your questions about our
              programmes and admissions.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
              {phones.map((p) => (
                <a
                  key={p}
                  href={telHref(p)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-brand-yellow transition-colors"
                >
                  <Phone className="w-4 h-4 text-brand-yellow" />
                  {formatPhone(p)}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-3.5">
              <Link href="/admissions" className="sd-btn sd-btn-apply px-7 py-3.5 text-[15px]">
                Enquire about admissions
              </Link>
              <Link href="/contact" className="sd-btn sd-btn-outline-light px-7 py-3.5 text-[15px]">
                Contact us
              </Link>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
