import { useState, useCallback, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CategoryAccordion, ComponentItem } from "./CategoryAccordion";
import { ComponentSearch } from "./ComponentSearch";
import {
  X,
  Sparkles,
  User,
  Camera,
  MapPin,
  Palette,
  Settings,
  Search,
  RotateCcw,
  Check,
  Package,
  Heart,
  Brain,
  Zap,
} from "lucide-react";

// Import prompt data arrays - we'll use the actual data from the prompt generator
import * as promptData from "@/lib/prompt-generator/promptData";

interface ComponentSelectorProps {
  selectedComponents: Record<string, Set<string>>;
  onComponentsChange: (categoryId: string, components: Set<string>) => void;
  onBulkChange?: (changes: Record<string, Set<string>>) => void;
  gender?: "female" | "male" | "neutral";
  className?: string;
  maxSelections?: Record<string, number>;
  requiredCategories?: string[];
  onClose?: () => void;
}

// Category definitions with all 30+ categories
const CATEGORY_GROUPS = {
  artStyle: {
    name: "Art & Style",
    icon: <Palette className="h-4 w-4" />,
    categories: [
      { id: "artform", name: "Art Form", data: "ARTFORM" },
      { id: "photo_type", name: "Photo Type", data: "PHOTO_TYPE" },
      { id: "digital_artform", name: "Digital Art Form", data: "DIGITAL_ARTFORM" },
      { id: "photography_styles", name: "Photography Styles", data: "PHOTOGRAPHY_STYLES" },
    ],
  },
  character: {
    name: "Character",
    icon: <User className="h-4 w-4" />,
    categories: [
      { id: "character_type", name: "Character Type", data: "CHARACTER_TYPE" },
      { id: "body_types", name: "Body Types", data: "BODY_TYPES", genderSpecific: true },
      { id: "default_tags", name: "Default Tags", data: "DEFAULT_TAGS", genderSpecific: true },
      { id: "roles", name: "Roles", data: "ROLES" },
      { id: "hairstyles", name: "Hairstyles", data: "HAIRSTYLES" },
      { id: "hair_color", name: "Hair Color", data: "HAIR_COLORS" },
      { id: "eye_color", name: "Eye Color", data: "EYE_COLORS" },
      { id: "makeup", name: "Makeup", data: "MAKEUP_OPTIONS" },
      { id: "skin_tone", name: "Skin Tone", data: "SKIN_TONES" },
      { id: "expression", name: "Expression", data: "EXPRESSIONS" },
    ],
  },
  clothing: {
    name: "Clothing & Accessories",
    icon: <Package className="h-4 w-4" />,
    categories: [
      { id: "clothing", name: "Clothing", data: "CLOTHING", genderSpecific: true },
      { id: "accessories", name: "Accessories", data: "ACCESSORIES" },
      { id: "jewelry", name: "Jewelry", data: "JEWELRY" },
      { id: "additional_details", name: "Additional Details", data: "ADDITIONAL_DETAILS", genderSpecific: true },
    ],
  },
  scene: {
    name: "Scene & Environment",
    icon: <MapPin className="h-4 w-4" />,
    categories: [
      { id: "place", name: "Place", data: "PLACE" },
      { id: "background", name: "Background", data: "BACKGROUND" },
      { id: "lighting", name: "Lighting", data: "LIGHTING" },
      { id: "composition", name: "Composition", data: "COMPOSITION" },
      { id: "pose", name: "Pose", data: "POSE" },
      { id: "mood", name: "Mood", data: "MOOD" },
      { id: "atmosphere", name: "Atmosphere", data: "ATMOSPHERE" },
    ],
  },
  creators: {
    name: "Creators & Devices",
    icon: <Camera className="h-4 w-4" />,
    categories: [
      { id: "device", name: "Camera/Device", data: "DEVICE" },
      { id: "photographer", name: "Photographer", data: "PHOTOGRAPHER" },
      { id: "artist", name: "Artist", data: "ARTIST" },
    ],
  },
  detailed: {
    name: "Detailed Options",
    icon: <Settings className="h-4 w-4" />,
    categories: [
      { id: "architecture", name: "Architecture", data: "ARCHITECTURE_OPTIONS" },
      { id: "art", name: "Art Options", data: "ART_OPTIONS" },
      { id: "brands", name: "Brands", data: "BRANDS_OPTIONS" },
      { id: "cinematic", name: "Cinematic", data: "CINEMATIC_OPTIONS" },
      { id: "fashion", name: "Fashion", data: "FASHION_OPTIONS" },
      { id: "feelings", name: "Feelings", data: "FEELINGS_OPTIONS" },
      { id: "foods", name: "Foods", data: "FOODS_OPTIONS" },
      { id: "geography", name: "Geography", data: "GEOGRAPHY_OPTIONS" },
      { id: "human", name: "Human", data: "HUMAN_OPTIONS" },
      { id: "interaction", name: "Interaction", data: "INTERACTION_OPTIONS" },
      { id: "keywords", name: "Keywords", data: "KEYWORDS_OPTIONS" },
      { id: "objects", name: "Objects", data: "OBJECTS_OPTIONS" },
      { id: "people", name: "People", data: "PEOPLE_OPTIONS" },
      { id: "plots", name: "Plots", data: "PLOTS_OPTIONS" },
      { id: "scene", name: "Scene Options", data: "SCENE_OPTIONS" },
      { id: "science", name: "Science", data: "SCIENCE_OPTIONS" },
      { id: "stuff", name: "Stuff", data: "STUFF_OPTIONS" },
      { id: "time", name: "Time", data: "TIME_OPTIONS" },
      { id: "typography", name: "Typography", data: "TYPOGRAPHY_OPTIONS" },
      { id: "vehicle", name: "Vehicle", data: "VEHICLE_OPTIONS" },
      { id: "videogame", name: "Video Game", data: "VIDEOGAME_OPTIONS" },
    ],
  },
};

