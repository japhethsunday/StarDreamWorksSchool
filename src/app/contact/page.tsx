"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Building,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Our Location",
      details: ["Ajah, Lagos, Nigeria"],
    },
    {
      icon: Phone,
      title: "Phone Number",
      details: ["+234 (0) XXX XXX XXXX"],
    },
    {
      icon: Mail,
      title: "Email Address",
      details: ["info@stardreamworksschools.com"],
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: ["Mon - Fri: 7:00 AM - 4:00 PM", "Sat: 9:00 AM - 12:00 PM"],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-school-gold/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            Contact Us
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            We&apos;d love to hear from you. Reach out to us with any questions
            about admissions, programs, or to schedule a campus visit.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="font-[family-name:var(--font-poppins)] text-2xl sm:text-3xl font-bold text-school-dark mb-6">
                Contact Information
              </h2>
              <p className="text-gray-600 leading-relaxed mb-10">
                Our team is ready to assist you with any inquiries. Feel free to
                reach out during our office hours or send us a message.
              </p>

              <div className="space-y-6 mb-12">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-school-blue/5 rounded-xl flex items-center justify-center shrink-0">
                      <info.icon className="w-5 h-5 text-school-blue" />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-sm text-school-dark mb-1">
                        {info.title}
                      </h3>
                      {info.details.map((detail) => (
                        <p key={detail} className="text-sm text-gray-500">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Map Integration
                  </p>
                  <p className="text-xs text-gray-300">
                    Google Maps will be displayed here
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-soft-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 bg-gradient-to-br from-school-blue to-school-dark rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-school-gold" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-poppins)] text-xl font-bold text-school-dark">
                    Send Us a Message
                  </h2>
                  <p className="text-xs text-gray-500">
                    We&apos;ll respond as soon as possible
                  </p>
                </div>
              </div>

              {submitted && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Message Sent!
                    </p>
                    <p className="text-xs text-green-600">
                      Thank you for contacting us. We&apos;ll get back to you
                      shortly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-school-blue/20 focus:border-school-blue transition-all resize-none"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-school-gold to-secondary text-white font-semibold rounded-xl shadow-glow-gold hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
