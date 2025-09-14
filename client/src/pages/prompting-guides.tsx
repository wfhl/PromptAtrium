import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Hash, Palette, ChevronRight } from "lucide-react";
import { MobilePageNav } from "@/components/MobilePageNav";
import { SYNTAX_GUIDES, ANATOMY_GUIDES, ALL_GUIDES } from "@/data/promptingGuides";
import type { Guide } from "@/data/promptingGuides";

// Markdown support
const formatContent = (content: string) => {
  // Replace backticks with proper code blocks
  const processedContent = content
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h2>')
    .replace(/^- (.+)/gm, '<li class="ml-4 mb-1">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^([^<].+)$/gm, '<p class="mb-4">$1</p>');

  return processedContent;
};

export default function PromptingGuides() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [activeTab, setActiveTab] = useState("syntax");

  // Filter guides based on search
  const filteredSyntaxGuides = useMemo(() => {
    if (!searchQuery) return SYNTAX_GUIDES;
    return SYNTAX_GUIDES.filter(
      guide =>
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredAnatomyGuides = useMemo(() => {
    if (!searchQuery) return ANATOMY_GUIDES;
    return ANATOMY_GUIDES.filter(
      guide =>
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredAllGuides = useMemo(() => {
    if (!searchQuery) return ALL_GUIDES;
    return ALL_GUIDES.filter(
      guide =>
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const displayedGuides = activeTab === "syntax" ? filteredSyntaxGuides : filteredAnatomyGuides;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Mobile Navigation */}
      <MobilePageNav />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <BookOpen className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              Prompting Guides
            </h1>
            <p className="text-muted-foreground">Master the art of AI image generation</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-guides"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Guide List */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="syntax" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20"
                data-testid="tab-syntax-guides"
              >
                <Hash className="h-4 w-4 mr-2" />
                Syntax
              </TabsTrigger>
              <TabsTrigger 
                value="anatomy" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-teal-500/20"
                data-testid="tab-anatomy-guides"
              >
                <Palette className="h-4 w-4 mr-2" />
                Anatomy
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-280px)] mt-4">
              <div className="space-y-2 pr-4">
                {displayedGuides.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-center text-muted-foreground">
                      No guides found matching "{searchQuery}"
                    </p>
                  </Card>
                ) : (
                  displayedGuides.map((guide) => (
                    <Card
                      key={guide.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedGuide?.id === guide.id
                          ? activeTab === "syntax"
                            ? "ring-2 ring-purple-500/50 bg-purple-500/5"
                            : "ring-2 ring-green-500/50 bg-green-500/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedGuide(guide)}
                      data-testid={`card-guide-${guide.id}`}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {guide.title}
                          </CardTitle>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Main Content - Selected Guide */}
        <div className="lg:col-span-2">
          {selectedGuide ? (
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {selectedGuide.title}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={
                      selectedGuide.category === "syntax"
                        ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                        : "bg-green-500/10 text-green-500 border-green-500/30"
                    }
                  >
                    {selectedGuide.category === "syntax" ? "Syntax Guide" : "Anatomy Guide"}
                  </Badge>
                </div>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-80px)]">
                <CardContent className="p-6">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatContent(selectedGuide.content) }}
                  />
                </CardContent>
              </ScrollArea>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
              <div className="text-center p-8">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">Select a Guide</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Choose a guide from the list to start learning about AI prompting techniques
                </p>
                
                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  <div className="p-4 rounded-lg bg-purple-500/10">
                    <div className="text-2xl font-bold text-purple-500">{SYNTAX_GUIDES.length}</div>
                    <div className="text-sm text-muted-foreground">Syntax Guides</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold text-green-500">{ANATOMY_GUIDES.length}</div>
                    <div className="text-sm text-muted-foreground">Anatomy Guides</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}