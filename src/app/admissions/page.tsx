"use client";

import Link from "next/link";
import {
  ClipboardList,
  FileText,
  CreditCard,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  ArrowRight,
  Star,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Inquiry & Registration",
    description:
      "Contact us or visit our school to make an inquiry. Complete the registration form with your child's details and your contact information.",
  },
  {
    icon: FileText,
    step: "02",
    title: "Submit Application",
    description:
      "Submit the completed application form along with the required documents including birth certificate, previous school reports, and passport photographs.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Assessment & Interview",
    description:
      "Your child will undergo an age-appropriate assessment. Parents/guardians will also have a brief interview with the admissions team.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Admission Decision",
    description:
      "Successful applicants will receive an offer letter within one week. Complete the enrollment process by paying the required fees.",
  },
];

const requirements = {
  nursery: [
    "Completed application form",
    "Birth certificate (original and copy)",
    "2 passport-sized photographs",
    "Parent/Guardian valid ID",
    "Immunization records",
  ],
  primary: [
    "Completed application form",
    "Birth certificate (original and copy)",
    "Previous school report/card",
    "2 passport-sized photographs",
    "Parent/Guardian valid ID",
    "Transfer letter (if applicable)",
  ],
  jss: [
    "Completed application form",
    "Birth certificate (original and copy)",
    "Primary school leaving certificate",
    "Previous school reports",
    "2 passport-sized photographs",
    "Parent/Guardian valid ID",
  ],
};

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-school-gold/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            Admissions
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Join Our Family
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Begin your child&apos;s journey to academic excellence at STAR DreamWorks
            Schools. We make the admissions process simple and welcoming.
          </p>
        </div>
      </section>

      {/* Admission Process */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              How to Apply
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              Simple Steps to Enroll
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our streamlined admissions process ensures a smooth experience for
              parents and a welcoming start for students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div
                key={step.step}
                className="relative bg-white rounded-2xl p-8 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="font-[family-name:var(--font-poppins)] text-5xl font-bold text-school-blue/10 absolute top-4 right-6">
                  {step.step}
                </span>
                <div className="w-14 h-14 bg-gradient-to-br from-school-blue to-school-dark rounded-xl flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-school-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-poppins)] text-lg font-bold text-school-dark mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              What You Need
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              Admission Requirements
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Please prepare the following documents for your child&apos;s
              application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(requirements).map(([level, docs]) => {
              const labels: Record<string, { title: string; color: string }> = {
                nursery: { title: "Nursery School", color: "text-emerald-600" },
                primary: { title: "Primary School", color: "text-school-blue" },
                jss: { title: "Junior Secondary", color: "text-amber-600" },
              };
              const info = labels[level];
              return (
                <div
                  key={level}
                  className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100"
                >
                  <h3
                    className={`font-[family-name:var(--font-poppins)] text-lg font-bold ${info.color} mb-5`}
                  >
                    {info.title}
                  </h3>
                  <ul className="space-y-3">
                    {docs.map((doc) => (
                      <li
                        key={doc}
                        className="flex items-start gap-3 text-sm text-gray-600"
                      >
                        <CheckCircle className="w-4 h-4 text-school-green shrink-0 mt-0.5" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Important Dates & Contact */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Important Dates */}
            <div className="bg-gradient-to-br from-school-blue to-school-dark rounded-3xl p-10 text-white">
              <Calendar className="w-10 h-10 text-school-gold mb-6" />
              <h2 className="font-[family-name:var(--font-poppins)] text-2xl font-bold mb-6">
                Important Dates
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4">
                  <div className="w-2 h-2 bg-school-gold rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold">Admission Opens</p>
                    <p className="text-sm text-white/70">January each year</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4">
                  <div className="w-2 h-2 bg-school-gold rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold">Application Deadline</p>
                    <p className="text-sm text-white/70">March each year</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4">
                  <div className="w-2 h-2 bg-school-gold rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold">Resumption Date</p>
                    <p className="text-sm text-white/70">September each year</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4">
                  <div className="w-2 h-2 bg-school-gold rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold">Mid-Year Admission</p>
                    <p className="text-sm text-white/70">
                      Limited spaces available (January)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Admissions */}
            <div className="flex flex-col justify-center">
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                Get in Touch
              </span>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-6">
                Have Questions About Admissions?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Our admissions team is here to guide you through every step of
                the process. Don&apos;t hesitate to reach out with any questions.
              </p>

              <div className="space-y-5 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-school-blue/5 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-school-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Call Us</p>
                    <p className="font-medium text-school-dark">
                      +234 (0) XXX XXX XXXX
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-school-blue/5 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-school-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Us</p>
                    <p className="font-medium text-school-dark">
                      admissions@stardreamworksschools.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-school-blue/5 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-school-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Visit Us</p>
                    <p className="font-medium text-school-dark">
                      Ajah, Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-school-gold to-secondary text-white font-semibold rounded-xl shadow-glow-gold hover:shadow-lg transition-all duration-300 w-fit"
              >
                Contact Admissions
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
