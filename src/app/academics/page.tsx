"use client";

import {
  BookOpen,
  Palette,
  Calculator,
  Globe,
  FlaskConical,
  Music,
  Dumbbell,
  Monitor,
  Languages,
  Sparkles,
  GraduationCap,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const programs = [
  {
    id: "nursery",
    icon: Sparkles,
    title: "Nursery School",
    age: "Ages 1 - 5",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    description:
      "Our nursery program provides a warm, stimulating environment where the youngest learners begin their educational journey. Through play-based learning and structured activities, children develop foundational skills in literacy, numeracy, and social interaction.",
    highlights: [
      "Phonics-based early reading program",
      "Foundational numeracy skills",
      "Creative arts and music",
      "Social and emotional development",
      "Physical motor skills development",
      "Bilingual introduction",
    ],
  },
  {
    id: "primary",
    icon: BookOpen,
    title: "Primary School",
    age: "Ages 6 - 11",
    color: "from-school-blue to-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description:
      "Our primary school program follows the Nigerian National Curriculum, enriched with additional STEM education, ICT literacy, and extracurricular activities. Students receive a well-rounded education that prepares them for secondary school and beyond.",
    highlights: [
      "Full Nigerian curriculum coverage",
      "STEM and ICT integration",
      "French and local language studies",
      "Creative and performing arts",
      "Sports and physical education",
      "Leadership and life skills",
    ],
  },
  {
    id: "jss",
    icon: Target,
    title: "Junior Secondary School",
    age: "Ages 12 - 14",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description:
      "Our JSS program prepares students for senior secondary education with subject specialization, career guidance, and comprehensive exam preparation. We focus on building analytical skills, independent thinking, and academic confidence.",
    highlights: [
      "Specialized subject instruction",
      "STEM and technical subjects",
      "Career guidance and counseling",
      "WAEC/BECE exam preparation",
      "Independent learning skills",
      "Club and society participation",
    ],
  },
];

const subjects = [
  { icon: Calculator, name: "Mathematics", category: "Core" },
  { icon: Languages, name: "English Language", category: "Core" },
  { icon: BookOpen, name: "Literature", category: "Language" },
  { icon: Globe, name: "Social Studies", category: "Humanities" },
  { icon: FlaskConical, name: "Basic Science", category: "Science" },
  { icon: Monitor, name: "Computer Studies / ICT", category: "Technology" },
  { icon: Palette, name: "Creative Arts", category: "Creative" },
  { icon: Music, name: "Music", category: "Creative" },
  { icon: Dumbbell, name: "Physical & Health Education", category: "Physical" },
  { icon: GraduationCap, name: "Civic Education", category: "Humanities" },
];

export default function AcademicsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-school-gold/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            Academics
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Academic Programs
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Comprehensive programs designed to nurture intellectual growth,
            critical thinking, and a love for learning at every stage.
          </p>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {programs.map((program, index) => (
            <div
              key={program.id}
              id={program.id}
              className={`${program.bg} border ${program.border} rounded-3xl p-8 sm:p-10 lg:p-14 scroll-mt-24`}
            >
              <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center`}
                    >
                      <program.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="font-[family-name:var(--font-poppins)] text-2xl sm:text-3xl font-bold text-school-dark">
                        {program.title}
                      </h2>
                      <span className="text-sm font-semibold text-school-gold">
                        {program.age}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-8">
                    {program.description}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-soft">
                  <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-school-dark mb-5">
                    Program Highlights
                  </h3>
                  <ul className="space-y-3.5">
                    {program.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm text-gray-600"
                      >
                        <CheckCircle className="w-5 h-5 text-school-green shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Our Curriculum
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              Subjects We Offer
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A comprehensive range of subjects designed to develop the whole
              child across academic, creative, and physical domains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="bg-white rounded-xl p-6 shadow-soft-sm border border-gray-100 hover:shadow-soft hover:border-school-gold/30 transition-all duration-300 text-center group"
              >
                <div className="w-12 h-12 bg-school-blue/5 group-hover:bg-school-blue/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <subject.icon className="w-6 h-6 text-school-blue" />
                </div>
                <h4 className="font-[family-name:var(--font-poppins)] font-semibold text-sm text-school-dark mb-1">
                  {subject.name}
                </h4>
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {subject.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
