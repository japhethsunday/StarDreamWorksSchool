"use client";

import Link from "next/link";
import {
  GraduationCap,
  Shield,
  Heart,
  Award,
  BookOpen,
  Users,
  School,
  ChevronRight,
  Star,
  Quote,
  ArrowRight,
  ChevronRightIcon,
  Sparkles,
  Target,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const features = [
  {
    icon: GraduationCap,
    title: "Quality Education",
    description:
      "Comprehensive curriculum designed to develop critical thinking, creativity, and academic excellence in every student.",
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description:
      "A secure and nurturing campus with CCTV surveillance, trained security, and child-friendly facilities.",
  },
  {
    icon: Heart,
    title: "Character Development",
    description:
      "Building strong moral values, discipline, and leadership skills through character-focused education.",
  },
  {
    icon: Award,
    title: "Academic Excellence",
    description:
      "Consistently outstanding results in examinations with dedicated teachers and modern learning resources.",
  },
];

const programs = [
  {
    icon: Sparkles,
    title: "Nursery School",
    age: "Ages 1 - 5",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    description:
      "A playful and stimulating early years program that builds foundational skills in literacy, numeracy, social development, and creative expression through age-appropriate activities.",
    items: ["Phonics & Early Reading", "Basic Numeracy", "Creative Play", "Social Skills"],
  },
  {
    icon: BookOpen,
    title: "Primary School",
    age: "Ages 6 - 11",
    color: "from-school-blue to-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-school-blue",
    description:
      "A robust primary education program following the Nigerian curriculum, enriched with STEM education, ICT skills, and extracurricular activities.",
    items: ["English & Mathematics", "Science & Technology", "Arts & Culture", "Physical Education"],
  },
  {
    icon: Target,
    title: "Junior Secondary",
    age: "Ages 12 - 14",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    description:
      "Comprehensive junior secondary education preparing students for senior secondary with subject specialization, career guidance, and exam preparation.",
    items: ["Core Subjects", "STEM & ICT", "Career Guidance", "Exam Preparation"],
  },
];

const stats = [
  { number: "500+", label: "Students", icon: Users },
  { number: "50+", label: "Teachers", icon: GraduationCap },
  { number: "20+", label: "Classes", icon: School },
  { number: "10+", label: "Years", icon: Award },
];

const testimonials = [
  {
    name: "Mrs. Adesanya Funke",
    role: "Parent of 3",
    text: "STAR DreamWorks Schools has been an incredible experience for my children. The teachers are dedicated, the environment is safe, and my kids have grown tremendously both academically and in character.",
  },
  {
    name: "Mr. Okonkwo David",
    role: "Parent of 2",
    text: "I was impressed from day one. The school's commitment to nurturing every child's potential is evident in everything they do. My son's confidence and academic performance have improved remarkably.",
  },
  {
    name: "Mrs. Bello Aisha",
    role: "Parent of 1",
    text: "The personalized attention each child receives at STAR DreamWorks is outstanding. My daughter looks forward to school every day, and the communication between teachers and parents is excellent.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-24 lg:pt-0">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-school-dark via-school-blue to-primary">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-school-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-school-blue/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Star className="w-4 h-4 text-school-gold fill-school-gold" />
              <span className="text-sm font-medium text-white/90">
                Caring Nursery, Primary & JSS
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Nurturing
              <span className="block text-school-gold">Tomorrow&apos;s</span>
              Leaders Today
            </h1>

            <p className="text-lg sm:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
              At STAR DreamWorks Schools, we provide a world-class education
              that develops the whole child — academically, morally, and
              socially — in a safe and stimulating environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/admissions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-school-gold to-secondary text-white font-semibold rounded-xl shadow-glow-gold hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                Apply Now
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Why Choose Us
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              Built on Excellence
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We combine academic rigor with character development to create a
              holistic educational experience that prepares children for a
              successful future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-school-blue to-school-dark rounded-xl flex items-center justify-center mb-6 group-hover:shadow-glow-gold transition-shadow duration-300">
                  <feature.icon className="w-7 h-7 text-school-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-school-dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
                About Our School
              </span>
              <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-6">
                A Legacy of Educational Excellence
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                STAR DreamWorks Schools was founded with a vision to provide
                exceptional education to children in Ajah, Lagos, and beyond.
                Our commitment to academic excellence, moral values, and
                holistic development has made us a trusted name in education.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                With state-of-the-art facilities, dedicated educators, and a
                curriculum designed to bring out the best in every child, we
                create an environment where learning is joyful and every student
                is empowered to reach their full potential.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-school-blue font-semibold hover:text-school-gold transition-colors"
              >
                Read More About Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-school-blue to-school-dark rounded-3xl p-10 lg:p-14 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-school-gold mx-auto mb-3" />
                    <p className="font-[family-name:var(--font-poppins)] font-bold text-2xl">
                      100%
                    </p>
                    <p className="text-xs text-white/70 mt-1">Commitment</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <Users className="w-8 h-8 text-school-gold mx-auto mb-3" />
                    <p className="font-[family-name:var(--font-poppins)] font-bold text-2xl">
                      500+
                    </p>
                    <p className="text-xs text-white/70 mt-1">Students</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <GraduationCap className="w-8 h-8 text-school-gold mx-auto mb-3" />
                    <p className="font-[family-name:var(--font-poppins)] font-bold text-2xl">
                      50+
                    </p>
                    <p className="text-xs text-white/70 mt-1">Teachers</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                    <Award className="w-8 h-8 text-school-gold mx-auto mb-3" />
                    <p className="font-[family-name:var(--font-poppins)] font-bold text-2xl">
                      10+
                    </p>
                    <p className="text-xs text-white/70 mt-1">Years</p>
                  </div>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-school-gold/30 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Our Programs
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              Tailored for Every Stage
            </h2>
            <p className="text-gray-600 leading-relaxed">
              From early years through junior secondary, our programs are
              designed to meet children where they are and take them further.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.title}
                className={`${program.bg} border ${program.border} rounded-2xl p-8 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center mb-6`}>
                  <program.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-[family-name:var(--font-poppins)] text-xl font-bold text-school-dark">
                    {program.title}
                  </h3>
                  <span className={`${program.text} text-xs font-semibold bg-white/60 px-2.5 py-1 rounded-full`}>
                    {program.age}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {program.description}
                </p>
                <ul className="space-y-2.5">
                  {program.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 ${program.text} shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-school-dark via-school-blue to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-5">
                  <stat.icon className="w-8 h-8 text-school-gold" />
                </div>
                <p className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </p>
                <p className="text-sm text-white/60 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
              Testimonials
            </span>
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-school-dark mb-4">
              What Parents Say
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Hear from our school community about their experiences with STAR
              DreamWorks Schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100 hover:shadow-soft-lg transition-shadow duration-300"
              >
                <Quote className="w-10 h-10 text-school-gold/30 mb-5" />
                <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-school-blue to-school-dark rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-poppins)] font-semibold text-sm text-school-dark">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-school-gold via-secondary to-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl lg:text-5xl font-bold text-school-dark mb-6">
            Join Our School Community
          </h2>
          <p className="text-lg text-school-dark/70 max-w-2xl mx-auto mb-10">
            Give your child the gift of quality education. Applications are now
            open for the upcoming academic session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admissions"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-school-dark text-white font-semibold rounded-xl shadow-soft-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Start Application
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-school-dark font-semibold rounded-xl shadow-soft hover:shadow-soft-md transition-all duration-300"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
