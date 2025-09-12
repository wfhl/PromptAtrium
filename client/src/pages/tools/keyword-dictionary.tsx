import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, Filter, BookOpen, Plus, ChevronDown, ChevronRight, 
  Grid, List, Star, Copy, Edit, Trash2, MoreHorizontal,
  Sparkles, Tag, Hash, TrendingUp, Clock, Users, Shield,
  Palette, MapPin, Camera, Shirt, Globe, Heart, Lock,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  CheckSquare, XSquare, Send, Menu, X, SlidersHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToolsContext } from "@/contexts/ToolsContext";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [activeTab, setActiveTab] = useState("components");
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch prompt components from database
  const { data: components = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['/api/prompt-components', debouncedSearchQuery, selectedCategory, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/prompt-components?${params}`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json();
    },
    enabled: activeTab === 'components',
  });

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['/api/prompt-components/categories'],
    queryFn: async () => {
      const response = await fetch('/api/prompt-components/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch aesthetics from database
  const { data: aesthetics = [], isLoading: aestheticsLoading } = useQuery({
    queryKey: ['/api/aesthetics', debouncedSearchQuery, selectedCategory, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/aesthetics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch aesthetics');
      return response.json();
    },
    enabled: activeTab === 'aesthetics',
  });

  // Fetch aesthetic categories
  const { data: aestheticCategories = [] } = useQuery({
    queryKey: ['/api/aesthetics/categories'],
    queryFn: async () => {
      const response = await fetch('/api/aesthetics/categories');
      if (!response.ok) throw new Error('Failed to fetch aesthetic categories');
      return response.json();
    },
  });

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
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get the active tab data and loading state
  const activeData = activeTab === 'components' ? components : aesthetics;
  const isLoading = activeTab === 'components' ? componentsLoading : aestheticsLoading;
  const categoriesData = activeTab === 'components' ? dbCategories : aestheticCategories;

  // Transform database data to match the expected format
  const keywords = useMemo(() => {
    if (!activeData || !Array.isArray(activeData)) return [];
    
    return activeData.map((item: any) => {
      if (activeTab === 'components') {
        return {
          id: item.id || Math.random().toString(36).substr(2, 9),
          term: item.value || item.name || 'Untitled',
          category: item.category || 'uncategorized',
          subcategory: item.subcategory || item.type || 'general',
          description: item.description || 'No description available',
          synonyms: Array.isArray(item.synonyms) ? item.synonyms : (item.synonyms ? [item.synonyms] : []),
          examples: Array.isArray(item.examples) ? item.examples : (item.example ? [item.example] : []),
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
          usageCount: parseInt(item.usageCount) || 0,
          isFavorite: false,
          isSystem: true,
        };
      } else {
        // For aesthetics
        return {
          id: item.id || Math.random().toString(36).substr(2, 9),
          term: item.name || 'Untitled',
          category: item.category || 'aesthetic',
          subcategory: item.era || item.subcategory || 'general',
          description: item.description || 'No description available',
          synonyms: Array.isArray(item.relatedTerms) ? item.relatedTerms : (item.relatedTerms ? [item.relatedTerms] : []),
          examples: Array.isArray(item.examples) ? item.examples : (item.example ? [item.example] : []),
          tags: Array.isArray(item.moodKeywords) ? item.moodKeywords : (item.moodKeywords ? [item.moodKeywords] : []),
          usageCount: parseInt(item.usageCount) || 0,
          isFavorite: false,
          isSystem: true,
        };
      }
    });
  }, [activeData, activeTab]);
  
  const keywordsLoading = isLoading;
  
  // Process categories for display
  const categories = useMemo(() => {
    if (!categoriesData || !Array.isArray(categoriesData)) return [];
    
    return categoriesData.map((cat: any) => ({
      id: cat.id || cat.name,
      name: cat.name || 'Unknown',
      count: cat.count || 0,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    }));
  }, [categoriesData]);

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

  // Toggle favorite
  const toggleFavorite = (keywordId: string) => {
    // TODO: Implement API call
    toast({
      title: "Favorite toggled",
      description: "Keyword favorite status updated",
    });
  };

  // Delete keyword
  const deleteKeyword = (keywordId: string) => {
    // TODO: Implement API call
    toast({
      title: "Keyword deleted",
      description: "The keyword has been removed",
    });
  };

  // Handle custom keyword submission
  const onSubmitCustomKeyword = async (data: CustomKeywordFormData) => {
    try {
      // TODO: Implement API call
      console.log("Creating custom keyword:", data);
      
      toast({
        title: "Keyword created",
        description: "Your custom keyword has been added",
      });
      
      setCustomKeywordModalOpen(false);
      customKeywordForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    } catch (error) {
      toast({
        title: "Failed to create keyword",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Handle custom synonym submission
  const onSubmitCustomSynonym = async (data: CustomSynonymFormData) => {
    try {
      // TODO: Implement API call
      console.log("Adding synonym:", data, "to keyword:", selectedKeywordForSynonym);
      
      toast({
        title: "Synonym added",
        description: "The synonym has been added to the keyword",
      });
      
      setCustomSynonymModalOpen(false);
      customSynonymForm.reset();
      setSelectedKeywordForSynonym(null);
    } catch (error) {
      toast({
        title: "Failed to add synonym",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Toggle keyword selection
  const toggleKeywordSelection = (keyword: any) => {
    const isSelected = selectedKeywords.some(k => k.id === keyword.id);
    if (isSelected) {
      removeKeyword(keyword.id);
    } else {
      addKeyword({
        id: keyword.id,
        term: keyword.term,
        category: keyword.category,
        subcategory: keyword.subcategory,
        description: keyword.description,
        synonyms: keyword.synonyms,
        tags: keyword.tags,
      });
    }
  };

  // Check if keyword is selected
  const isKeywordSelected = (keywordId: string) => {
    return selectedKeywords.some(k => k.id === keywordId);
  };

  // Render keyword card
  const renderKeywordCard = (keyword: any) => {
    const isExpanded = expandedKeywords.has(keyword.id);
    const isSelected = isKeywordSelected(keyword.id);
    const Icon = categoryIcons[keyword.category] || BookOpen;

    return (
      <Card
        key={keyword.id}
        className={`transition-all hover:shadow-md ${
          isSelected ? 'ring-1 sm:ring-2 ring-primary' : ''
        } ${isSelectionMode ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (isSelectionMode) {
            toggleKeywordSelection(keyword);
          }
        }}
        data-testid={`keyword-card-${keyword.id}`}
      >
        <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <CardTitle className="text-sm sm:text-base truncate">{keyword.term}</CardTitle>
                {keyword.isFavorite && (
                  <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-red-500 text-red-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                  {keyword.subcategory}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {keyword.usageCount.toLocaleString()} uses
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {isSelectionMode && (
                <div className="mr-1 sm:mr-2">
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  ) : (
                    <XSquare className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              {!isSelectionMode && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(keyword.id);
                    }}
                    data-testid={`button-favorite-${keyword.id}`}
                  >
                    <Star className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${keyword.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-menu-${keyword.id}`}
                      >
                        <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => copyToClipboard(keyword.term, "Keyword")}>
                        <Copy className="h-3 w-3 mr-2" />
                        Copy Term
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedKeywordForSynonym(keyword);
                        setCustomSynonymModalOpen(true);
                      }}>
                        <Plus className="h-3 w-3 mr-2" />
                        Add Synonym
                      </DropdownMenuItem>
                      {!keyword.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditingKeyword(keyword)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteKeyword(keyword.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-2 px-3 sm:pb-3 sm:px-4">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {keyword.description}
          </p>
          
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 sm:mt-2 h-6 sm:h-7 text-xs px-1 sm:px-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleKeyword(keyword.id);
              }}
              data-testid={`button-expand-${keyword.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3 mr-1" />
                  More
                </>
              )}
            </Button>
          )}
          
          <Collapsible open={isExpanded && !isSelectionMode}>
            <CollapsibleContent className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
              {keyword.synonyms.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Synonyms</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {keyword.synonyms.map((syn, index) => (
                      <Badge key={index} variant="outline" className="text-xs h-5 px-1">
                        {syn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {keyword.examples.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Examples</Label>
                  <ul className="mt-1 space-y-0.5">
                    {keyword.examples.map((example, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {keyword.tags.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {keyword.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs h-4 px-1">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Mobile-Optimized Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-bold">Keyword Dictionary</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Browse and manage AI prompt keywords
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Menu Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                onClick={() => setMobileCategoriesOpen(true)}
                data-testid="button-mobile-categories"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                onClick={() => setMobileFiltersOpen(true)}
                data-testid="button-mobile-filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              
              {/* Desktop Controls */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant={isSelectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-1.5"
                  data-testid="button-selection-mode"
                >
                  <CheckSquare className="h-4 w-4" />
                  {isSelectionMode ? "Cancel" : "Select"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomKeywordModalOpen(true)}
                  className="gap-1.5"
                  disabled={!isAuthenticated}
                  data-testid="button-add-keyword"
                >
                  <Plus className="h-4 w-4" />
                  Add Keyword
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Mobile Optimized */}
          <div className="mt-2 sm:mt-3">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords..."
                className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                data-testid="input-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Selection Bar */}
          {isSelectionMode && (
            <div className="mt-2 sm:hidden flex items-center justify-between p-2 bg-primary/10 rounded-lg">
              <span className="text-xs font-medium">
                {selectedKeywords.length} selected
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearKeywords}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={sendToGenerator}
                  disabled={selectedKeywords.length === 0}
                  className="h-7 text-xs"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-2 sm:space-y-4">
            {/* Categories */}
            <Card>
              <CardHeader className="py-2 sm:py-3">
                <CardTitle className="text-sm sm:text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3">
                <div className="space-y-1">
                  <Button
                    variant={selectedCategory === null ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    data-testid="button-category-all"
                  >
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    All Categories
                    <Badge variant="outline" className="ml-auto h-4 sm:h-5 px-1 text-xs">
                      {keywords.length}
                    </Badge>
                  </Button>
                  
                  {categories.map((category: any) => {
                    const Icon = categoryIcons[category.name?.toLowerCase()] || BookOpen;
                    const isExpanded = expandedCategories.has(category.id || category.name);
                    
                    return (
                      <div key={category.id || category.name}>
                        <Button
                          variant={selectedCategory === (category.id || category.name) ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                          onClick={() => {
                            setSelectedCategory(category.id || category.name);
                            setSelectedSubcategory(null);
                            toggleCategory(category.id || category.name);
                          }}
                          data-testid={`button-category-${category.id || category.name}`}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {category.name}
                          <Badge variant="outline" className="ml-auto h-4 sm:h-5 px-1 text-xs">
                            {category.count || 0}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        
                        <Collapsible open={isExpanded && selectedCategory === (category.id || category.name)}>
                          <CollapsibleContent>
                            <div className="ml-4 sm:ml-6 mt-1 space-y-0.5">
                              {(category.subcategories || []).map((sub: any) => (
                                <Button
                                  key={sub}
                                  variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start text-xs h-7"
                                  onClick={() => setSelectedSubcategory(sub)}
                                  data-testid={`button-subcategory-${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  {sub}
                                </Button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="py-2 sm:py-3">
                <CardTitle className="text-sm sm:text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="sort" className="text-xs">Sort By</Label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger id="sort" className="h-7 sm:h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">View Mode</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-3 w-3 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-3 w-3 mr-1" />
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Keywords Grid */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
                <TabsTrigger value="components" className="text-xs sm:text-sm">
                  Components
                </TabsTrigger>
                <TabsTrigger value="aesthetics" className="text-xs sm:text-sm">
                  Aesthetics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-2 sm:mt-4">
                {keywordsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="h-32">
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6 mt-1" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : keywords.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 sm:py-12 text-center">
                      <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No keywords found</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={
                    viewMode === "grid" 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3" 
                      : "space-y-2 sm:space-y-3"
                  }>
                    {keywords.map(renderKeywordCard)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile Categories Sheet */}
      <Sheet open={mobileCategoriesOpen} onOpenChange={setMobileCategoriesOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-base">Categories</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full pb-20">
            <div className="p-4 pt-2 space-y-1">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setMobileCategoriesOpen(false);
                }}
              >
                <BookOpen className="h-3.5 w-3.5" />
                All Categories
                <Badge variant="outline" className="ml-auto h-4 px-1 text-xs">
                  {keywords.length}
                </Badge>
              </Button>
              
              {categories.map((category: any) => {
                const Icon = categoryIcons[category.name?.toLowerCase()] || BookOpen;
                const isExpanded = expandedCategories.has(category.id || category.name);
                
                return (
                  <div key={category.id || category.name}>
                    <Button
                      variant={selectedCategory === (category.id || category.name) ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() => {
                        setSelectedCategory(category.id || category.name);
                        setSelectedSubcategory(null);
                        toggleCategory(category.id || category.name);
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {category.name}
                      <Badge variant="outline" className="ml-auto h-4 px-1 text-xs">
                        {category.count || 0}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Collapsible open={isExpanded && selectedCategory === (category.id || category.name)}>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5">
                          {(category.subcategories || []).map((sub: any) => (
                            <Button
                              key={sub}
                              variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-xs h-6"
                              onClick={() => {
                                setSelectedSubcategory(sub);
                                setMobileCategoriesOpen(false);
                              }}
                            >
                              {sub}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="right" className="w-[280px]">
          <SheetHeader>
            <SheetTitle className="text-base">Filters & Actions</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-sort" className="text-xs">Sort By</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger id="mobile-sort" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">View Mode</Label>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-3 w-3 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3 w-3 mr-1" />
                  List
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                className="w-full h-8 text-xs"
                onClick={() => {
                  toggleSelectionMode();
                  setMobileFiltersOpen(false);
                }}
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                {isSelectionMode ? "Cancel Selection" : "Select Keywords"}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setCustomKeywordModalOpen(true);
                  setMobileFiltersOpen(false);
                }}
                disabled={!isAuthenticated}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Custom Keyword
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Selection Mode Actions - Desktop */}
      {isSelectionMode && selectedKeywords.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 hidden sm:block">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedKeywords.length} keyword{selectedKeywords.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearKeywords}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={sendToGenerator}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send to Generator
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Keyword Modal */}
      <Dialog open={customKeywordModalOpen} onOpenChange={setCustomKeywordModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Keyword</DialogTitle>
            <DialogDescription>
              Add your own keyword to the dictionary
            </DialogDescription>
          </DialogHeader>
          <Form {...customKeywordForm}>
            <form onSubmit={customKeywordForm.handleSubmit(onSubmitCustomKeyword)} className="space-y-3">
              <FormField
                control={customKeywordForm.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Term</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 sm:h-9 text-xs sm:text-sm" />
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
                    <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id || cat.name} value={cat.id || cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customKeywordForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[60px] text-xs sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="h-8 sm:h-9 text-xs sm:text-sm">
                  Create Keyword
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Custom Synonym Modal */}
      <Dialog open={customSynonymModalOpen} onOpenChange={setCustomSynonymModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Synonym</DialogTitle>
            <DialogDescription>
              Add a synonym to "{selectedKeywordForSynonym?.term}"
            </DialogDescription>
          </DialogHeader>
          <Form {...customSynonymForm}>
            <form onSubmit={customSynonymForm.handleSubmit(onSubmitCustomSynonym)} className="space-y-3">
              <FormField
                control={customSynonymForm.control}
                name="synonym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Synonym</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 sm:h-9 text-xs sm:text-sm" />
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
                    <FormLabel className="text-xs sm:text-sm">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[50px] text-xs sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="h-8 sm:h-9 text-xs sm:text-sm">
                  Add Synonym
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}