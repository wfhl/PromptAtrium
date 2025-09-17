import { useState, useEffect } from "react";
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
  Search,
  Plus,
  Download,
  Copy,
  BookOpen,
  Shuffle,
  Save,
  FolderOpen,
  ChevronRight,
  Grid,
  List,
  Star,
  Upload,
  Edit,
  Trash,
  Check,
  X
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

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/codex/categories"],
  });

  // Fetch terms based on selected category and search
  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ["/api/codex/terms", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
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

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Category Section - Shows above terms on mobile, as sidebar on desktop */}
        <div className="lg:col-span-1 order-1 lg:order-1">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] lg:h-[600px]">
                <div className="p-4 space-y-1">
                  <Button
                    variant={!selectedCategory ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                    data-testid="button-all-categories"
                  >
                    All Categories
                  </Button>
                  {categoriesLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading...</div>
                  ) : (
                    categories.map((category: any) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                        data-testid={`button-category-${category.id}`}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        {category.name}
                        {category.termCount > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {category.termCount}
                          </Badge>
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
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
              <div className="flex gap-2 self-end sm:self-auto">
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

            {/* Browse Terms Tab */}
            <TabsContent value="browse">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {selectedCategory
                        ? categories.find((c: any) => c.id === selectedCategory)?.name || "Terms"
                        : "All Terms"}
                    </CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search terms..."
                          className="pl-10 w-full sm:w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {termsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading terms...</div>
                  ) : terms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No terms found. Try a different search or category.
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {terms.map((term: any) => (
                        <Card
                          key={term.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                          onClick={() => addToAssembledString(term)}
                          data-testid={`card-term-${term.id}`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="font-semibold text-sm sm:text-base mb-2 break-words">{term.term}</div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {term.description || ''}
                            </p>
                            {term.subcategory && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Subcategory: {term.subcategory}
                              </div>
                            )}
                            <div className="mt-2 flex gap-2">
                              {term.type === 'aesthetic' && (
                                <Badge variant="secondary">Aesthetic</Badge>
                              )}
                              {term.type === 'prompt_component' && (
                                <Badge variant="outline">Component</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {terms.map((term: any) => (
                        <div
                          key={term.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                          onClick={() => addToAssembledString(term)}
                          data-testid={`row-term-${term.id}`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold">{term.term}</div>
                            <p className="text-sm text-muted-foreground">{term.description || ''}</p>
                          </div>
                          <div className="flex gap-2">
                            {term.isOfficial && (
                              <Badge variant="secondary">Official</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToAssembledString(term);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                                <Badge variant="secondary">{list.termCount || 0} terms</Badge>
                                {list.isPublic && <Badge>Public</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Public Lists */}
                <Card>
                  <CardHeader>
                    <CardTitle>Public Wildcard Lists</CardTitle>
                    <CardDescription>
                      Browse and download wildcard lists shared by the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {publicLists.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No public lists available in this category
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {publicLists.map((list: CodexUserList) => (
                          <Card key={list.id} data-testid={`card-public-list-${list.id}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold">{list.name}</h4>
                                  <p className="text-sm text-muted-foreground">{list.description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={async () => {
                                    await fetch(`/api/codex/lists/${list.id}/download`, {
                                      method: 'POST',
                                    });
                                    toast({
                                      title: "Downloaded!",
                                      description: `${list.name} has been downloaded`,
                                    });
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{list.termCount || 0} terms</Badge>
                                <Badge variant="outline">
                                  {list.downloadCount || 0} downloads
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}