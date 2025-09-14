import { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ComponentChip, CategoryControlChip } from "./ComponentChip";
import { 
  Search, 
  Check, 
  X, 
  ChevronRight,
  Sparkles,
  Palette,
  User,
  Camera,
  MapPin,
  Sun,
  Heart,
  Cpu,
  Building,
  Film,
  Globe,
  Package,
  Clock,
  Car,
  Gamepad2,
  Type,
  Users,
  Utensils,
  Brain,
  Zap
} from "lucide-react";

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  artform: <Palette className="h-4 w-4" />,
  photo_type: <Camera className="h-4 w-4" />,
  digital_artform: <Cpu className="h-4 w-4" />,
  character_type: <User className="h-4 w-4" />,
  body_types: <User className="h-4 w-4" />,
  roles: <Users className="h-4 w-4" />,
  hairstyles: <User className="h-4 w-4" />,
  hair_color: <Palette className="h-4 w-4" />,
  eye_color: <Palette className="h-4 w-4" />,
  makeup: <Sparkles className="h-4 w-4" />,
  skin_tone: <Palette className="h-4 w-4" />,
  clothing: <User className="h-4 w-4" />,
  expression: <Heart className="h-4 w-4" />,
  accessories: <Package className="h-4 w-4" />,
  jewelry: <Sparkles className="h-4 w-4" />,
  place: <MapPin className="h-4 w-4" />,
  lighting: <Sun className="h-4 w-4" />,
  composition: <Camera className="h-4 w-4" />,
  pose: <User className="h-4 w-4" />,
  background: <MapPin className="h-4 w-4" />,
  mood: <Heart className="h-4 w-4" />,
  atmosphere: <Sun className="h-4 w-4" />,
  photography_styles: <Camera className="h-4 w-4" />,
  device: <Camera className="h-4 w-4" />,
  photographer: <Camera className="h-4 w-4" />,
  artist: <Palette className="h-4 w-4" />,
  architecture: <Building className="h-4 w-4" />,
  art: <Palette className="h-4 w-4" />,
  brands: <Package className="h-4 w-4" />,
  cinematic: <Film className="h-4 w-4" />,
  fashion: <User className="h-4 w-4" />,
  feelings: <Heart className="h-4 w-4" />,
  foods: <Utensils className="h-4 w-4" />,
  geography: <Globe className="h-4 w-4" />,
  human: <User className="h-4 w-4" />,
  interaction: <Users className="h-4 w-4" />,
  keywords: <Type className="h-4 w-4" />,
  objects: <Package className="h-4 w-4" />,
  people: <Users className="h-4 w-4" />,
  plots: <Brain className="h-4 w-4" />,
  scene: <MapPin className="h-4 w-4" />,
  science: <Zap className="h-4 w-4" />,
  stuff: <Package className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
  typography: <Type className="h-4 w-4" />,
  vehicle: <Car className="h-4 w-4" />,
  videogame: <Gamepad2 className="h-4 w-4" />,
};

export interface ComponentItem {
  id: string;
  value: string;
  description?: string;
  usageCount?: number;
  tags?: string[];
  subcategory?: string;
}

