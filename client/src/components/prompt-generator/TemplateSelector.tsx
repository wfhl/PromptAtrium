import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Sparkles,
  Settings,
  Plus,
  Info,
  Eye,
  Code,
  Star,
  TrendingUp,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  format: string;
  example?: string;
  variables?: string[];
  popularity?: number;
  lastUsed?: string;
  isCustom?: boolean;
  createdBy?: string;
  tags?: string[];
}

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onTemplateChange: (templateId: string) => void;
  onCreateCustomTemplate?: (template: Partial<Template>) => void;
  className?: string;
  showPreview?: boolean;
  showCategories?: boolean;
}

// Default templates
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Balanced prompt with all essential elements",
    category: "General",
    format: "{{subject}}, {{style}}, {{lighting}}, {{mood}}, {{quality}}",
    example: "A majestic dragon, digital art style, dramatic lighting, mysterious mood, high quality",
    variables: ["subject", "style", "lighting", "mood", "quality"],
    popularity: 95,
    tags: ["versatile", "balanced", "popular"]
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Film-like composition with dramatic elements",
    category: "Photography",
    format: "Cinematic shot of {{subject}}, {{camera_angle}}, {{lighting}}, {{color_grading}}, film grain",
    example: "Cinematic shot of a lone warrior, low angle, golden hour lighting, teal and orange grading, film grain",
    variables: ["subject", "camera_angle", "lighting", "color_grading"],
    popularity: 88,
    tags: ["dramatic", "film", "professional"]
  },
  {
    id: "portrait",
    name: "Portrait",
    description: "Focused on character details and expression",
    category: "Character",
    format: "Portrait of {{character}}, {{expression}}, {{lighting}}, {{background}}, {{style}}",
    example: "Portrait of a cyberpunk hacker, determined expression, neon lighting, cityscape background, digital art",
    variables: ["character", "expression", "lighting", "background", "style"],
    popularity: 92,
    tags: ["character", "detailed", "expressive"]
  },
  {
    id: "landscape",
    name: "Landscape",
    description: "Scenic views and environmental art",
    category: "Environment",
    format: "{{time_of_day}} landscape of {{location}}, {{weather}}, {{mood}}, {{art_style}}",
    example: "Sunset landscape of alien planet, stormy weather, ominous mood, concept art style",
    variables: ["time_of_day", "location", "weather", "mood", "art_style"],
    popularity: 85,
    tags: ["scenic", "environment", "atmospheric"]
  },
  {
    id: "product",
    name: "Product Shot",
    description: "Clean product photography style",
    category: "Commercial",
    format: "Product shot of {{item}}, {{background}}, {{lighting}}, professional photography",
    example: "Product shot of luxury watch, white background, studio lighting, professional photography",
    variables: ["item", "background", "lighting"],
    popularity: 75,
    tags: ["commercial", "clean", "professional"]
  },
  {
    id: "artistic",
    name: "Artistic",
    description: "Creative and experimental compositions",
    category: "Art",
    format: "{{art_movement}} interpretation of {{subject}}, {{medium}}, {{color_palette}}, {{texture}}",
    example: "Surrealist interpretation of time, oil painting, vivid colors, thick impasto texture",
    variables: ["art_movement", "subject", "medium", "color_palette", "texture"],
    popularity: 82,
    tags: ["creative", "experimental", "artistic"]
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple, clean compositions with focus",
    category: "Style",
    format: "Minimalist {{subject}}, {{color_scheme}}, simple composition, negative space",
    example: "Minimalist mountain, monochrome, simple composition, negative space",
    variables: ["subject", "color_scheme"],
    popularity: 78,
    tags: ["simple", "clean", "modern"]
  },
  {
    id: "detailed",
    name: "Hyper-Detailed",
    description: "Maximum detail and complexity",
    category: "Quality",
    format: "Highly detailed {{subject}}, intricate {{details}}, {{lighting}}, {{resolution}}, masterpiece",
    example: "Highly detailed mechanical dragon, intricate gears and circuits, volumetric lighting, 8K resolution, masterpiece",
    variables: ["subject", "details", "lighting", "resolution"],
    popularity: 90,
    tags: ["detailed", "complex", "high-quality"]
  }
];

