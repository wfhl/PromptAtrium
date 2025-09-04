import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Search, Filter, Star, TrendingUp, Clock } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Prompt } from "@shared/schema";

export default function Community() {
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    params.append("isPublic", "true");
    if (searchQuery) params.append("search", searchQuery);
    if (categoryFilter) params.append("category", categoryFilter);
    if (sortBy === "featured") params.append("isFeatured", "true");
    params.append("limit", "20");
    return params.toString();
  };

  // Fetch community prompts
  const { data: prompts = [], refetch } = useQuery<Prompt[]>({
    queryKey: [`/api/prompts?${buildQuery()}`],
    enabled: isAuthenticated,
    retry: false,
  });

  const getSortIcon = () => {
    switch (sortBy) {
      case "featured":
        return <Star className="h-4 w-4" />;
      case "trending":
        return <TrendingUp className="h-4 w-4" />;
      case "recent":
        return <Clock className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="h-4 w-4 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-dashboard">
                Dashboard
              </Link>
              <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-library">
                My Library
              </Link>
              <Link href="/community" className="text-primary font-medium border-b-2 border-primary pb-4 -mb-4" data-testid="nav-community">
                Community
              </Link>
              <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-projects">
                Projects
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/api/logout">
              <Button variant="ghost" data-testid="button-logout">
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Community Hub
          </h1>
          <p className="text-muted-foreground">Discover, share, and explore prompts from the community</p>
        </div>

        {/* Filters and Sort */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Discover & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search community prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Art & Design">Art & Design</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                  <SelectItem value="Character Design">Character Design</SelectItem>
                  <SelectItem value="Landscape">Landscape</SelectItem>
                  <SelectItem value="Logo & Branding">Logo & Branding</SelectItem>
                  <SelectItem value="Abstract">Abstract</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => refetch()} className="flex items-center space-x-2" data-testid="button-apply-filters">
                {getSortIcon()}
                <span>Apply Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sort Tabs */}
        <div className="flex items-center space-x-2 mb-6">
          <Button
            size="sm"
            variant={sortBy === "featured" ? "default" : "ghost"}
            onClick={() => setSortBy("featured")}
            className="flex items-center space-x-2"
            data-testid="filter-featured"
          >
            <Star className="h-4 w-4" />
            <span>Featured</span>
          </Button>
          <Button
            size="sm"
            variant={sortBy === "trending" ? "default" : "ghost"}
            onClick={() => setSortBy("trending")}
            className="flex items-center space-x-2"
            data-testid="filter-trending"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </Button>
          <Button
            size="sm"
            variant={sortBy === "recent" ? "default" : "ghost"}
            onClick={() => setSortBy("recent")}
            className="flex items-center space-x-2"
            data-testid="filter-recent"
          >
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </Button>
        </div>

        {/* Prompts Grid */}
        <div className="space-y-4" data-testid="section-community-prompts">
          {prompts.length > 0 ? (
            prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                showActions={false}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No community prompts found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || categoryFilter
                    ? "Try adjusting your filters to discover more prompts from the community."
                    : "The community is just getting started. Check back soon for amazing prompts!"}
                </p>
                <Link href="/library">
                  <Button data-testid="button-visit-library">
                    Visit Your Library
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}