export function ComponentSelector({
  selectedComponents,
  onComponentsChange,
  onBulkChange,
  gender = "neutral",
  className,
  maxSelections = {},
  requiredCategories = [],
  onClose,
}: ComponentSelectorProps) {
  const [activeTab, setActiveTab] = useState("artStyle");
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSelections, setLocalSelections] = useState(selectedComponents);

  // Get data for a category, handling gender-specific data
  const getCategoryData = useCallback((category: any): ComponentItem[] => {
    let dataKey = category.data;
    
    if (category.genderSpecific) {
      const genderPrefix = gender === "female" ? "FEMALE_" : 
                          gender === "male" ? "MALE_" : 
                          "NEUTRAL_";
      dataKey = genderPrefix + category.data;
    }

    const data = (promptData as any)[dataKey] || [];
    
    // Convert to ComponentItem format
    return data.map((item: string | any, index: number) => {
      if (typeof item === "string") {
        return {
          id: `${category.id}_${index}`,
          value: item,
          description: undefined,
          usageCount: Math.floor(Math.random() * 100), // Mock usage count
        };
      }
      // Handle object format (for future complex data)
      return {
        id: item.id || `${category.id}_${index}`,
        value: item.value || item.name || item,
        description: item.description,
        usageCount: item.usageCount || 0,
        tags: item.tags,
        subcategory: item.subcategory,
      };
    });
  }, [gender]);

  // Prepare all categories with their data
  const allCategories = useMemo(() => {
    const categories: Array<{ id: string; name: string; components: ComponentItem[] }> = [];
    
    Object.values(CATEGORY_GROUPS).forEach((group) => {
      group.categories.forEach((category) => {
        categories.push({
          id: category.id,
          name: category.name,
          components: getCategoryData(category),
        });
      });
    });
    
    return categories;
  }, [getCategoryData]);

  // Handle component toggle
  const handleToggleComponent = useCallback((categoryId: string, componentId: string) => {
    setLocalSelections((prev) => {
      const categorySelections = new Set(prev[categoryId] || []);
      
      if (categorySelections.has(componentId)) {
        categorySelections.delete(componentId);
      } else {
        // Check max selections
        const maxForCategory = maxSelections[categoryId];
        if (maxForCategory && categorySelections.size >= maxForCategory) {
          return prev; // Don't add if at max
        }
        categorySelections.add(componentId);
      }
      
      const updated = { ...prev, [categoryId]: categorySelections };
      onComponentsChange(categoryId, categorySelections);
      return updated;
    });
  }, [maxSelections, onComponentsChange]);

  // Count total selections
  const totalSelections = useMemo(() => {
    return Object.values(localSelections).reduce((sum, set) => sum + set.size, 0);
  }, [localSelections]);

  // Clear all selections
  const handleClearAll = () => {
    setLocalSelections({});
    if (onBulkChange) {
      onBulkChange({});
    } else {
      Object.keys(localSelections).forEach((categoryId) => {
        onComponentsChange(categoryId, new Set());
      });
    }
  };

  // Get selected items for display
  const getSelectedItems = () => {
    const items: Array<{ categoryId: string; categoryName: string; componentValue: string }> = [];
    
    Object.entries(localSelections).forEach(([categoryId, componentIds]) => {
      const category = allCategories.find((c) => c.id === categoryId);
      if (category) {
        componentIds.forEach((componentId) => {
          const component = category.components.find((c) => c.id === componentId);
          if (component) {
            items.push({
              categoryId,
              categoryName: category.name,
              componentValue: component.value,
            });
          }
        });
      }
    });
    
    return items;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Component Selector</h2>
            <p className="text-sm text-muted-foreground">
              Select components to build your prompt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {totalSelections} selected
          </Badge>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <ComponentSearch
          categories={allCategories}
          selectedComponents={new Set(Object.values(localSelections).flatMap((s) => Array.from(s)))}
          onToggleComponent={(componentId) => {
            // Find which category this component belongs to
            const category = allCategories.find((cat) =>
              cat.components.some((comp) => comp.id === componentId)
            );
            if (category) {
              handleToggleComponent(category.id, componentId);
            }
          }}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={totalSelections === 0}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-6 w-full p-1 h-auto">
            {Object.entries(CATEGORY_GROUPS).map(([key, group]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-1.5 text-xs py-2"
                data-testid={`tab-${key}`}
              >
                {group.icon}
                <span className="hidden sm:inline">{group.name}</span>
                <span className="sm:hidden">{group.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-3">
            {Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => (
              <TabsContent key={groupKey} value={groupKey} className="mt-0 space-y-2 px-3 pb-3">
                {group.categories.map((category) => {
                  const categoryData = getCategoryData(category);
                  const categorySelections = localSelections[category.id] || new Set();
                  
                  return (
                    <CategoryAccordion
                      key={category.id}
                      categoryId={category.id}
                      categoryName={category.name}
                      categoryDescription={
                        category.genderSpecific
                          ? `${gender.charAt(0).toUpperCase() + gender.slice(1)} specific options`
                          : undefined
                      }
                      components={categoryData}
                      selectedComponents={categorySelections}
                      onToggleComponent={(componentId) =>
                        handleToggleComponent(category.id, componentId)
                      }
                      showSearch={categoryData.length > 10}
                      maxHeight={350}
                    />
                  );
                })}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </div>

      {/* Selected Components Summary */}
      {totalSelections > 0 && (
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Selected Components</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Copy selected components to clipboard
                const selected = getSelectedItems();
                const text = selected.map((item) => item.componentValue).join(", ");
                navigator.clipboard.writeText(text);
              }}
            >
              Copy
            </Button>
          </div>
          <ScrollArea className="h-20">
            <div className="flex flex-wrap gap-1">
              {getSelectedItems().slice(0, 20).map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                  title={`${item.categoryName}: ${item.componentValue}`}
                >
                  {item.componentValue}
                </Badge>
              ))}
              {getSelectedItems().length > 20 && (
                <Badge variant="outline" className="text-xs">
                  +{getSelectedItems().length - 20} more
                </Badge>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Export a standalone modal version
export function ComponentSelectorModal({
  open,
  onOpenChange,
  ...props
}: ComponentSelectorProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "block" : "hidden"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 md:inset-y-8 md:inset-x-[10%] lg:inset-x-[15%] bg-background rounded-lg shadow-lg overflow-hidden z-50">
        <ComponentSelector
          {...props}
          onClose={() => onOpenChange(false)}
        />
      </div>
    </div>
  );
}