"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User, Newspaper, MapPin } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PageHero from "@/components/public/PageHero";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  publishedAt: string | null;
  author: { name: string } | null;
}

interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/news").then((r) => r.json()),
      fetch("/api/public/events").then((r) => r.json()),
    ])
      .then(([n, e]) => {
        if (n?.success) setArticles(n.data || []);
        if (e?.success) setEvents(e.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasContent = !loading && (articles.length > 0 || events.length > 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <PageHero
        eyebrow="News & Events"
        title="School updates"
        description="News, events and announcements from STAR DreamWorks Schools."
      />

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="md:grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!hasContent && !loading && (
            <div className="text-center py-20 bg-gray-50 border border-gray-100 rounded-3xl">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Newspaper className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="font-heading text-xl font-bold text-school-dark mb-2">
                No school updates yet
              </h2>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                No news or events have been published yet. Please check back
                soon — updates from the school will appear here.
              </p>
            </div>
          )}

          {articles.length > 0 && (
            <div className="mb-16">
              <h2 className="font-heading text-2xl font-bold text-school-dark mb-8">
                News
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((a) => (
                  <article
                    key={a.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft-sm flex flex-col"
                  >
                    {a.image ? (
                      <div className="h-44 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.image}
                          alt={a.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-school-dark flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-school-gold/40" />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-heading text-lg font-bold text-school-dark mb-3 leading-snug">
                        {a.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                        {a.excerpt || a.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                        {a.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(a.publishedAt)}
                          </span>
                        )}
                        {a.author?.name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {a.author.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-school-dark mb-8">
                Upcoming events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft-sm"
                  >
                    <div className="flex items-center gap-3 text-school-gold mb-3">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        {formatDateTime(ev.startDate)}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-school-dark mb-2">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        {ev.description}
                      </p>
                    )}
                    {ev.location && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {ev.location}
                      </p>
                    )}
                    {ev.endDate !== ev.startDate && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(ev.endDate)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
