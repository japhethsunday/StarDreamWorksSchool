interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

export default function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-brand-navy/[0.07] text-brand-navy",
    gold: "bg-brand-yellow/20 text-[#8a6100]",
    green: "bg-brand-green/[0.08] text-brand-green",
    red: "bg-brand-red/[0.07] text-brand-red",
    purple: "bg-purple-500/10 text-purple-600",
    teal: "bg-teal-500/10 text-teal-600",
  };

  const iconTile = colorMap[color] || colorMap.blue;
  const isPositive = change && change.startsWith("+");
  const isNegative = change && change.startsWith("-");

  return (
    <div className="bg-white rounded-xl p-5 border border-brand-line hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-brand-muted font-semibold truncate">{title}</p>
          <p className="mt-1.5 text-2xl sm:text-[1.7rem] font-bold text-brand-ink font-heading tracking-tight">
            {value}
          </p>
          {change && (
            <p
              className={`mt-1.5 text-xs font-semibold ${
                isPositive ? "text-brand-green" : isNegative ? "text-brand-red" : "text-brand-muted"
              }`}
            >
              {isPositive ? "↑" : isNegative ? "↓" : "•"} {change}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg ${iconTile} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