interface CategoryAccordionProps {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  components: ComponentItem[];
  selectedComponents: Set<string>;
  onToggleComponent: (componentId: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  isLoading?: boolean;
  variant?: "default" | "compact";
  showSearch?: boolean;
  showControls?: boolean;
  maxHeight?: number;
  className?: string;
  defaultOpen?: boolean;
}

export function CategoryAccordion({
  categoryId,
  categoryName,
  categoryDescription,
  components,
  selectedComponents,
  onToggleComponent,
  onSelectAll,
  onClearAll,
  isLoading = false,
  variant = "default",
  showSearch = true,
  showControls = true,
  maxHeight = 400,
  className,
  defaultOpen = false,
}: CategoryAccordionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [displayComponents, setDisplayComponents] = useState<ComponentItem[]>([]);

  // Filter components based on search
  useEffect(() => {
    if (!searchQuery) {
      setDisplayComponents(components);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = components.filter(
      (comp) =>
        comp.value.toLowerCase().includes(query) ||
        comp.description?.toLowerCase().includes(query) ||
        comp.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
    setDisplayComponents(filtered);
  }, [components, searchQuery]);

  const selectedCount = components.filter((c) => selectedComponents.has(c.id)).length;
  const icon = categoryIcons[categoryId.toLowerCase()] || <Package className="h-4 w-4" />;

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      displayComponents.forEach((comp) => {
        if (!selectedComponents.has(comp.id)) {
          onToggleComponent(comp.id);
        }
      });
    }
  }, [displayComponents, selectedComponents, onSelectAll, onToggleComponent]);

  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    } else {
      displayComponents.forEach((comp) => {
        if (selectedComponents.has(comp.id)) {
          onToggleComponent(comp.id);
        }
      });
    }
  }, [displayComponents, selectedComponents, onClearAll, onToggleComponent]);

  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? categoryId : ""}
      onValueChange={(value) => setIsExpanded(value === categoryId)}
      className={cn("w-full", className)}
    >
      <AccordionItem value={categoryId} className="border rounded-lg px-2">
        <AccordionTrigger
          className="hover:no-underline py-3"
          data-testid={`accordion-trigger-${categoryId}`}
        >
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium text-sm">{categoryName}</span>
              {categoryDescription && variant === "default" && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  {categoryDescription}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCount} selected
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {components.length}
              </Badge>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pb-3">
            {/* Controls Bar */}
            {showControls && (
              <div className="flex items-center gap-2">
                {showSearch && (
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Search ${categoryName.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm"
                      data-testid={`search-${categoryId}`}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedCount === displayComponents.length}
                    className="h-9 text-xs"
                    data-testid={`select-all-${categoryId}`}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedCount === 0}
                    className="h-9 text-xs"
                    data-testid={`clear-all-${categoryId}`}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Components Grid */}
            <ScrollArea className="w-full" style={{ maxHeight }}>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-lg" />
                  ))}
                </div>
              ) : displayComponents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? "No components found matching your search" : "No components available"}
                </div>
              ) : (
                <div className={cn(
                  variant === "compact"
                    ? "flex flex-wrap gap-1.5 p-1"
                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-1"
                )}>
                  {displayComponents.map((component) => (
                    <ComponentChip
                      key={component.id}
                      id={component.id}
                      value={component.value}
                      description={component.description}
                      selected={selectedComponents.has(component.id)}
                      onToggle={onToggleComponent}
                      usageCount={component.usageCount}
                      variant={variant === "compact" ? "compact" : "default"}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Subcategory Groups (optional) */}
            {variant === "default" && displayComponents.some(c => c.subcategory) && (
              <div className="mt-4 space-y-2">
                {Array.from(new Set(displayComponents.map(c => c.subcategory).filter(Boolean))).map(
                  (subcategory) => (
                    <div key={subcategory} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-1">
                        {subcategory}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {displayComponents
                          .filter((c) => c.subcategory === subcategory)
                          .map((component) => (
                            <ComponentChip
                              key={component.id}
                              id={component.id}
                              value={component.value}
                              description={component.description}
                              selected={selectedComponents.has(component.id)}
                              onToggle={onToggleComponent}
                              usageCount={component.usageCount}
                              variant="compact"
                            />
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Batch accordion for multiple categories
export function CategoryAccordionGroup({
  categories,
  selectedComponents,
  onToggleComponent,
  className,
}: {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    components: ComponentItem[];
  }>;
  selectedComponents: Set<string>;
  onToggleComponent: (componentId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {categories.map((category) => (
        <CategoryAccordion
          key={category.id}
          categoryId={category.id}
          categoryName={category.name}
          categoryDescription={category.description}
          components={category.components}
          selectedComponents={selectedComponents}
          onToggleComponent={onToggleComponent}
        />
      ))}
    </div>
  );
}