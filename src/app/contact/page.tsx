"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import { useSiteContent } from "@/lib/use-site-content";

export default function ContactPage() {
  const { settings } = useSiteContent();
  const location = settings["school.location"] || "Ajah, Lagos, Nigeria";
  const phone = settings["school.phone"];
  const email = settings["school.email"];

  const details = [
    {
      icon: MapPin,
      title: "Location",
      value: location,
      href: null as string | null,
    },
    {
      icon: Phone,
      title: "Phone",
      value: phone,
      href: phone ? `tel:${phone}` : null,
    },
    {
      icon: Mail,
      title: "Email",
      value: email,
      href: email ? `mailto:${email}` : null,
    },
  ].filter((d) => d.value);

  const missing = !phone || !email;

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Contact us"
        title="We'd love to hear from you"
        description="Questions about our programmes, admissions or a visit? Reach out and we'll be glad to help."
      />

      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {details.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {details.map((d) => (
                <div key={d.title} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-soft-sm">
                  <div className="w-11 h-11 bg-school-blue/5 rounded-xl flex items-center justify-center mb-4">
                    <d.icon className="w-5 h-5 text-school-blue" />
                  </div>
                  <p className="font-semibold text-school-dark mb-1">{d.title}</p>
                  {d.href ? (
                    <a href={d.href} className="text-gray-600 hover:text-school-blue transition-colors">
                      {d.value}
                    </a>
                  ) : (
                    <p className="text-gray-600">{d.value}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center mb-12">
              <p className="text-gray-600">
                Contact details will be added here by the school. In the
                meantime, please use the admissions enquiry form.
              </p>
            </div>
          )}

          {missing && (
            <div className="bg-school-dark text-white rounded-3xl p-8 lg:p-12 mb-4">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">
                Send an admission enquiry
              </h2>
              <p className="text-white/70 leading-relaxed max-w-2xl mb-8">
                Our admissions team will be in touch with the information you
                need about creche, kindergarten, nursery, primary and secondary
                school places.
              </p>
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-school-gold text-school-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Start an enquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
