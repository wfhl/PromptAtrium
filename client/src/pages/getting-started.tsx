import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  Wand2, 
  BookOpen, 
  Users, 
  Sparkles, 
  Lightbulb, 
  ArrowRight,
  CheckCircle,
  Rocket,
  Target,
  Heart,
  GitFork,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Layout,
  Palette,
  Library,
  FolderOpen,
  Search,
  Plus,
  Copy,
  Save,
  Shuffle,
  Zap,
  FileText,
  Settings,
  Calculator,
  Info,
  Eye,
  Layers,
  Download,
  GraduationCap,
  Image,
  Wrench
} from "lucide-react";

export default function GettingStarted() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("library");

  // Parse URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam && ["library", "codex", "tools", "resources"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newUrl = `/getting-started?tab=${value}`;
    window.history.pushState({}, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            Getting Started with PromptAtrium
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your comprehensive guide to mastering AI prompt creation, sharing, and community collaboration
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create your account or sign in</li>
                <li>Set up your profile and username</li>
                <li>Explore trending prompts for inspiration</li>
                <li>Create your first prompt</li>
                <li>Share with the community</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Your First Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">Start by creating a simple prompt:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Create" in the navigation</li>
                <li>Choose a model (e.g., Stable Diffusion)</li>
                <li>Write a descriptive prompt</li>
                <li>Adjust settings if needed</li>
                <li>Save and share!</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-500" />
                Community First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">Engage with creators:</p>
              <ul className="space-y-2 text-sm">
                <li>• Follow your favorite creators</li>
                <li>• Like and comment on prompts</li>
                <li>• Fork prompts to build on ideas</li>
                <li>• Share your creations</li>
                <li>• Join discussions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="library">Library & Community</TabsTrigger>
            <TabsTrigger value="codex">Wordsmith Codex</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Tab 1: Prompt Library & Community */}
          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="h-5 w-5" />
                  Your Prompt Library
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Library Overview</h3>
                  <p className="text-muted-foreground mb-3">
                    Your personal library is your creative workspace where all your prompts and collections live. 
                    Access it through the "My Library" navigation link to manage your prompt arsenal.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Creating and Managing Prompts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Plus className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Create New:</strong> Use the "+" button to create prompts or collections
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <strong>Collections:</strong> Group related prompts by theme, project, or style
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Search className="h-4 w-4 text-purple-500 mt-1" />
                      <div>
                        <strong>Search & Filter:</strong> Find prompts quickly with tags and categories
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Settings className="h-4 w-4 text-orange-500 mt-1" />
                      <div>
                        <strong>Organize:</strong> Edit, duplicate, or delete prompts as needed
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Working with Collections</h3>
                  <p className="text-muted-foreground mb-2">Collections help you organize prompts logically:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Public Collections:</strong> Share with the community for others to discover</li>
                    <li><strong>Private Collections:</strong> Keep personal projects and experiments private</li>
                    <li><strong>Themed Sets:</strong> Group by style (e.g., "Cyberpunk Art", "Portrait Photography")</li>
                    <li><strong>Project-Based:</strong> Organize by client work or personal projects</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Link href="/library">
                    <Button className="gap-2">
                      <Library className="h-4 w-4" />
                      Go to My Library
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Prompt Library
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Discovering Community Content</h3>
                  <p className="text-muted-foreground mb-3">
                    The Community section is where you'll find prompts shared by other creators. 
                    It's a goldmine of inspiration and learning opportunities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Trending & Featured
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Discover the most popular prompts of the week and editor's picks. 
                      These showcase exceptional creativity and technique.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4 text-blue-500" />
                      Search & Browse
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Use powerful filters to find prompts by AI model, style, category, 
                      or creator. Save time by finding exactly what you need.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Liking & Following
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Show appreciation by liking prompts and follow creators you admire. 
                      Your liked prompts are saved to your personal collection.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <GitFork className="h-4 w-4 text-purple-500" />
                      Forking & Building On Ideas
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Fork any public prompt to create your own version. Add your twist 
                      while crediting the original creator.
                    </p>
                  </div>
                </div>

                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Engagement Tip:</strong> Leave thoughtful comments and feedback. The community 
                    thrives on constructive discussion and sharing of techniques.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">Community Etiquette</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Always credit original creators when forking or adapting</li>
                    <li>• Provide constructive feedback in comments</li>
                    <li>• Mark NSFW content appropriately</li>
                    <li>• Respect others' creative work and intellectual property</li>
                    <li>• Share your own creations to contribute back to the community</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Link href="/community">
                    <Button className="gap-2">
                      <Users className="h-4 w-4" />
                      Explore Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Wordsmith Codex */}
          <TabsContent value="codex" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  What is the Wordsmith Codex?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-3">
                    The Wordsmith Codex is a comprehensive database of AI prompt components, tags, and modifiers 
                    organized by category and function. Think of it as your prompt vocabulary reference that helps 
                    you build more precise and effective prompts.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Layers className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <strong>Anatomy Groups:</strong> Terms organized by function (Subject, Style, Lighting, etc.)
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Search className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Smart Search:</strong> Find specific terms across categories quickly
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Copy className="h-4 w-4 text-purple-500 mt-1" />
                      <div>
                        <strong>Term Assembly:</strong> Click to collect terms into reusable strings
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Save className="h-4 w-4 text-orange-500 mt-1" />
                      <div>
                        <strong>Save Options:</strong> Store as presets or wildcards for future use
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link href="/codex">
                    <Button className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Open Wordsmith Codex
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Core Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Browsing and Discovery</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li><strong>Browse by Category:</strong> Click category cards to view terms in that group</li>
                    <li><strong>Anatomy Groups:</strong> Use color-coded anatomy groups to find terms by function:
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                        <li><span className="text-blue-400">Subject:</span> Characters, objects, creatures</li>
                        <li><span className="text-purple-400">Style & Medium:</span> Art styles, mediums, techniques</li>
                        <li><span className="text-green-400">Environment & Setting:</span> Locations, backgrounds</li>
                        <li><span className="text-cyan-400">Lighting:</span> Lighting conditions and effects</li>
                        <li><span className="text-orange-400">Camera & Composition:</span> Photography terms, angles</li>
                        <li><span className="text-pink-400">Color & Mood:</span> Color palettes, emotional tones</li>
                        <li><span className="text-amber-400">Details & Textures:</span> Surface qualities, materials</li>
                      </ul>
                    </li>
                    <li><strong>Search Function:</strong> Use the search bar to find specific terms across all categories</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Term Collection & Assembly</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li><strong>Click to Collect:</strong> Click any term to add it to your collection</li>
                    <li><strong>Assembly Toast:</strong> Watch your collected terms appear in the floating assembly panel</li>
                    <li><strong>Manage Collection:</strong> Remove terms, reorder, or clear all with the panel controls</li>
                    <li><strong>Preview & Edit:</strong> See your assembled string in real-time as you build it</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Assembly Management Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Shuffle className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <strong>Randomize:</strong> Shuffle the order of your collected terms for variation
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Copy className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Copy:</strong> Copy your assembled string to clipboard for use in prompts
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-purple-500 mt-1" />
                      <div>
                        <strong>Save as Preset:</strong> Store comma-separated string for reuse
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-orange-500 mt-1" />
                      <div>
                        <strong>Save as Wildcard:</strong> Store line-separated for dynamic generation
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Use anatomy groups strategically! Start with Subject terms, 
                    add Style elements, then enhance with Lighting and Details for well-structured prompts.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Saving & Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Presets vs Wildcards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Presets
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Saves terms as comma-separated strings, perfect for:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Complete prompt snippets</li>
                        <li>• Style combinations</li>
                        <li>• Technical quality terms</li>
                        <li>• Reusable prompt endings</li>
                      </ul>
                      <div className="bg-muted rounded p-2 mt-2 text-xs font-mono">
                        digital art, highly detailed, vibrant colors
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Wildcards
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Saves terms as separate lines, ideal for:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Random selection lists</li>
                        <li>• Alternative options</li>
                        <li>• Dynamic prompt generation</li>
                        <li>• Variation templates</li>
                      </ul>
                      <div className="bg-muted rounded p-2 mt-2 text-xs font-mono">
                        sunset lighting<br/>
                        golden hour<br/>
                        dramatic shadows
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Managing Saved Items</h3>
                  <p className="text-muted-foreground mb-2">
                    Access your saved presets and wildcards through the "My Saved" tab in the Codex:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>View all saved presets and wildcards in organized lists</li>
                    <li>Edit names and descriptions of saved items</li>
                    <li>Delete items you no longer need</li>
                    <li>Copy saved content directly to your clipboard</li>
                    <li>Use saved wildcards for random prompt generation</li>
                  </ul>
                </div>

                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Best Practice:</strong> Build a library of reusable components. Create presets for 
                    quality terms, style combinations, and technical settings. Use wildcards for variation lists 
                    like lighting conditions or character types.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Pro Tips & Advanced Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Strategic Term Selection</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Start with Structure:</strong> Begin with Subject terms, then layer Style, Environment, and Details</li>
                    <li><strong>Balance Specificity:</strong> Mix broad style terms with specific details for best results</li>
                    <li><strong>Consider Model Types:</strong> Some terms work better with specific AI models</li>
                    <li><strong>Use Anatomy Groups:</strong> Each color-coded group serves a specific function in prompt construction</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Combining with Manual Prompting</h3>
                  <p className="text-muted-foreground mb-2">
                    The Codex works best when combined with your creative input:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Use Codex terms for technical and style elements</li>
                    <li>Add your own creative descriptions for unique subjects</li>
                    <li>Combine multiple saved presets for complex prompts</li>
                    <li>Use wildcards to add variation to your base prompts</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Building Prompt Templates</h3>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <p className="text-green-400 mb-1">// Template Structure</p>
                    <p>[Your Subject] + [Codex Style Terms] + [Codex Environment] + [Codex Technical Quality]</p>
                    <p className="text-green-400 mt-2 mb-1">// Example</p>
                    <p>A steampunk inventor + Victorian era, brass and copper, intricate gears + industrial workshop, steam and smoke + highly detailed, 8k resolution, masterpiece</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link href="/codex">
                    <Button className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Start Using Codex
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Tools */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Available Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-500" />
                      Aspect Ratio Calculator
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Calculate perfect dimensions for your AI-generated images. Input desired width or height 
                      and get optimal ratios for different platforms and use cases.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      <li>• Common social media ratios</li>
                      <li>• Print-ready dimensions</li>
                      <li>• Custom ratio calculations</li>
                      <li>• Model-specific recommendations</li>
                    </ul>
                    <Link href="/tools/aspect-ratio-calculator">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calculator className="h-4 w-4" />
                        Open Calculator
                      </Button>
                    </Link>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4 text-green-500" />
                      Metadata Analyzer
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Extract and analyze metadata from AI-generated images. Learn from successful prompts 
                      by examining the settings and parameters used to create images.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      <li>• Extract prompt information</li>
                      <li>• Analyze generation settings</li>
                      <li>• Model and version detection</li>
                      <li>• Parameter optimization insights</li>
                    </ul>
                    <Link href="/tools/metadata-analyzer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Search className="h-4 w-4" />
                        Open Analyzer
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Coming Soon Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-purple-500/50 bg-purple-500/10">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    These powerful tools are in development and will be available soon to enhance your 
                    prompt creation workflow.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Prompt Generator
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      AI-powered prompt suggestion engine that helps you create effective prompts based on 
                      your goals, target AI model, and desired output style.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Intelligent prompt suggestions</li>
                      <li>• Model-specific optimization</li>
                      <li>• Style-based recommendations</li>
                      <li>• Quality enhancement tips</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Prompt Performance Analyzer
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Analyze the effectiveness of your prompts based on community engagement, 
                      generation success rates, and quality metrics.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Performance scoring</li>
                      <li>• Success rate tracking</li>
                      <li>• Community engagement metrics</li>
                      <li>• Improvement suggestions</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-purple-500" />
                      Batch Prompt Generator
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Generate multiple prompt variations automatically using templates, wildcards, 
                      and systematic parameter variation for efficient testing.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Template-based generation</li>
                      <li>• Wildcard expansion</li>
                      <li>• Parameter grid testing</li>
                      <li>• Export batch files</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Layout className="h-4 w-4 text-blue-500" />
                      Visual Prompt Builder
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Drag-and-drop visual interface for building complex prompts with real-time preview 
                      and intelligent component suggestions.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Visual component assembly</li>
                      <li>• Real-time preview</li>
                      <li>• Smart suggestions</li>
                      <li>• Template library integration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Resources */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Available Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Prompting Guides
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Comprehensive guides covering prompt engineering techniques, model-specific tips, 
                      and best practices for different AI platforms and use cases.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      <li>• Beginner to advanced techniques</li>
                      <li>• Model-specific strategies</li>
                      <li>• Style and genre guides</li>
                      <li>• Common troubleshooting</li>
                    </ul>
                    <Link href="/prompting-guides">
                      <Button variant="outline" size="sm" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        View Guides
                      </Button>
                    </Link>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Download className="h-4 w-4 text-green-500" />
                      Install Guide
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Step-by-step instructions for setting up AI tools, installing models, 
                      and configuring your local environment for optimal prompt testing.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      <li>• Local AI setup instructions</li>
                      <li>• Model installation guides</li>
                      <li>• Configuration optimization</li>
                      <li>• Troubleshooting help</li>
                    </ul>
                    <Link href="/install-guide">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        View Install Guide
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Coming Soon Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-purple-500/50 bg-purple-500/10">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    These comprehensive resources are being developed to provide you with everything 
                    you need to master AI prompt creation.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      AI Services Directory
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Comprehensive directory of AI services, platforms, and tools with integration guides, 
                      pricing comparisons, and feature breakdowns.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Service comparisons</li>
                      <li>• Integration tutorials</li>
                      <li>• Pricing and feature analysis</li>
                      <li>• Recommendations by use case</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-green-500" />
                      Learning Resources
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Structured learning paths, video tutorials, and interactive courses covering 
                      everything from basic prompt writing to advanced AI art techniques.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Structured learning paths</li>
                      <li>• Video tutorial library</li>
                      <li>• Interactive exercises</li>
                      <li>• Skill assessments</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Image className="h-4 w-4 text-purple-500" />
                      Asset Library
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Curated collection of reference images, style samples, and visual inspiration 
                      to help you understand and describe different artistic elements.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Reference image collections</li>
                      <li>• Style example galleries</li>
                      <li>• Lighting and composition samples</li>
                      <li>• Technical quality references</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 opacity-75">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      Community Forums
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Dedicated discussion spaces for different AI models, techniques, and use cases 
                      where creators can share knowledge and collaborate.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Model-specific discussions</li>
                      <li>• Technique sharing</li>
                      <li>• Troubleshooting support</li>
                      <li>• Collaboration opportunities</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Resource Roadmap</h3>
                  <p className="text-muted-foreground mb-3">
                    We're continuously expanding our resource library based on community needs and feedback. 
                    Here's what's coming in the near future:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Advanced prompt engineering masterclass series</li>
                    <li>• Model-specific optimization guides</li>
                    <li>• Industry use case studies and templates</li>
                    <li>• API documentation and integration examples</li>
                    <li>• Mobile app with offline access to guides</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Getting Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Support Channels</h3>
                  <p className="text-muted-foreground mb-3">
                    Need help with PromptAtrium? Here's how to get support and connect with the community:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Community Help:</strong> Ask questions in prompt comments and discussions</li>
                    <li>• <strong>Feature Requests:</strong> Share ideas and suggestions through user feedback</li>
                    <li>• <strong>Bug Reports:</strong> Report issues through the help system</li>
                    <li>• <strong>Learning Support:</strong> Follow creators and learn from their techniques</li>
                  </ul>
                </div>

                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip:</strong> The community is your best resource! Don't hesitate to ask questions, 
                    share your work, and learn from others. Everyone started as a beginner.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Creating?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our community of AI artists and prompt engineers. Start creating, sharing, 
              and discovering amazing prompts today!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Your First Prompt
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Explore Community
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}