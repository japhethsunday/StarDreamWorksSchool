import { Crest } from "@/components/public/Logo";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function PageHero({
  eyebrow,
  title,
  description,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden sd-hero-surface">
      {/* Crest watermark */}
      <Crest className="pointer-events-none absolute -right-8 -bottom-12 w-56 h-56 opacity-[0.07] select-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 lg:pt-20 lg:pb-16">
        <p
          className="sd-eyebrow sd-eyebrow-on-dark mb-4 sd-enter"
          style={{ "--enter-delay": "0ms" } as React.CSSProperties}
        >
          {eyebrow}
        </p>
        <h1
          className="font-heading text-4xl sm:text-5xl font-bold text-white leading-[1.08] tracking-tight mb-4 sd-enter"
          style={{ "--enter-delay": "90ms" } as React.CSSProperties}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-lg text-white/70 max-w-2xl leading-relaxed sd-enter"
            style={{ "--enter-delay": "180ms" } as React.CSSProperties}
          >
            {description}
          </p>
        )}
      </div>
      <div className="sd-gold-rule" />
    </section>
  );
}
