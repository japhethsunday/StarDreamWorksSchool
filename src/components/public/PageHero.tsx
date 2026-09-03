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
    <section className="relative overflow-hidden bg-school-dark">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-school-dark via-school-blue to-[#0e2a4d]" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-school-gold/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 lg:pt-20 lg:pb-16">
        <span className="inline-block text-sm font-semibold text-school-gold uppercase tracking-wider mb-3">
          {eyebrow}
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
