"use client";

interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export default function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-brand-line bg-white rounded-t-xl px-2 pt-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap ${
            active === tab.key
              ? "text-brand-navy border-brand-navy bg-brand-paper"
              : "text-brand-muted border-transparent hover:text-brand-ink hover:bg-gray-50"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}