"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";

interface GalleryItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  category?: string | null;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/gallery")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) setItems(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])),
  ];

  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="Gallery"
        title="School life"
        description="Photos from around STAR DreamWorks Schools."
      />

      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/3] bg-gray-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-20 bg-brand-paper border border-brand-line rounded-2xl">
              <div className="w-16 h-16 bg-white border border-brand-line rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="font-heading text-xl font-bold text-brand-ink mb-2">
                No photos yet
              </h2>
              <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
                No photos have been published yet. The school will add photos of
                campus and student life here once available.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              {categories.length > 1 && (
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                        activeCategory === category
                          ? "bg-brand-red text-white"
                          : "bg-brand-paper border border-brand-line text-brand-body hover:border-brand-red/40 hover:text-brand-red"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-line hover:shadow-soft-lg transition-shadow duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.category && (
                        <span className="text-xs text-white/70 uppercase tracking-wider">
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-heading font-semibold text-white mt-1">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">No photos in this category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
