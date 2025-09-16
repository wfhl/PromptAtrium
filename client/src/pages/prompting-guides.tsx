import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Hash, Palette, ChevronRight, ExternalLink, Heart, Lightbulb, Wand2, Wrench, Users, MessageCircle, PlayCircle, MessageSquare, Sparkles, AlertCircle, Book, Zap, Code } from "lucide-react";
import { MobilePageNav } from "@/components/MobilePageNav";
import { useLocation } from "wouter";
import { SYNTAX_GUIDES, ANATOMY_GUIDES, PROMPT_RESOURCES, LEARNING_RESOURCES, QUICK_TIPS } from "@/data/promptingGuides";
import type { Guide, Resource } from "@/data/promptingGuides";

// Markdown support
const formatContent = (content: string) => {
  // Replace backticks with proper code blocks
  const processedContent = content
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800/50 p-4 rounded-lg overflow-x-auto my-4 text-gray-300 text-sm"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800/50 px-2 py-1 rounded text-sm text-blue-400">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-100 font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/### (.+)/g, '<h3 class="text-base font-semibold mt-6 mb-3 text-gray-100">$1</h3>')
    .replace(/## (.+)/g, '<h2 class="text-lg font-bold mt-6 mb-3 text-gray-100">$1</h2>')
    .replace(/^- (.+)/gm, '<li class="ml-4 mb-1 text-gray-300">• $1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-300 leading-relaxed">')
    .replace(/^([^<].+)$/gm, '<p class="mb-4 text-gray-300 leading-relaxed">$1</p>');

  return processedContent;
};

// Get color classes for topics
const getTopicColor = (title: string, isAnatomy: boolean = false) => {
  if (isAnatomy) {
    if (title.includes("Subject")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (title.includes("Scene") || title.includes("Environment")) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (title.includes("Style") || title.includes("Special")) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    if (title.includes("Details") || title.includes("Quality")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (title.includes("Lighting") || title.includes("Action")) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    if (title.includes("Color") || title.includes("Mood")) return "bg-pink-500/20 text-pink-400 border-pink-500/30";
    if (title.includes("Composition")) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (title.includes("Advanced") || title.includes("Modifiers")) return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
  
  // Syntax colors
  if (title.includes("Weight") || title.includes("Emphasis")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  if (title.includes("Mixing") || title.includes("Blend")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  if (title.includes("Bracket") || title.includes("Attention")) return "bg-green-500/10 text-green-400 border-green-500/30";
  if (title.includes("Step") || title.includes("Scheduling")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (title.includes("Quality") || title.includes("Enhancement")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  if (title.includes("Negative")) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (title.includes("SDXL")) return "bg-pink-500/10 text-pink-400 border-pink-500/30";
  if (title.includes("Trigger") || title.includes("Model")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

// Get simplified topic name for pills
const getTopicPillName = (title: string) => {
  // Extract the main topic from the title (before the dash)
  const match = title.match(/^([^-]+)/);
  return match ? match[1].trim() : title;
};

export default function PromptingGuides() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("resources");
  const [, setLocation] = useLocation();

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

  // Filter resources based on search
  const filteredPromptResources = useMemo(() => {
    if (!searchQuery) return PROMPT_RESOURCES;
    return PROMPT_RESOURCES.filter(
      resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredLearningResources = useMemo(() => {
    if (!searchQuery) return LEARNING_RESOURCES;
    return LEARNING_RESOURCES.filter(
      resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Icon mapping for resources
  const getResourceIcon = (icon: string | undefined) => {
    switch (icon) {
      case "book":
        return BookOpen;
      case "users":
        return Users;
      case "tool":
        return Wrench;
      case "wand":
        return Wand2;
      case "message-circle":
        return MessageCircle;
      case "play-circle":
        return PlayCircle;
      case "message-square":
        return MessageSquare;
      case "sparkles":
        return Sparkles;
      case "alert-circle":
        return AlertCircle;
      case "zap":
        return Zap;
      case "code":
        return Code;
      default:
        return ExternalLink;
    }
  };

  // Helper function to handle resource clicks
  const handleResourceClick = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.id === 'elite-generator') {
      setLocation('/tools/prompt-generator');
    } else if (resource.id === 'flux-generator') {
      setLocation('/tools/flux-generator');
    }
  };

  // Get color for learning resources
  const getLearningResourceColor = (index: number) => {
    const colors = [
      "text-blue-400",
      "text-green-400",
      "text-purple-400",
      "text-amber-400",
      "text-cyan-400"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen">
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
              <p className="text-gray-400">Master the art of AI image generation</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-gray-200 placeholder:text-gray-500"
              data-testid="input-search-guides"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
            <TabsTrigger 
              value="resources" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20"
              data-testid="tab-resources"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger 
              value="anatomy" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-teal-500/20"
              data-testid="tab-anatomy-guides"
            >
              <Palette className="h-4 w-4 mr-2" />
              Anatomy
            </TabsTrigger>
            <TabsTrigger 
              value="syntax" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20"
              data-testid="tab-syntax-guides"
            >
              <Hash className="h-4 w-4 mr-2" />
              Syntax
            </TabsTrigger>
          </TabsList>

          {/* Anatomy Tab Content */}
          <TabsContent value="anatomy" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Anatomy of a Great Prompt</h2>
                <p className="text-gray-400">Understanding the essential components that make up effective AI image prompts</p>
              </div>

              {/* Topic Pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {filteredAnatomyGuides.map((guide) => {
                  const colorClass = getTopicColor(guide.title, true);
                  return (
                    <Badge
                      key={guide.id}
                      variant="outline"
                      className={`${colorClass} border cursor-pointer hover:opacity-80 transition-opacity`}
                      data-testid={`pill-anatomy-${guide.id}`}
                      onClick={() => {
                        const element = document.getElementById(`anatomy-guide-${guide.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {getTopicPillName(guide.title)}
                    </Badge>
                  );
                })}
              </div>

              {/* All Anatomy Guides */}
              <div className="space-y-4">
                {filteredAnatomyGuides.length === 0 ? (
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardContent className="p-6">
                      <p className="text-center text-gray-400">
                        No guides found matching "{searchQuery}"
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAnatomyGuides.map((guide) => {
                    const colorClass = getTopicColor(guide.title, true);
                    const bgClass = colorClass.split(' ')[0]; // Extract bg-color class
                    const textClass = colorClass.split(' ')[1]; // Extract text-color class
                    return (
                      <Card 
                        key={guide.id} 
                        id={`anatomy-guide-${guide.id}`}
                        className={`${bgClass} border-gray-800 scroll-mt-4`} 
                        data-testid={`card-anatomy-guide-${guide.id}`}
                      >
                        <CardHeader className="border-b border-gray-800">
                          <CardTitle className={`text-xl ${textClass}`}>{guide.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div 
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: formatContent(guide.content) }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Syntax Tab Content */}
          <TabsContent value="syntax" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Stable Diffusion Syntax Guide</h2>
                <p className="text-gray-400">Master the special syntax and formatting techniques for better control</p>
              </div>

              {/* Topic Pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {filteredSyntaxGuides.map((guide) => {
                  const colorClass = getTopicColor(guide.title, false);
                  return (
                    <Badge
                      key={guide.id}
                      variant="outline"
                      className={`${colorClass} border cursor-pointer hover:opacity-80 transition-opacity`}
                      data-testid={`pill-syntax-${guide.id}`}
                      onClick={() => {
                        const element = document.getElementById(`syntax-guide-${guide.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {getTopicPillName(guide.title)}
                    </Badge>
                  );
                })}
              </div>

              {/* All Syntax Guides */}
              <div className="space-y-4">
                {filteredSyntaxGuides.length === 0 ? (
                  <Card className="bg-gray-900/30 border-gray-800">
                    <CardContent className="p-6">
                      <p className="text-center text-gray-400">
                        No guides found matching "{searchQuery}"
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSyntaxGuides.map((guide) => {
                    const colorClass = getTopicColor(guide.title, false);
                    const bgClass = colorClass.split(' ')[0]; // Extract bg-color class
                    const textClass = colorClass.split(' ')[1]; // Extract text-color class
                    return (
                      <Card 
                        key={guide.id} 
                        id={`syntax-guide-${guide.id}`}
                        className={`${bgClass} border-gray-800 scroll-mt-4`} 
                        data-testid={`card-syntax-guide-${guide.id}`}
                      >
                        <CardHeader className="border-b border-gray-800">
                          <CardTitle className={`text-xl ${textClass}`}>{guide.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div 
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: formatContent(guide.content) }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab Content */}
          <TabsContent value="resources" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Prompt Resources (2/3 width) */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="border-b border-gray-800">
                    <CardTitle className="flex items-center gap-2 text-gray-100">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Prompt Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Tutorials & Guides */}
                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider">Tutorials & Guides</h3>
                      <div className="space-y-3">
                        {filteredPromptResources.filter(r => r.category === "tutorials").map(resource => {
                          const IconComponent = getResourceIcon(resource.icon);
                          return (
                            <div 
                              key={resource.id} 
                              className="group flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all"
                              onClick={() => handleResourceClick(resource)}
                              data-testid={`resource-${resource.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-amber-500" />
                                <div>
                                  <h4 className="text-sm font-medium text-gray-200 group-hover:text-amber-400 transition-colors">{resource.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {resource.isFavorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
                                <span className="text-xs text-amber-500 group-hover:text-amber-400">View Resource →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Community Resources */}
                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider">Community Resources</h3>
                      <div className="space-y-3">
                        {filteredPromptResources.filter(r => r.category === "community").map(resource => {
                          const IconComponent = getResourceIcon(resource.icon);
                          return (
                            <div 
                              key={resource.id} 
                              className="group flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all"
                              onClick={() => handleResourceClick(resource)}
                              data-testid={`resource-${resource.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-amber-500" />
                                <div>
                                  <h4 className="text-sm font-medium text-gray-200 group-hover:text-amber-400 transition-colors">{resource.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {resource.isFavorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
                                <span className="text-xs text-amber-500 group-hover:text-amber-400">View Resource →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tools & Applications */}
                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider">Tools & Applications</h3>
                      {filteredPromptResources.filter(r => r.category === "tools").length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Wrench className="h-8 w-8 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No additional prompt tools found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredPromptResources.filter(r => r.category === "tools").map(resource => {
                            const IconComponent = getResourceIcon(resource.icon);
                            return (
                              <div 
                                key={resource.id} 
                                className="group flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all"
                                onClick={() => handleResourceClick(resource)}
                                data-testid={`resource-${resource.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-5 w-5 text-amber-500" />
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-200 group-hover:text-amber-400 transition-colors">{resource.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-amber-500 group-hover:text-amber-400">View Resource →</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Prompt Building Tools */}
                    <div>
                      <h3 className="text-sm font-semibold mb-4 text-gray-400 uppercase tracking-wider">Prompt Building Tools</h3>
                      <div className="space-y-3">
                        {filteredPromptResources.filter(r => r.category === "builders").map(resource => {
                          const IconComponent = getResourceIcon(resource.icon);
                          return (
                            <div 
                              key={resource.id} 
                              className="group flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all"
                              data-testid={`resource-${resource.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-amber-500" />
                                <div>
                                  <h4 className="text-sm font-medium text-gray-200">{resource.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {resource.isFavorite && <Heart className="h-4 w-4 text-red-500 fill-red-500" />}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                  onClick={() => handleResourceClick(resource)}
                                >
                                  Open Generator
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Learning Resources & Quick Tips (1/3 width) */}
              <div className="space-y-6">
                {/* Learning Resources */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="border-b border-gray-800">
                    <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                      <Book className="h-5 w-5 text-blue-500" />
                      Learning Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {filteredLearningResources.map((resource, index) => {
                      const IconComponent = getResourceIcon(resource.icon);
                      return (
                        <div 
                          key={resource.id} 
                          className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-all"
                          onClick={() => handleResourceClick(resource)}
                          data-testid={`learning-resource-${resource.id}`}
                        >
                          <IconComponent className={`h-4 w-4 mt-0.5 ${getLearningResourceColor(index)}`} />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors leading-tight">
                              {resource.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Quick Tips */}
                <Card className="bg-gray-900/30 border-gray-800">
                  <CardHeader className="border-b border-gray-800">
                    <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-3">
                      {QUICK_TIPS.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span className="text-sm text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}