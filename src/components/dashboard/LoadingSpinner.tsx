import { Loader2 } from "lucide-react";
import { Crest } from "@/components/public/Logo";

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = "Loading...", fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Crest className="w-12 h-12" />
      <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
      <p className="text-sm text-brand-muted font-medium">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
}
