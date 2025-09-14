import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface ComponentChipProps {
  id: string;
  value: string;
  description?: string;
  selected: boolean;
  onToggle: (id: string) => void;
  usageCount?: number;
  variant?: "default" | "compact" | "detailed";
  showCheckbox?: boolean;
  className?: string;
}

export function ComponentChip({
  id,
  value,
  description,
  selected,
  onToggle,
  usageCount,
  variant = "default",
  showCheckbox = false,
  className,
}: ComponentChipProps) {
  const handleClick = () => {
    onToggle(id);
  };

  // Compact variant - just a simple chip
  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-all",
          "border hover:scale-105 active:scale-95",
          selected
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border hover:border-primary/50",
          className
        )}
        data-testid={`chip-${id}`}
      >
        <span>{value}</span>
        {usageCount !== undefined && (
          <span className="text-[10px] opacity-60">({usageCount})</span>
        )}
      </button>
    );
  }

  // Detailed variant - includes checkbox and more info
  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
          "hover:bg-accent/50",
          selected ? "border-primary bg-primary/10" : "border-border",
          className
        )}
        onClick={handleClick}
        data-testid={`chip-detailed-${id}`}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(id)}
          onClick={(e) => e.stopPropagation()}
          data-testid={`checkbox-${id}`}
        />
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{value}</div>
          {description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </div>
          )}
        </div>
        {usageCount !== undefined && (
          <Badge variant="outline" className="text-xs">
            {usageCount}
          </Badge>
        )}
      </div>
    );
  }

  // Default variant with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all",
              "border hover:scale-105 active:scale-95",
              selected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background border-border hover:border-primary/50 hover:bg-accent",
              className
            )}
            data-testid={`chip-default-${id}`}
          >
            {showCheckbox && (
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggle(id)}
                onClick={(e) => e.stopPropagation()}
                className="h-3 w-3"
                data-testid={`checkbox-inline-${id}`}
              />
            )}
            {selected && !showCheckbox && (
              <Check className="h-3 w-3" />
            )}
            <span>{value}</span>
            {usageCount !== undefined && usageCount > 0 && (
              <Badge variant={selected ? "secondary" : "outline"} className="ml-1 px-1 h-4 text-[10px]">
                {usageCount}
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        {description && (
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{description}</p>
            {usageCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Used {usageCount} times
              </p>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Bulk selection chip for category controls
export function CategoryControlChip({
  label,
  count,
  selected,
  onSelectAll,
  onClearAll,
  className,
}: {
  label: string;
  count: number;
  selected: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  className?: string;
}) {
  const allSelected = selected === count && count > 0;
  const someSelected = selected > 0 && selected < count;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg",
        "bg-muted/50 border border-border",
        className
      )}
      data-testid={`category-control-${label}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {selected}/{count}
        </Badge>
        {(allSelected || someSelected) && (
          <button
            onClick={onClearAll}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Clear selection"
            data-testid={`clear-${label}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {!allSelected && count > 0 && (
          <button
            onClick={onSelectAll}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Select all"
            data-testid={`select-all-${label}`}
          >
            <Check className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}