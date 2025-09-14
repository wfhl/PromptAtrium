import { Heart, HeartOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  itemId: number | string;
  itemType: string;
  initialIsFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onToggle?: () => void;
}

export function FavoriteButton({
  itemId,
  itemType,
  initialIsFavorited = false,
  size = "md",
  className,
  onToggle
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onToggle) onToggle();
  };

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-1 hover:bg-gray-700 rounded transition-colors",
        className
      )}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? (
        <Heart className={cn(sizeClasses[size], "text-red-500 fill-red-500")} />
      ) : (
        <HeartOff className={cn(sizeClasses[size], "text-gray-400 hover:text-red-400")} />
      )}
    </button>
  );
}