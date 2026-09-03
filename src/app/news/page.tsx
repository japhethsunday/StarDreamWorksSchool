"use client";

import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  Clock,
  Tag,
  User,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const newsArticles = [
  {
    id: 1,
    title: "New Academic Session Resumption Date Announced",
    excerpt:
      "STAR DreamWorks Schools is pleased to announce the resumption date for the new academic session. All students are expected to resume on Monday, September 16th, 2024.",
    category: "School News",
    date: "August 28, 2024",
    readTime: "3 min read",
    author: "School Administration",
    featured: true,
  },
  {
    id: 2,
    title: "Science Fair 2024: Students Showcase Innovation",
    excerpt:
      "Our annual science fair was a tremendous success with over 50 projects exhibited. Students from Primary and JSS demonstrated remarkable creativity and scientific thinking.",
    category: "Events",
    date: "July 15, 2024",
    readTime: "5 min read",
    author: "Science Department",
    featured: false,
  },
  {
    id: 3,
    title: "Inter-School Sports Competition Results",
    excerpt:
      "STAR DreamWorks Schools athletes performed outstandingly at the Ajah District Inter-School Sports Competition, winning gold medals in three categories.",
    category: "Sports",
    date: "June 20, 2024",
    readTime: "4 min read",
    author: "Sports Department",
    featured: false,
  },
  {
    id: 4,
    title: "PTA Meeting: Building Stronger Partnerships",
    excerpt:
      "Our recent PTA meeting was well-attended by parents and guardians. Key topics discussed include curriculum updates, school events, and parent involvement initiatives.",
    category: "Community",
    date: "May 10, 2024",
    readTime: "3 min read",
    author: "School Administration",
    featured: false,
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-school-gold/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            News & Events
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Latest Updates
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Stay informed about the latest happenings, events, and
            achievements at STAR DreamWorks Schools.
          </p>
        </div>
      </section>

      {/* News Articles */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Article */}
          <div className="mb-12">
            {newsArticles
              .filter((a) => a.featured)
              .map((article) => (
                <div
                  key={article.id}
                  className="bg-gradient-to-br from-school-blue to-school-dark rounded-3xl p-8 sm:p-12 text-white hover:shadow-soft-xl transition-shadow duration-300"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-school-gold text-white text-xs font-semibold rounded-full">
                      Featured
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-xs font-medium rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-poppins)] text-2xl sm:text-3xl font-bold mb-4">
                    {article.title}
                  </h2>
                  <p className="text-white/70 leading-relaxed max-w-3xl mb-6">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-5 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {article.readTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {article.author}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Other Articles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsArticles
              .filter((a) => !a.featured)
              .map((article) => (
                <article
                  key={article.id}
                  className="group bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image placeholder */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Article Image</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 bg-school-blue/5 text-school-blue text-xs font-semibold rounded-full">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="font-[family-name:var(--font-poppins)] text-lg font-bold text-school-dark mb-3 group-hover:text-school-blue transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {article.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
