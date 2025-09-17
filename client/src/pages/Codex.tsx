import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Layers,
  Send,
  Minimize2,
  Maximize2
} from "lucide-react";
import type {
  CodexCategory,
  CodexTerm,
  CodexUserList,
  CodexUserTerm,
  CodexAssembledString
} from "@shared/schema";

// Assembly Toast Portal Component
function AssemblyToastPortal({ 
  assembledString, 
  toastMinimized, 
  setToastMinimized, 
  clearAllSelections,
  randomizeAssembledString, 
  copyAssembledString,
  saveAssembledStringMutation 
}: {
  assembledString: string[];
  toastMinimized: boolean;
  setToastMinimized: (minimized: boolean) => void;
  clearAllSelections: () => void;
  randomizeAssembledString: () => void;
  copyAssembledString: () => void;
  saveAssembledStringMutation: any;
}) {
  return createPortal(
    <div 
      className={`fixed top-8 ${
        toastMinimized ? 'right-4 w-auto' : 'left-4 right-4 sm:right-4 sm:left-auto sm:w-96'
      } bg-purple-900/10 backdrop-blur-md border border-purple-500/30 shadow-lg shadow-purple-500/20 rounded-lg transition-all duration-300 z-[100] text-white`}
    >
      {toastMinimized ? (
        <div className="flex items-center gap-2 p-3">
          <span className="text-sm font-medium">{assembledString.length} terms selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToastMinimized(false)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-1 border-b border-white/20">
            <h3 className="font-semibold text-sm text-white">Collected Terms</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToastMinimized(true)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllSelections}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="bg-black/20 rounded-lg p-3 min-h-[60px] max-h-[150px] overflow-y-auto mb-3">
              {assembledString.length === 0 ? (
                <p className="text-sm text-white/70">Click terms to add them here...</p>
              ) : (
                <p className="text-sm break-words text-white">{assembledString.join(', ')}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={randomizeAssembledString}
                  disabled={assembledString.length === 0}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 text-xs"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Randomize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAssembledString}
                  disabled={assembledString.length === 0}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt("Name for this assembled string:");
                    if (name) {
                      saveAssembledStringMutation.mutate({ 
                        name, 
                        content: assembledString 
                      });
                    }
                  }}
                  disabled={assembledString.length === 0}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Send to Generator feature will be implemented later",
                    });
                  }}
                  disabled={assembledString.length === 0}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default function Codex() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTerms, setSelectedTerms] = useState<CodexTerm[]>([]);
  const [assembledString, setAssembledString] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("browse");
  const [showAssemblyToast, setShowAssemblyToast] = useState(false);
  const [toastMinimized, setToastMinimized] = useState(false);
  const [categoryTab, setCategoryTab] = useState<"all" | "aesthetics">("all");
  const [categoryView, setCategoryView] = useState<"all" | "organized">("all");
  const [aestheticsView, setAestheticsView] = useState<"all" | "organized">("all");
  const [categoryHeight, setCategoryHeight] = useState(250); // Default mobile height in pixels
  const [isMobile, setIsMobile] = useState(false);

  // Refs for smooth dragging without re-renders
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentHeightRef = useRef(categoryHeight);
  const rafIdRef = useRef<number | null>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle touch start for resizing
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingRef.current = true;
    startYRef.current = touch.clientY;
    startHeightRef.current = categoryHeight;
    currentHeightRef.current = categoryHeight;

    // Prevent text selection and scrolling while dragging
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';
    e.preventDefault();

    // Add global handlers
    const handleGlobalTouchMove = (evt: TouchEvent) => {
      if (!isDraggingRef.current) return;
      evt.preventDefault();

      const touch = evt.touches[0];
      const currentY = touch.clientY;
      // FIXED: Drag down increases height (like textarea)
      const deltaY = currentY - startYRef.current;
      const newHeight = Math.min(Math.max(150, startHeightRef.current + deltaY), window.innerHeight * 0.7);

      // Cancel previous RAF if pending
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      rafIdRef.current = requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          // Update all ScrollArea heights directly in DOM for smooth resizing
          // Subtract 32px (8 * 4 in Tailwind) for the drag handle height
          const scrollAreas = scrollAreaRef.current.querySelectorAll('.resize-target');
          scrollAreas.forEach((el) => {
            (el as HTMLElement).style.height = `${newHeight - 32}px`;
          });
          currentHeightRef.current = newHeight;
        }
        rafIdRef.current = null;
      });
    };

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;

        // Cancel any pending RAF
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }

        // Commit final height to React state
        setCategoryHeight(currentHeightRef.current);

        // Restore body styles
        document.body.style.userSelect = '';
        document.body.style.overflow = '';

        // Remove global listeners
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      }
    };

    // Add global listeners
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
  };

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

  // Toggle term in assembled string (for clicking on terms)
  const toggleTermInAssembly = (term: any) => {
    const isSelected = selectedTerms.some(t => t.id === term.id);

    if (isSelected) {
      // Remove term
      setSelectedTerms(prev => prev.filter(t => t.id !== term.id));
      setAssembledString(prev => {
        const index = prev.indexOf(term.term);
        if (index > -1) {
          const newArray = [...prev];
          newArray.splice(index, 1);
          return newArray;
        }
        return prev;
      });
    } else {
      // Add term
      setSelectedTerms(prev => [...prev, term]);
      setAssembledString(prev => [...prev, term.term]);
    }
  };

  // Add term to assembled string (for String Assembly tab)
  const addToAssembledString = (term: any) => {
    if (!selectedTerms.some(t => t.id === term.id)) {
      setAssembledString(prev => [...prev, term.term]);
      setSelectedTerms(prev => [...prev, term]);
    }
  };

  // Remove term from assembled string
  const removeFromAssembledString = (index: number) => {
    setAssembledString(prev => prev.filter((_, i) => i !== index));
    setSelectedTerms(prev => prev.filter((_, i) => i !== index));
  };

  // Show toast when terms are selected
  useEffect(() => {
    setShowAssemblyToast(selectedTerms.length > 0);
    if (selectedTerms.length === 0) {
      setToastMinimized(false);
    }
  }, [selectedTerms]);

  // Check if a term is selected
  const isTermSelected = (termId: string) => {
    return selectedTerms.some(t => t.id === termId);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedTerms([]);
    setAssembledString([]);
  };

  // Randomize assembled string order
  const randomizeAssembledString = () => {
    const shuffled = [...assembledString].sort(() => Math.random() - 0.5);
    setAssembledString(shuffled);
  };

  // Copy assembled string to clipboard
  const copyAssembledString = () => {
    navigator.clipboard.writeText(assembledString.join(', '));
    toast({
      title: "Copied!",
      description: "Assembled string copied to clipboard",
    });
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
    <>
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
          <Card className="h-full lg:sticky lg:top-4 flex flex-col" ref={scrollAreaRef}>
              <CardContent className="p-0 flex-1">
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

                      <TabsContent value="all" className="mt-1">
                        <ScrollArea 
                          className="lg:h-[500px] resize-target" 
                          style={{ height: isMobile ? `${categoryHeight - 32}px` : undefined }}
                        >
                          <div className="p-1 sm:p-1 space-y-1">
                            <Button
                              variant={!selectedCategory ? "secondary" : "ghost"}
                              className="w-full justify-center h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-1"
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

                      <TabsContent value="organized" className="mt-1">
                        <ScrollArea 
                          className="lg:h-[500px] resize-target" 
                          style={{ height: isMobile ? `${categoryHeight - 32}px` : undefined }}
                        >
                          <div className="p-1 sm:p-1">
                            <Button
                              variant={!selectedCategory ? "secondary" : "ghost"}
                              className="w-full justify-center h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-2"
                              onClick={() => setSelectedCategory(null)}
                              data-testid="button-all-organized"
                            >
                              All Categories
                            </Button>
                            {categoriesLoading ? (
                              <div className="text-center py-1 text-xs sm:text-xs text-muted-foreground">Loading...</div>
                            ) : (
                              <Accordion type="single" collapsible className="w-full py-1 h-7 space-y-1">
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
                                      'Other',

'NSFW'
                                    ];
                                    return order.indexOf(a) - order.indexOf(b);
                                  })
                                  .map(([group, groupCategories]) => (
                                    <AccordionItem
                                      key={group}
                                      value={group}
                                      className={`border rounded-lg px-2 ${getAnatomyGroupColor(group)}`}
                                    >
                                      <AccordionTrigger className="hover:no-underline py-2 h-7 text-xs sm:text-sm">
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

                      <TabsContent value="all" className="mt-1">
                        <ScrollArea 
                          className="lg:h-[500px] resize-target" 
                          style={{ height: isMobile ? `${categoryHeight - 32}px` : undefined }}
                        >
                          <div className="p-1 sm:p-1 space-y-1">
                            <Button
                              variant={selectedCategory === "aesthetics" ? "secondary" : "ghost"}
                              className="w-full justify-center h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-1"
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

                      <TabsContent value="organized" className="mt-1">
                        <ScrollArea 
                          className="lg:h-[500px] resize-target" 
                          style={{ height: isMobile ? `${categoryHeight - 32}px` : undefined }}
                        >
                          <div className="p-1 sm:p-1">
                            <Button
                              variant={selectedCategory === "aesthetics" ? "secondary" : "ghost"}
                              className="w-full justify-center h-6 sm:h-7 text-[10px] sm:text-xs px-2 mb-3"
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
              {/* Touch drag handle for mobile - positioned below content */}
              <div 
                className="lg:hidden h-4 bg-purple-900/20 border-t border-muted/20 flex items-center justify-center cursor-ns-resize touch-none flex-shrink-0"
                onTouchStart={handleTouchStart}
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
              >
                <div className="flex flex-col items-center gap-0.5 py-1">
                  <div className="w-16 h-0.5 bg-blue-400/10 rounded-full" />
                  <div className="w-12 h-0.5 bg-blue-400/10 rounded-full" />
                </div>
              </div>
            </Card>
        </div>

          {/* Main Content Area - Shows below categories on mobile, beside on desktop */}
          <div className="lg:col-span-3 order-2 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
                  <TabsTrigger value="browse" data-testid="tab-browse" className="text-xs sm:text-sm">Browse Terms</TabsTrigger>
                  <TabsTrigger value="assemble" data-testid="tab-assemble" className="text-xs sm:text-sm">Collected Terms</TabsTrigger>
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
                        className={`cursor-pointer hover:shadow-md transition-all h-full ${
                          isTermSelected(term.id) ? 'ring-2 ring-primary bg-primary/10' : ''
                        }`}
                        onClick={() => toggleTermInAssembly(term)}
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
                        className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-all ${
                          isTermSelected(term.id) ? 'ring-2 ring-primary bg-primary/10' : ''
                        }`}
                        onClick={() => toggleTermInAssembly(term)}
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
                              toggleTermInAssembly(term);
                            }}
                          >
                            {isTermSelected(term.id) ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
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
                      <span>Collected Terms</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Send to Generator feature will be implemented soon",
                            });
                          }}
                          disabled={assembledString.length === 0}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          data-testid="button-send-to-generator"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send to Generator
                        </Button>
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

        {/* Live String Assembly Toast Portal */}
        {showAssemblyToast ? (
          <AssemblyToastPortal
            assembledString={assembledString}
            toastMinimized={toastMinimized}
            setToastMinimized={setToastMinimized}
            clearAllSelections={clearAllSelections}
            randomizeAssembledString={randomizeAssembledString}
            copyAssembledString={copyAssembledString}
            saveAssembledStringMutation={saveAssembledStringMutation}
          />
        ) : null}
      </div>
    </>
  );
}