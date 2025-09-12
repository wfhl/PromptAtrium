import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, Filter, BookOpen, Plus, ChevronDown, ChevronRight, 
  Grid, List, Star, Copy, Edit, Trash2, MoreHorizontal,
  Sparkles, Tag, Hash, TrendingUp, Clock, Users, Shield,
  Palette, MapPin, Camera, Shirt, Globe, Heart, Lock,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  CheckSquare, XSquare, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToolsContext } from "@/contexts/ToolsContext";
import { useLocation } from "wouter";

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  "aesthetics": Palette,
  "locations": MapPin,
  "scenarios": Camera,
  "outfits": Shirt,
  "environments": Globe,
  "all": BookOpen,
};

// Mock data structure for keywords (will be replaced with API data)
const mockKeywords = [
  {
    id: "1",
    term: "Cyberpunk",
    category: "aesthetics",
    subcategory: "Futuristic",
    description: "A genre of science fiction set in a lawless subculture of an oppressive society dominated by computer technology",
    synonyms: ["Neon noir", "Tech noir", "Dystopian future", "High tech low life"],
    examples: ["cyberpunk city street", "neon-lit cyberpunk alley", "cyberpunk character design"],
    tags: ["futuristic", "neon", "technology", "dystopian"],
    usageCount: 15432,
    isSystem: true,
    isFavorite: false,
  },
  {
    id: "2",
    term: "Golden Hour",
    category: "environments",
    subcategory: "Lighting",
    description: "The period of daytime shortly after sunrise or before sunset, during which daylight is redder and softer",
    synonyms: ["Magic hour", "Sunset lighting", "Warm light", "Soft lighting"],
    examples: ["portrait during golden hour", "landscape at golden hour", "golden hour photography"],
    tags: ["lighting", "warm", "photography", "natural"],
    usageCount: 28765,
    isSystem: true,
    isFavorite: true,
  },
  {
    id: "3",
    term: "Victorian Era",
    category: "outfits",
    subcategory: "Historical",
    description: "The period of Queen Victoria's reign from 1837 to 1901, characterized by distinct fashion and architecture",
    synonyms: ["Victorian period", "19th century British", "Victorian style"],
    examples: ["Victorian era dress", "Victorian gentleman outfit", "Victorian street scene"],
    tags: ["historical", "fashion", "architecture", "British"],
    usageCount: 9823,
    isSystem: true,
    isFavorite: false,
  },
  {
    id: "4",
    term: "Abandoned Building",
    category: "locations",
    subcategory: "Urban",
    description: "Derelict or forsaken structures showing signs of decay and neglect",
    synonyms: ["Derelict building", "Ruins", "Urban decay", "Abandoned structure"],
    examples: ["abandoned factory interior", "overgrown abandoned mansion", "post-apocalyptic building"],
    tags: ["urban", "decay", "atmospheric", "exploration"],
    usageCount: 12456,
    isSystem: true,
    isFavorite: false,
  },
  {
    id: "5",
    term: "Film Noir",
    category: "scenarios",
    subcategory: "Cinematic",
    description: "A cinematic style characterized by dark, moody visuals and morally ambiguous stories",
    synonyms: ["Neo-noir", "Dark cinema", "Crime noir"],
    examples: ["film noir detective scene", "noir style portrait", "rainy noir street"],
    tags: ["cinematic", "dark", "moody", "crime"],
    usageCount: 7654,
    isSystem: true,
    isFavorite: false,
  },
];

// Categories structure
const categories = [
  {
    id: "aesthetics",
    name: "Aesthetics",
    icon: Palette,
    subcategories: ["Futuristic", "Vintage", "Modern", "Fantasy", "Minimalist"],
    count: 156,
  },
  {
    id: "locations",
    name: "Locations",
    icon: MapPin,
    subcategories: ["Urban", "Natural", "Indoor", "Outdoor", "Fantasy"],
    count: 243,
  },
  {
    id: "scenarios",
    name: "Scenarios",
    icon: Camera,
    subcategories: ["Cinematic", "Action", "Portrait", "Documentary", "Abstract"],
    count: 189,
  },
  {
    id: "outfits",
    name: "Outfits",
    icon: Shirt,
    subcategories: ["Historical", "Modern", "Fantasy", "Professional", "Casual"],
    count: 324,
  },
  {
    id: "environments",
    name: "Environments",
    icon: Globe,
    subcategories: ["Lighting", "Weather", "Time of Day", "Seasons", "Atmosphere"],
    count: 276,
  },
];

