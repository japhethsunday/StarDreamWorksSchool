import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = "Loading...", fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="w-8 h-8 text-school-blue animate-spin" />
      <p className="text-sm text-gray-500 font-medium">{text}</p>
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
