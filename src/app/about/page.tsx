"use client";

import {
  Target,
  Eye,
  Heart,
  Award,
  Users,
  BookOpen,
  Shield,
  Star,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const values = [
  {
    icon: Award,
    title: "Excellence",
    description:
      "We strive for the highest standards in everything we do, pushing every student to reach their full potential.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "We uphold honesty, transparency, and ethical behavior as the foundation of our school community.",
  },
  {
    icon: Heart,
    title: "Compassion",
    description:
      "We foster a caring environment where every child feels valued, respected, and supported.",
  },
  {
    icon: Star,
    title: "Innovation",
    description:
      "We embrace modern teaching methods and technology to prepare students for a rapidly changing world.",
  },
];

const milestones = [
  { year: "2014", event: "STAR DreamWorks Schools founded in Ajah, Lagos" },
  { year: "2016", event: "Expanded to include Primary School program" },
  { year: "2018", event: "Junior Secondary School (JSS) program launched" },
  { year: "2020", event: "New campus with state-of-the-art facilities opened" },
  { year: "2022", event: "Received award for outstanding academic performance" },
  { year: "2024", event: "Celebrating over a decade of educational excellence" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-10 right-20 w-72 h-72 bg-school-gold/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            About Us
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Our Story
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Discover the passion, purpose, and people behind STAR DreamWorks
            Schools.
          </p>
        </div>
      </section>

      {/* School History */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                Our History
              </span>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-6">
                A Decade of Shaping Futures
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                STAR DreamWorks Schools was established in Ajah, Lagos, Nigeria
                with a singular mission: to provide world-class education that
                nurtures every child&apos;s unique potential. What began as a small
                nursery school has grown into a comprehensive educational
                institution serving families across the community.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                Over the years, we have built a reputation for academic
                excellence, a nurturing environment, and a commitment to
                developing well-rounded individuals. Our graduates consistently
                perform at the highest levels in secondary schools and beyond.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, STAR DreamWorks Schools stands as a beacon of quality
                education in Ajah, combining the best of the Nigerian curriculum
                with innovative teaching approaches, modern facilities, and a
                deep commitment to character development.
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-3xl p-8 lg:p-10">
              <h3 className="font-[family-name:var(--font-poppins)] text-lg font-bold text-school-dark mb-8">
                Our Journey
              </h3>
              <div className="space-y-0">
                {milestones.map((milestone, i) => (
                  <div key={milestone.year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-school-gold rounded-full ring-4 ring-school-gold/20 shrink-0 mt-1" />
                      {i < milestones.length - 1 && (
                        <div className="w-0.5 h-full bg-school-gold/20" />
                      )}
                    </div>
                    <div className="pb-8">
                      <span className="text-xs font-bold text-school-gold uppercase">
                        {milestone.year}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {milestone.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-soft-lg border border-gray-100">
              <div className="text-center mb-10">
                <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                  Message from the Principal
                </span>
                <h2 className="font-[family-name:var(--font-poppins)] text-2xl sm:text-3xl font-bold text-school-dark">
                  Welcome to STAR DreamWorks Schools
                </h2>
              </div>

              <div className="grid sm:grid-cols-[200px_1fr] gap-8 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-40 h-48 bg-gradient-to-br from-school-blue to-school-dark rounded-2xl flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-school-gold mx-auto mb-2" />
                      <p className="text-xs text-white/70">Photo</p>
                    </div>
                  </div>
                  <p className="font-[family-name:var(--font-poppins)] font-bold text-sm text-school-dark text-center">
                    [Principal Name]
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    Principal, STAR DreamWorks Schools
                  </p>
                </div>

                <div className="text-gray-600 leading-relaxed space-y-4 text-sm">
                  <p>
                    It is my pleasure to welcome you to STAR DreamWorks Schools.
                    Our school was founded on the belief that every child
                    deserves access to quality education that develops not just
                    their minds, but their character and creativity as well.
                  </p>
                  <p>
                    At STAR DreamWorks, we have assembled a team of dedicated
                    and passionate educators who are committed to bringing out
                    the best in every student. Our curriculum is designed to
                    challenge students intellectually while fostering critical
                    thinking, problem-solving, and leadership skills.
                  </p>
                  <p>
                    Our state-of-the-art facilities provide an enriching
                    environment for learning, from well-equipped classrooms and
                    science laboratories to libraries, computer centers, and
                    recreational spaces. We believe that a conducive learning
                    environment is essential for academic success.
                  </p>
                  <p>
                    I invite you to visit our campus and experience the STAR
                    DreamWorks difference. Together, we can give your child the
                    foundation they need to succeed in an ever-changing world.
                  </p>
                  <p className="text-school-dark font-medium">
                    — The Principal, STAR DreamWorks Schools
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Our Foundation
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark">
              Mission, Vision & Values
            </h2>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-school-blue to-primary rounded-3xl p-10 text-white">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-school-gold" />
              </div>
              <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-bold mb-4">
                Our Mission
              </h3>
              <p className="text-white/80 leading-relaxed">
                To provide quality education that nurtures every child&apos;s
                potential, equipping them with the knowledge, skills, and
                values needed to excel in a rapidly changing world and become
                responsible global citizens.
              </p>
            </div>

            <div className="bg-gradient-to-br from-school-dark to-school-blue rounded-3xl p-10 text-white">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-school-gold" />
              </div>
              <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-bold mb-4">
                Our Vision
              </h3>
              <p className="text-white/80 leading-relaxed">
                To be a leading educational institution in Lagos, Nigeria,
                recognized for producing well-rounded individuals who
                demonstrate academic excellence, moral integrity, and leadership
                in their communities and beyond.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-12">
            <h3 className="font-[family-name:var(--font-poppins)] text-2xl font-bold text-school-dark">
              Our Core Values
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-school-blue to-school-dark rounded-xl flex items-center justify-center mx-auto mb-5">
                  <value.icon className="w-7 h-7 text-school-gold" />
                </div>
                <h4 className="font-[family-name:var(--font-poppins)] text-lg font-bold text-school-dark mb-3">
                  {value.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