export function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
  onCreateCustomTemplate,
  className,
  showPreview = true,
  showCategories = true,
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [customTemplateDialog, setCustomTemplateDialog] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<Partial<Template>>({
    name: "",
    description: "",
    format: "",
    category: "Custom",
    tags: []
  });

  // Fetch templates from database (with fallback to defaults)
  const { data: templates = DEFAULT_TEMPLATES, isLoading } = useQuery({
    queryKey: ["/api/prompt-templates"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/prompt-templates");
        if (!response.ok) return DEFAULT_TEMPLATES;
        const data = await response.json();
        return [...DEFAULT_TEMPLATES, ...data];
      } catch {
        return DEFAULT_TEMPLATES;
      }
    }
  });

  // Get unique categories
  const categories = ["all", ...new Set(templates.map(t => t.category))];

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === "" || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort templates by popularity and recent use
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // First by popularity
    const popDiff = (b.popularity || 0) - (a.popularity || 0);
    if (popDiff !== 0) return popDiff;
    
    // Then by last used (if available)
    if (a.lastUsed && b.lastUsed) {
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    }
    
    return 0;
  });

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleCreateCustom = () => {
    if (onCreateCustomTemplate && customTemplate.name && customTemplate.format) {
      onCreateCustomTemplate({
        ...customTemplate,
        id: `custom-${Date.now()}`,
        isCustom: true,
      });
      setCustomTemplateDialog(false);
      setCustomTemplate({
        name: "",
        description: "",
        format: "",
        category: "Custom",
        tags: []
      });
    }
  };

  const getTemplateIcon = (category: string) => {
    switch(category) {
      case "General": return <FileText className="h-4 w-4" />;
      case "Photography": return <Settings className="h-4 w-4" />;
      case "Character": return <Sparkles className="h-4 w-4" />;
      case "Environment": return <Eye className="h-4 w-4" />;
      case "Commercial": return <TrendingUp className="h-4 w-4" />;
      case "Art": return <Star className="h-4 w-4" />;
      case "Custom": return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Template Selection</CardTitle>
        <CardDescription>
          Choose a template to structure your prompt generation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {onCreateCustomTemplate && (
            <Dialog open={customTemplateDialog} onOpenChange={setCustomTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Template</DialogTitle>
                  <DialogDescription>
                    Define your own template format with custom variables
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={customTemplate.name}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={customTemplate.description}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this template is for"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Textarea
                      value={customTemplate.format}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, format: e.target.value }))}
                      placeholder="Use {{variable}} for dynamic parts"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {`{{variable_name}}`} syntax for replaceable parts
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={customTemplate.tags?.join(", ")}
                      onChange={(e) => setCustomTemplate(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                      }))}
                      placeholder="custom, creative, special"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCustomTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCustom}>
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Category Tabs */}
        {showCategories && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 5)}, 1fr)` }}>
              {categories.slice(0, 5).map(category => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category === "all" ? "All" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Template List */}
        <ScrollArea className="h-[300px] pr-4">
          <RadioGroup value={selectedTemplate || ""} onValueChange={onTemplateChange}>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : sortedTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates found
                </div>
              ) : (
                sortedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-start space-x-3 rounded-lg border p-3 transition-colors",
                      selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={template.id} className="flex items-center gap-2 cursor-pointer">
                        {getTemplateIcon(template.category)}
                        <span className="font-medium">{template.name}</span>
                        {template.isCustom && (
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                        )}
                        {template.popularity && template.popularity >= 90 && (
                          <Badge variant="default" className="text-xs">Popular</Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {showPreview && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </RadioGroup>
        </ScrollArea>

        {/* Template Preview */}
        {showPreview && previewTemplate && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">{previewTemplate.name} Template Preview:</p>
              <code className="block p-2 bg-muted rounded text-xs">
                {previewTemplate.format}
              </code>
              {previewTemplate.example && (
                <>
                  <p className="text-xs text-muted-foreground">Example output:</p>
                  <code className="block p-2 bg-muted rounded text-xs">
                    {previewTemplate.example}
                  </code>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}