import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Plus,
  Download,
  Copy,
  BookOpen,
  Shuffle,
  Save,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
  Star,
  Upload,
  Edit,
  Trash,
  Check,
  X,
  Layers
} from "lucide-react";
import type {
  CodexCategory,
  CodexTerm,
  CodexUserList,
  CodexUserTerm,
  CodexAssembledString
} from "@shared/schema";

export default function Codex() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTerms, setSelectedTerms] = useState<CodexTerm[]>([]);
  const [assembledString, setAssembledString] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("browse");
  const [categoryTab, setCategoryTab] = useState<"all" | "aesthetics">("all");
  const [categoryView, setCategoryView] = useState<"all" | "organized">("all");
  const [aestheticsView, setAestheticsView] = useState<"all" | "organized">("all");
  const [cardSize, setCardSize] = useState({ width: 300, height: 600 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  // Color mapping for anatomy groups
  const getAnatomyGroupColor = (group: string) => {
    const colors: { [key: string]: string } = {
      'Subject': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Style & Medium': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Environment & Setting': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Lighting': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'Camera & Composition': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Color & Mood': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Details & Textures': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Action & Movement': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Special Effects': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[group] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = cardSize.width;
    const startHeight = cardSize.height;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const newWidth = Math.max(200, Math.min(500, startWidth + e.clientX - startX));
      const newHeight = Math.max(300, Math.min(800, startHeight + e.clientY - startY));
      
      setCardSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cardSize.width, cardSize.height]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    { id: string; name: string; termCount: number; anatomyGroup?: string; subcategories?: string[] }[]
  >({
    queryKey: ["/api/codex/categories"],
  });

  // Fetch terms based on selected category and search
  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ["/api/codex/terms", selectedCategory, searchQuery, categoryTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      // Exclude aesthetics when in Subject Terms tab and no category is selected
      if (categoryTab === "all" && !selectedCategory) {
        params.append("excludeAesthetics", "true");
      }
      const response = await fetch(`/api/codex/terms?${params}`);
      if (!response.ok) throw new Error("Failed to fetch terms");
      return response.json();
    },
  });

  // Fetch user's lists
  const { data: userLists = [] } = useQuery({
    queryKey: ["/api/codex/lists", "user"],
    queryFn: async () => {
      const user = await fetch("/api/auth/user").then(r => r.json());
      if (!user?.id) return [];
      const response = await fetch(`/api/codex/lists?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user lists");
      return response.json();
    },
  });

  // Fetch public lists
  const { data: publicLists = [] } = useQuery({
    queryKey: ["/api/codex/lists", "public", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ public: "true" });
      if (selectedCategory) params.append("categoryId", selectedCategory);
      const response = await fetch(`/api/codex/lists?${params}`);
      if (!response.ok) throw new Error("Failed to fetch public lists");
      return response.json();
    },
  });

  // Add term to assembled string
  const addToAssembledString = (term: any) => {
    setAssembledString(prev => [...prev, term.term]);
    setSelectedTerms(prev => [...prev, term]);
  };

  // Remove term from assembled string
  const removeFromAssembledString = (index: number) => {
    setAssembledString(prev => prev.filter((_, i) => i !== index));
    setSelectedTerms(prev => prev.filter((_, i) => i !== index));
  };

  // Randomize assembled string order
  const randomizeOrder = () => {
    const shuffled = [...assembledString].sort(() => Math.random() - 0.5);
    setAssembledString(shuffled);
  };

  // Copy assembled string to clipboard
  const copyToClipboard = () => {
    const text = assembledString.join(", ");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Assembled string copied to clipboard",
    });
  };

  // Save assembled string mutation
  const saveAssembledStringMutation = useMutation({
    mutationFn: async (data: { name: string; content: string[] }) => {
      return apiRequest("/api/codex/assembled-strings", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Saved!",
        description: "Your assembled string has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/codex/assembled-strings"] });
    },
  });


  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Wordsmith Codex</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Browse and assemble AI prompt components from our extensive wildcard database
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {/* Category Section - Shows above terms on mobile, as sidebar on desktop */}
        <div className="lg:col-span-1 order-1 lg:order-1">
          <div 
            ref={cardRef}
            className="relative"
            style={{ width: `${cardSize.width}px`, height: `${cardSize.height}px` }}
          >
            <Card className="h-full lg:sticky lg:top-4">
              <CardContent className="p-0">
                <Tabs value={categoryTab} onValueChange={(v) => setCategoryTab(v as "all" | "aesthetics")} className="w-full">
                  <TabsList className="w-full rounded-none">
                    <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm" data-testid="tab-all-categories">
                      Subject Terms
                    </TabsTrigger>
                    <TabsTrigger value="aesthetics" className="flex-1 text-xs sm:text-sm" data-testid="tab-aesthetics">
                      <Star className="w-3 h-3 mr-1" />
                      Aesthetics
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-0">
                    <Tabs value={categoryView} onValueChange={(v) => setCategoryView(v as "all" | "organized")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-6">
                        <TabsTrigger value="all" className="text-xs py-0.2" data-testid="tab-all-view">
                          <Grid className="w-3 h-3 mr-1" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="organized" className="text-xs py-0.2" data-testid="tab-organized-view">
                          <Layers className="w-3 h-3 mr-1" />
                          Organized
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-2">
                        <ScrollArea className="h-[120px] sm:h-[170px] lg:h-[500px]">
                          <div className="p-2 sm:p-3 space-y-1">
                            <Button
                              variant={!selectedCategory ? "secondary" : "ghost"}
                              className="w-full justify-start h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-1"
                              onClick={() => setSelectedCategory(null)}
                              data-testid="button-all-categories"
                            >
                              All Categories
                            </Button>
                            {categoriesLoading ? (
                              <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">Loading...</div>
                            ) : (
                              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-2">
                                {categories.filter(c => c.id !== "aesthetics").map(category => (
                                  <Button
                                    key={category.id}
                                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                                    className="justify-start h-7 sm:h-8 lg:h-9 text-xs lg:text-sm px-1 sm:px-2 truncate"
                                    onClick={() => setSelectedCategory(category.id)}
                                    data-testid={`button-category-${category.id}`}
                                  >
                                    <span className="truncate">{category.name}</span>
                                    {category.termCount > 0 && (
                                      <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4">
                                        {category.termCount}
                                      </Badge>
                                    )}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="organized" className="mt-2">
                        <ScrollArea className="h-[120px] sm:h-[170px] lg:h-[500px]">
                          <div className="p-2 sm:p-3">
                            <Button
                              variant={!selectedCategory ? "secondary" : "ghost"}
                              className="w-full justify-start h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-2"
                              onClick={() => setSelectedCategory(null)}
                              data-testid="button-all-organized"
                            >
                              All Categories
                            </Button>
                            {categoriesLoading ? (
                              <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">Loading...</div>
                            ) : (
                              <Accordion type="single" collapsible className="w-full space-y-1">
                                {/* Group categories by anatomy group */}
                                {Object.entries(
                                  categories
                                    .filter(c => c.id !== "aesthetics")
                                    .reduce((acc, cat) => {
                                      const group = cat.anatomyGroup || "Other";
                                      if (!acc[group]) acc[group] = [];
                                      acc[group].push(cat);
                                      return acc;
                                    }, {} as { [key: string]: typeof categories })
                                )
                                  .sort(([a], [b]) => {
                                    // Define custom sort order for anatomy groups
                                    const order = [
                                      'Subject',
                                      'Style & Medium',
                                      'Environment & Setting',
                                      'Lighting',
                                      'Camera & Composition',
                                      'Color & Mood',
                                      'Details & Textures',
                                      'Action & Movement',
                                      'Special Effects',
                                      'Other'
                                    ];
                                    return order.indexOf(a) - order.indexOf(b);
                                  })
                                  .map(([group, groupCategories]) => (
                                    <AccordionItem
                                      key={group}
                                      value={group}
                                      className={`border rounded-lg px-2 ${getAnatomyGroupColor(group)}`}
                                    >
                                      <AccordionTrigger className="hover:no-underline py-2 text-xs sm:text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{group}</span>
                                          <Badge variant="secondary" className="text-xs">
                                            {groupCategories.length}
                                          </Badge>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="space-y-1 pt-1">
                                          {groupCategories.map(category => (
                                            <Button
                                              key={category.id}
                                              variant={selectedCategory === category.id ? "secondary" : "ghost"}
                                              className="w-full justify-start h-7 sm:h-8 text-xs sm:text-sm px-2 bg-background/50"
                                              onClick={() => setSelectedCategory(category.id)}
                                              data-testid={`button-organized-${category.id}`}
                                            >
                                              <span className="truncate">{category.name}</span>
                                              {category.termCount > 0 && (
                                                <Badge variant="outline" className="ml-auto text-xs px-1 py-0 h-4">
                                                  {category.termCount}
                                                </Badge>
                                              )}
                                            </Button>
                                          ))}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                              </Accordion>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                  <TabsContent value="aesthetics" className="mt-0">
                    <Tabs value={aestheticsView} onValueChange={(v) => setAestheticsView(v as "all" | "organized")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-6">
                        <TabsTrigger value="all" className="text-xs py-0.2" data-testid="tab-aesthetics-all">
                          <Grid className="w-3 h-3 mr-1" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="organized" className="text-xs py-0.2" data-testid="tab-aesthetics-organized">
                          <Layers className="w-3 h-3 mr-1" />
                          Organized
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-2">
                        <ScrollArea className="h-[120px] sm:h-[170px] lg:h-[500px]">
                          <div className="p-2 sm:p-3 space-y-1">
                            <Button
                              variant={selectedCategory === "aesthetics" ? "secondary" : "ghost"}
                              className="w-full justify-start h-6 text-[10px] sm:text-xs py-0.2 mb-1"
                              onClick={() => setSelectedCategory("aesthetics")}
                              data-testid="button-all-aesthetics"
                            >
                              All Aesthetics
                            </Button>
                            {categoriesLoading ? (
                              <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">Loading...</div>
                            ) : (
                              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-2">
                                {/* Extract aesthetic subcategories */}
                                {categories
                                  .find(c => c.id === "aesthetics")
                                  ?.subcategories?.map(subcat => (
                                    <Button
                                      key={subcat}
                                      variant={selectedCategory === `aesthetics:${subcat}` ? "secondary" : "ghost"}
                                      className="justify-start h-7 sm:h-8 lg:h-9 text-xs lg:text-sm px-1 sm:px-2 truncate"
                                      onClick={() => setSelectedCategory(`aesthetics:${subcat}`)}
                                      data-testid={`button-aesthetic-${subcat}`}
                                    >
                                      <span className="truncate">{subcat}</span>
                                    </Button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="organized" className="mt-2">
                        <ScrollArea className="h-[120px] sm:h-[170px] lg:h-[500px]">
                          <div className="p-2 sm:p-3">
                            <Button
                              variant={selectedCategory === "aesthetics" ? "secondary" : "ghost"}
                              className="w-full justify-start h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-2"
                              onClick={() => setSelectedCategory("aesthetics")}
                              data-testid="button-all-aesthetics-organized"
                            >
                              All Aesthetics
                            </Button>
                            {categoriesLoading ? (
                              <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">Loading...</div>
                            ) : (
                              <div className="space-y-2">
                                {/* Group aesthetic subcategories - for now just show them as a styled list */}
                                {/* In the future, these could be organized by era, style, etc. */}
                                <div className="rounded-lg border p-3 bg-purple-500/10 border-purple-500/30">
                                  <h4 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">
                                    Style Categories
                                  </h4>
                                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                                    {categories
                                      .find(c => c.id === "aesthetics")
                                      ?.subcategories?.map(subcat => (
                                        <Button
                                          key={subcat}
                                          variant={selectedCategory === `aesthetics:${subcat}` ? "secondary" : "ghost"}
                                          className="justify-start h-7 sm:h-8 text-xs sm:text-sm px-2 bg-background/50"
                                          onClick={() => setSelectedCategory(`aesthetics:${subcat}`)}
                                          data-testid={`button-aesthetic-organized-${subcat}`}
                                        >
                                          <span className="truncate">{subcat}</span>
                                        </Button>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            {/* Resize handle */}
            <div 
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group hover:bg-primary/20 transition-colors"
              style={{ 
                background: 'linear-gradient(135deg, transparent 50%, currentColor 50%)',
                color: 'rgb(148 163 184 / 0.5)'
              }}
              data-testid="resize-handle"
            >
              <div className="absolute bottom-0 right-0 w-3 h-3" 
                style={{ 
                  background: 'linear-gradient(135deg, transparent 40%, currentColor 40%, currentColor 60%, transparent 60%)',
                  opacity: 0.7
                }}
              />
            </div>
          </div>
        </div>

          {/* Main Content Area - Shows below categories on mobile, beside on desktop */}
          <div className="lg:col-span-3 order-2 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
                  <TabsTrigger value="browse" data-testid="tab-browse" className="text-xs sm:text-sm">Browse Terms</TabsTrigger>
                  <TabsTrigger value="assemble" data-testid="tab-assemble" className="text-xs sm:text-sm">String Assembly</TabsTrigger>
                  <TabsTrigger value="lists" data-testid="tab-lists" className="text-xs sm:text-sm">Wildcard Lists</TabsTrigger>
                </TabsList>
              </div>

              {/* Browse Terms Tab - NO CARD WRAPPER */}
              <TabsContent value="browse" className="space-y-3">
                {/* Title, Search and View Options Bar - All on one row */}
                <div className="flex flex-row justify-between items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold flex-shrink-0">
                    {selectedCategory === "aesthetics"
                      ? "Aesthetics"
                      : selectedCategory?.startsWith("aesthetics:")
                        ? selectedCategory.replace("aesthetics:", "")
                        : selectedCategory
                          ? categories.find(c => c.id === selectedCategory)?.name || "Terms"
                          : "All Terms"}
                  </h3>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                      <Input
                        placeholder="Search..."
                        className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm w-32 sm:w-48"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${viewMode === "grid" ? "bg-secondary" : ""}`}
                      onClick={() => setViewMode("grid")}
                      data-testid="button-view-grid"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${viewMode === "list" ? "bg-secondary" : ""}`}
                      onClick={() => setViewMode("list")}
                      data-testid="button-view-list"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Terms Content - NO CARD */}
                {termsLoading ? (
                  <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">Loading terms...</div>
                ) : terms.length === 0 ? (
                  <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                    No terms found. Try a different search or category.
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {terms.map((term: any) => (
                      <Card
                        key={term.id}
                        className="cursor-pointer hover:shadow-md transition-shadow h-full"
                        onClick={() => addToAssembledString(term)}
                        data-testid={`card-term-${term.id}`}
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="font-medium text-xs sm:text-sm mb-1 break-words line-clamp-2">{term.term}</div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {term.description || ''}
                          </p>
                          {term.subcategory && (
                            <div className="mt-1 text-xs text-muted-foreground truncate">
                              {term.subcategory}
                            </div>
                          )}

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    {terms.map((term: any) => (
                      <div
                        key={term.id}
                        className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                        onClick={() => addToAssembledString(term)}
                        data-testid={`row-term-${term.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{term.term}</div>
                          <p className="text-xs text-muted-foreground truncate">{term.description || ''}</p>
                        </div>
                        <div className="flex gap-1 sm:gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToAssembledString(term);
                            }}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* String Assembly Tab */}
              <TabsContent value="assemble">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>String Assembly</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={randomizeOrder}
                          disabled={assembledString.length === 0}
                          data-testid="button-randomize"
                        >
                          <Shuffle className="w-4 h-4 mr-2" />
                          Randomize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          disabled={assembledString.length === 0}
                          data-testid="button-copy"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const name = prompt("Enter a name for this assembled string:");
                            if (name) {
                              saveAssembledStringMutation.mutate({
                                name,
                                content: assembledString,
                              });
                            }
                          }}
                          disabled={assembledString.length === 0}
                          data-testid="button-save-assembled"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assembledString.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Click on terms from the Browse tab to add them to your assembled string
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 p-4 bg-secondary/50 rounded-lg">
                          <div className="font-mono text-sm" data-testid="text-assembled-string">
                            {assembledString.join(", ")}
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <h4 className="font-semibold mb-2">Selected Terms ({selectedTerms.length})</h4>
                          {selectedTerms.map((term, index) => (
                            <div
                              key={`${term.id}-${index}`}
                              className="flex items-center justify-between p-3 border rounded-lg"
                              data-testid={`item-selected-term-${index}`}
                            >
                              <div>
                                <div className="font-semibold">{term.term}</div>
                                <div className="text-sm text-muted-foreground">{term.description || ''}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromAssembledString(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wildcard Lists Tab */}
              <TabsContent value="lists">
                <div className="space-y-6">
                  {/* User's Lists */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>My Wildcard Lists</span>
                        <Button size="sm" data-testid="button-create-list">
                          <Plus className="w-4 h-4 mr-2" />
                          Create List
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userLists.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          You haven't created any wildcard lists yet
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userLists.map((list: CodexUserList) => (
                            <Card key={list.id} data-testid={`card-user-list-${list.id}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold">{list.name}</h4>
                                    <p className="text-sm text-muted-foreground">{list.description}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  {list.isPublic && <Badge>Public</Badge>}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="text-center py-8 text-muted-foreground">
                    Public Lists section temporarily disabled for debugging
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
}