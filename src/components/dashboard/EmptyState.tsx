interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {icon && (
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 font-[family-name:var(--font-poppins)]">
        {title}
      </h3>
      {description && <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-school-blue to-primary text-white text-sm font-semibold rounded-xl shadow-glow-blue hover:shadow-lg transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
