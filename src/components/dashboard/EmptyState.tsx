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
    <div className="flex flex-col items-center justify-center py-14 px-6">
      {icon && (
        <div className="w-16 h-16 bg-brand-paper border border-brand-line rounded-xl flex items-center justify-center mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-brand-ink font-heading">
        {title}
      </h3>
      {description && <p className="text-sm text-brand-muted mt-1.5 text-center max-w-sm leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="sd-btn sd-btn-apply mt-6 px-6 py-2.5 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