// Form schemas
const customKeywordSchema = z.object({
  term: z.string().min(1, "Term is required").max(50, "Term must be 50 characters or less"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  synonyms: z.string().optional(),
  examples: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const customSynonymSchema = z.object({
  synonym: z.string().min(1, "Synonym is required").max(50, "Synonym must be 50 characters or less"),
  description: z.string().optional(),
});

type CustomKeywordFormData = z.infer<typeof customKeywordSchema>;
type CustomSynonymFormData = z.infer<typeof customSynonymSchema>;

export default function KeywordDictionaryPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { 
    selectedKeywords, 
    addKeyword, 
    removeKeyword, 
    clearKeywords,
    isSelectionMode,
    setSelectionMode 
  } = useToolsContext();
  
  // State management
  const [activeTab, setActiveTab] = useState("system");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"popular" | "alphabetical" | "recent">("popular");
  const [customKeywordModalOpen, setCustomKeywordModalOpen] = useState(false);
  const [customSynonymModalOpen, setCustomSynonymModalOpen] = useState(false);
  const [selectedKeywordForSynonym, setSelectedKeywordForSynonym] = useState<any>(null);
  const [editingKeyword, setEditingKeyword] = useState<any>(null);

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearKeywords();
    }
  };

  // Send selected keywords to generator
  const sendToGenerator = () => {
    if (selectedKeywords.length > 0) {
      toast({
        title: "Keywords sent to generator",
        description: `${selectedKeywords.length} keyword(s) sent to the Prompt Generator`,
      });
      setLocation("/tools/prompt-generator");
    }
  };

  // Forms
  const customKeywordForm = useForm<CustomKeywordFormData>({
    resolver: zodResolver(customKeywordSchema),
    defaultValues: {
      term: "",
      category: "",
      subcategory: "",
      description: "",
      synonyms: "",
      examples: "",
      tags: "",
      isPublic: false,
    },
  });

  const customSynonymForm = useForm<CustomSynonymFormData>({
    resolver: zodResolver(customSynonymSchema),
    defaultValues: {
      synonym: "",
      description: "",
    },
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mock queries (replace with real API calls)
  const { data: keywords = mockKeywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ["/api/keywords", { 
      search: debouncedSearchQuery, 
      category: selectedCategory,
      subcategory: selectedSubcategory,
      tab: activeTab,
      sortBy 
    }],
    queryFn: async () => {
      // Mock API call - replace with actual API
      return new Promise<typeof mockKeywords>((resolve) => {
        setTimeout(() => {
          let filtered = [...mockKeywords];
          
          // Filter by search
          if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(k => 
              k.term.toLowerCase().includes(query) ||
              k.description.toLowerCase().includes(query) ||
              k.synonyms.some(s => s.toLowerCase().includes(query)) ||
              k.tags.some(t => t.toLowerCase().includes(query))
            );
          }
          
          // Filter by category
          if (selectedCategory) {
            filtered = filtered.filter(k => k.category === selectedCategory);
          }
          
          // Filter by subcategory
          if (selectedSubcategory) {
            filtered = filtered.filter(k => k.subcategory === selectedSubcategory);
          }
          
          // Sort
          if (sortBy === "alphabetical") {
            filtered.sort((a, b) => a.term.localeCompare(b.term));
          } else if (sortBy === "popular") {
            filtered.sort((a, b) => b.usageCount - a.usageCount);
          }
          
          resolve(filtered);
        }, 100);
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Toggle keyword expansion
  const toggleKeyword = (keywordId: string) => {
    setExpandedKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keywordId)) {
        newSet.delete(keywordId);
      } else {
        newSet.add(keywordId);
      }
      return newSet;
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Add to generator (placeholder function)
  const addToGenerator = (keyword: any) => {
    // This would integrate with the Prompt Generator
    toast({
      title: "Added to Generator",
      description: `"${keyword.term}" has been added to the Prompt Generator`,
    });
  };

  // Toggle favorite
  const toggleFavorite = (keywordId: string) => {
    // This would call an API to toggle favorite status
    toast({
      title: "Updated",
      description: "Favorite status updated",
    });
  };

  // Submit custom keyword
  const onSubmitCustomKeyword = async (data: CustomKeywordFormData) => {
    try {
      // API call to create custom keyword
      toast({
        title: "Success",
        description: "Custom keyword created successfully",
      });
      customKeywordForm.reset();
      setCustomKeywordModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom keyword",
        variant: "destructive",
      });
    }
  };

  // Submit custom synonym
  const onSubmitCustomSynonym = async (data: CustomSynonymFormData) => {
    try {
      // API call to add custom synonym
      toast({
        title: "Success",
        description: `Synonym "${data.synonym}" added successfully`,
      });
      customSynonymForm.reset();
      setCustomSynonymModalOpen(false);
      setSelectedKeywordForSynonym(null);
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add custom synonym",
        variant: "destructive",
      });
    }
  };

  // Render keyword card
  const renderKeywordCard = (keyword: any) => {
    const isExpanded = expandedKeywords.has(keyword.id);
    
    return (
      <Card key={keyword.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {keyword.term}
                {keyword.isFavorite && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
                {keyword.isSystem && (
                  <Shield className="h-4 w-4 text-muted-foreground" title="System Keyword" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {keyword.category}
                </Badge>
                {keyword.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {keyword.subcategory}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {keyword.usageCount.toLocaleString()} uses
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${keyword.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addToGenerator(keyword)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Generator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(keyword.term, "Keyword")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Keyword
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFavorite(keyword.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {keyword.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedKeywordForSynonym(keyword);
                    setCustomSynonymModalOpen(true);
                  }}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Add Custom Synonym
                </DropdownMenuItem>
                {!keyword.isSystem && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      setEditingKeyword(keyword);
                      customKeywordForm.reset({
                        term: keyword.term,
                        category: keyword.category,
                        subcategory: keyword.subcategory,
                        description: keyword.description,
                        synonyms: keyword.synonyms.join(", "),
                        examples: keyword.examples.join(", "),
                        tags: keyword.tags.join(", "),
                        isPublic: keyword.isPublic || false,
                      });
                      setCustomKeywordModalOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Keyword
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Keyword
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {keyword.description}
          </p>
          
          <Collapsible open={isExpanded} onOpenChange={() => toggleKeyword(keyword.id)}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start p-0 h-auto font-normal"
                data-testid={`button-expand-${keyword.id}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                {isExpanded ? "Show less" : "Show more"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {/* Synonyms */}
              {keyword.synonyms.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Synonyms:</p>
                  <div className="flex flex-wrap gap-1">
                    {keyword.synonyms.map((synonym: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => copyToClipboard(synonym, "Synonym")}
                      >
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Examples */}
              {keyword.examples.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Examples:</p>
                  <ul className="space-y-1">
                    {keyword.examples.map((example: string, idx: number) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Tags */}
              {keyword.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {keyword.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Hash className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => addToGenerator(keyword)}
                  data-testid={`button-add-generator-${keyword.id}`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Generator
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(keyword.term, "Keyword")}
                  data-testid={`button-copy-${keyword.id}`}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  };

  // Render keyword list item
  const renderKeywordListItem = (keyword: any) => {
    const isExpanded = expandedKeywords.has(keyword.id);
    
    return (
      <Card key={keyword.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{keyword.term}</h3>
                {keyword.isFavorite && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
                {keyword.isSystem && (
                  <Shield className="h-4 w-4 text-muted-foreground" title="System Keyword" />
                )}
                <Badge variant="secondary" className="text-xs">
                  {keyword.category}
                </Badge>
                {keyword.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {keyword.subcategory}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {keyword.usageCount.toLocaleString()} uses
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {keyword.description}
              </p>
              
              {isExpanded && (
                <div className="space-y-3 pt-2">
                  {/* Synonyms */}
                  {keyword.synonyms.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium min-w-[80px]">Synonyms:</span>
                      <div className="flex flex-wrap gap-1">
                        {keyword.synonyms.map((synonym: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => copyToClipboard(synonym, "Synonym")}
                          >
                            {synonym}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Examples */}
                  {keyword.examples.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium min-w-[80px]">Examples:</span>
                      <div className="space-y-1">
                        {keyword.examples.map((example: string, idx: number) => (
                          <p key={idx} className="text-xs text-muted-foreground">
                            • {example}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {keyword.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium min-w-[80px]">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {keyword.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Hash className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => addToGenerator(keyword)}
                  data-testid={`button-add-generator-${keyword.id}`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Generator
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(keyword.term, "Keyword")}
                  data-testid={`button-copy-${keyword.id}`}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleKeyword(keyword.id)}
                  data-testid={`button-expand-${keyword.id}`}
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" data-testid={`button-menu-${keyword.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleFavorite(keyword.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {keyword.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedKeywordForSynonym(keyword);
                    setCustomSynonymModalOpen(true);
                  }}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Add Custom Synonym
                </DropdownMenuItem>
                {!keyword.isSystem && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      setEditingKeyword(keyword);
                      customKeywordForm.reset({
                        term: keyword.term,
                        category: keyword.category,
                        subcategory: keyword.subcategory,
                        description: keyword.description,
                        synonyms: keyword.synonyms.join(", "),
                        examples: keyword.examples.join(", "),
                        tags: keyword.tags.join(", "),
                        isPublic: keyword.isPublic || false,
                      });
                      setCustomKeywordModalOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Keyword
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Keyword
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Keyword Dictionary
                </CardTitle>
                <CardDescription>
                  Browse and search comprehensive keyword library for prompt generation
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isSelectionMode ? "secondary" : "outline"}
                  onClick={toggleSelectionMode}
                  data-testid="button-selection-mode"
                >
                  {isSelectionMode ? (
                    <>
                      <XSquare className="h-4 w-4 mr-2" />
                      Cancel Selection
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select Keywords
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    setEditingKeyword(null);
                    customKeywordForm.reset();
                    setCustomKeywordModalOpen(true);
                  }}
                  data-testid="button-create-keyword"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Keyword
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="system" data-testid="tab-system">
                    <Shield className="h-4 w-4 mr-2" />
                    System Keywords
                  </TabsTrigger>
                  <TabsTrigger value="my" data-testid="tab-my">
                    <Lock className="h-4 w-4 mr-2" />
                    My Keywords
                  </TabsTrigger>
                  <TabsTrigger value="community" data-testid="tab-community">
                    <Users className="h-4 w-4 mr-2" />
                    Community Keywords
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[140px]" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 rounded-none rounded-l-md"
                      data-testid="button-view-grid"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 rounded-none rounded-r-md"
                      data-testid="button-view-list"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                {/* Sidebar with categories */}
                <div className="w-64 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  
                  {/* Categories */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 pt-0 space-y-1">
                          {/* All Categories */}
                          <Button
                            variant={selectedCategory === null ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedCategory(null);
                              setSelectedSubcategory(null);
                            }}
                            data-testid="button-category-all"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            All Categories
                            <Badge variant="secondary" className="ml-auto">
                              {categories.reduce((sum, cat) => sum + cat.count, 0)}
                            </Badge>
                          </Button>
                          
                          <Separator className="my-2" />
                          
                          {/* Individual Categories */}
                          {categories.map((category) => {
                            const Icon = category.icon;
                            const isExpanded = expandedCategories.has(category.id);
                            const isSelected = selectedCategory === category.id;
                            
                            return (
                              <div key={category.id}>
                                <Button
                                  variant={isSelected ? "secondary" : "ghost"}
                                  className="w-full justify-start"
                                  onClick={() => {
                                    setSelectedCategory(category.id);
                                    setSelectedSubcategory(null);
                                    toggleCategory(category.id);
                                  }}
                                  data-testid={`button-category-${category.id}`}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                  )}
                                  <Icon className="h-4 w-4 mr-2" />
                                  {category.name}
                                  <Badge variant="secondary" className="ml-auto">
                                    {category.count}
                                  </Badge>
                                </Button>
                                
                                {isExpanded && (
                                  <div className="ml-8 mt-1 space-y-1">
                                    {category.subcategories.map((sub) => (
                                      <Button
                                        key={sub}
                                        variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start text-xs"
                                        onClick={() => setSelectedSubcategory(sub)}
                                        data-testid={`button-subcategory-${sub}`}
                                      >
                                        {sub}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  
                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Keywords</span>
                        <span className="font-medium">1,188</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your Keywords</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Favorites</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Recently Added</span>
                        <span className="font-medium">45</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Main content area */}
                <div className="flex-1">
                  <TabsContent value="system" className="mt-0">
                    {keywordsLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Sparkles className="h-8 w-8 text-primary animate-pulse mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading keywords...</p>
                        </div>
                      </div>
                    ) : keywords.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64">
                          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">No keywords found</p>
                          <p className="text-sm text-muted-foreground text-center">
                            Try adjusting your search or filters
                          </p>
                        </CardContent>
                      </Card>
                    ) : viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {keywords.map(renderKeywordCard)}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {keywords.map(renderKeywordListItem)}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="my" className="mt-0">
                    {!isAuthenticated ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64">
                          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">Authentication Required</p>
                          <p className="text-sm text-muted-foreground text-center mb-4">
                            Please log in to view and manage your custom keywords
                          </p>
                          <Button onClick={() => window.location.href = "/api/login"}>
                            Log In
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center h-64">
                            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium mb-2">No custom keywords yet</p>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                              Create your first custom keyword to get started
                            </p>
                            <Button 
                              onClick={() => {
                                setEditingKeyword(null);
                                customKeywordForm.reset();
                                setCustomKeywordModalOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Keyword
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="community" className="mt-0">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">Community Keywords</p>
                        <p className="text-sm text-muted-foreground text-center">
                          Browse keywords shared by the community
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          (Coming soon)
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Floating Action Bar for Selected Keywords */}
      {isSelectionMode && selectedKeywords.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-lg border-primary">
            <CardContent className="flex items-center gap-4 p-4">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {selectedKeywords.length} selected
              </Badge>
              <Button
                onClick={clearKeywords}
                variant="outline"
                size="sm"
                data-testid="button-clear-selection"
              >
                <XSquare className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={sendToGenerator}
                className="bg-primary"
                size="sm"
                data-testid="button-send-to-generator"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Generator
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Custom Keyword Modal */}
      <Dialog open={customKeywordModalOpen} onOpenChange={setCustomKeywordModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingKeyword ? "Edit Keyword" : "Create Custom Keyword"}
            </DialogTitle>
            <DialogDescription>
              {editingKeyword 
                ? "Update your custom keyword details"
                : "Add a new custom keyword to your personal dictionary"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...customKeywordForm}>
            <form onSubmit={customKeywordForm.handleSubmit(onSubmitCustomKeyword)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={customKeywordForm.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cyberpunk" {...field} data-testid="input-keyword-term" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={customKeywordForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-keyword-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={customKeywordForm.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Futuristic" {...field} data-testid="input-keyword-subcategory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this keyword represents..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-keyword-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="synonyms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Synonyms (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Comma-separated list, e.g., Tech noir, Dystopian future"
                        {...field}
                        data-testid="input-keyword-synonyms"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter synonyms separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="examples"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Examples (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comma-separated examples of usage..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-keyword-examples"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide example prompts using this keyword
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Comma-separated tags, e.g., futuristic, neon, technology"
                        {...field}
                        data-testid="input-keyword-tags"
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to help categorize this keyword
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Share with Community</FormLabel>
                      <FormDescription>
                        Make this keyword available to other users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                        data-testid="checkbox-keyword-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCustomKeywordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-keyword">
                  {editingKeyword ? "Update Keyword" : "Create Keyword"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Custom Synonym Modal */}
      <Dialog open={customSynonymModalOpen} onOpenChange={setCustomSynonymModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Synonym</DialogTitle>
            <DialogDescription>
              Add a custom synonym for "{selectedKeywordForSynonym?.term}"
            </DialogDescription>
          </DialogHeader>
          
          <Form {...customSynonymForm}>
            <form onSubmit={customSynonymForm.handleSubmit(onSubmitCustomSynonym)} className="space-y-4">
              <FormField
                control={customSynonymForm.control}
                name="synonym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Synonym</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a synonym..."
                        {...field}
                        data-testid="input-synonym"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customSynonymForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this synonym..."
                        className="resize-none"
                        {...field}
                        data-testid="textarea-synonym-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCustomSynonymModalOpen(false);
                    setSelectedKeywordForSynonym(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-synonym">
                  Add Synonym
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}