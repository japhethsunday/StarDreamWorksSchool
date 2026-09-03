"use client";

import { useState } from "react";
import { ImageIcon, Grid3X3, LayoutGrid, Maximize2, X } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

const categories = [
  "All",
  "Campus",
  "Classrooms",
  "Activities",
  "Events",
  "Sports",
];

const galleryItems = [
  {
    id: 1,
    title: "School Building",
    category: "Campus",
    color: "from-school-blue to-primary",
  },
  {
    id: 2,
    title: "Classroom Learning",
    category: "Classrooms",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: 3,
    title: "Science Laboratory",
    category: "Classrooms",
    color: "from-amber-500 to-amber-600",
  },
  {
    id: 4,
    title: "Sports Day",
    category: "Sports",
    color: "from-red-400 to-red-500",
  },
  {
    id: 5,
    title: "Art Exhibition",
    category: "Activities",
    color: "from-purple-400 to-purple-500",
  },
  {
    id: 6,
    title: "School Assembly",
    category: "Events",
    color: "from-school-blue to-school-dark",
  },
  {
    id: 7,
    title: "Playground",
    category: "Campus",
    color: "from-green-400 to-green-500",
  },
  {
    id: 8,
    title: "Computer Lab",
    category: "Classrooms",
    color: "from-blue-400 to-blue-500",
  },
  {
    id: 9,
    title: "Cultural Day",
    category: "Events",
    color: "from-orange-400 to-orange-500",
  },
  {
    id: 10,
    title: "Inter-House Competition",
    category: "Sports",
    color: "from-red-500 to-red-600",
  },
  {
    id: 11,
    title: "Library",
    category: "Campus",
    color: "from-indigo-400 to-indigo-500",
  },
  {
    id: 12,
    title: "Music Performance",
    category: "Activities",
    color: "from-pink-400 to-pink-500",
  },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-school-dark via-school-blue to-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
            Gallery
          </span>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            School Gallery
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            A visual tour of life at STAR DreamWorks Schools — our campus,
            classrooms, activities, and memorable events.
          </p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-school-blue text-white shadow-glow-blue"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer hover:shadow-soft-lg transition-all duration-300"
              >
                {/* Gradient placeholder */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/30" />
                  </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-xs text-white/70 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-white mt-1">
                    {item.title}
                  </h3>
                </div>

                {/* Icon */}
                <div className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No images found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
