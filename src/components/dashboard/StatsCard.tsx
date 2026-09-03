interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

export default function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    blue: "from-school-blue/10 to-primary/5 text-school-blue",
    gold: "from-school-gold/10 to-secondary/5 text-school-gold",
    green: "from-school-green/10 to-accent/5 text-school-green",
    red: "from-red-500/10 to-red-400/5 text-red-500",
    purple: "from-purple-500/10 to-purple-400/5 text-purple-500",
    teal: "from-teal-500/10 to-teal-400/5 text-teal-500",
  };

  const iconBg = colorMap[color] || colorMap.blue;
  const isPositive = change && change.startsWith("+");
  const isNegative = change && change.startsWith("-");

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-soft-sm border border-gray-100 hover:shadow-soft-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-school-dark font-[family-name:var(--font-poppins)]">
            {value}
          </p>
          {change && (
            <p
              className={`mt-2 text-xs font-medium ${
                isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-gray-500"
              }`}
            >
              {isPositive ? "↑" : isNegative ? "↓" : "•"} {change}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
