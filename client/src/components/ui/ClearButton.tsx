import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearButtonProps {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

export function ClearButton({ onClick, className, size = "md", title = "Clear" }: ClearButtonProps) {
  const sizeClasses = {
    sm: "h-3 w-3 p-0.5",
    md: "h-4 w-4 p-0.5",
    lg: "h-5 w-5 p-1"
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        "rounded-full hover:bg-gray-700 transition-colors",
        sizeClasses[size],
        className
      )}
      title={title}
    >
      <X className="h-full w-full" />
    </button>
  );
}