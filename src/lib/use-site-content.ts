"use client";

import { useEffect, useState, useCallback } from "react";

export interface EducationalLevel {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  ageRange: string | null;
  tagline: string | null;
  description: string | null;
  highlights: string | null;
  isActive: boolean;
}

export interface SiteContent {
  settings: Record<string, string>;
  levels: EducationalLevel[];
  loading: boolean;
  error: string;
  refresh: () => void;
}

export function useSiteContent(): SiteContent {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/site-settings").then((r) => r.json()),
      fetch("/api/educational-levels").then((r) => r.json()),
    ])
      .then(([s, l]) => {
        if (s?.success) setSettings(s.data || {});
        if (l?.success) setLevels(l.data || []);
        setError("");
      })
      .catch(() => setError("Could not load site content."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { settings, levels, loading, error, refresh };
}
