import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
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
  Palette
} from "lucide-react";

export default function GettingStarted() {
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
        <Tabs defaultValue="basics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="prompting">Prompting</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Platform Basics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">What is PromptAtrium?</h3>
                  <p className="text-muted-foreground">
                    PromptAtrium is a comprehensive platform for creating, sharing, and discovering AI prompts. 
                    Whether you're working with Stable Diffusion, DALL-E, Midjourney, or other AI models, 
                    we provide the tools and community to help you excel.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Prompt Builder:</strong> Visual tools to construct complex prompts
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Collections:</strong> Organize prompts into themed sets
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Version Control:</strong> Track changes and iterations
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <strong>Community Hub:</strong> Share and discover prompts
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Navigation</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Home/Dashboard:</strong> Your personalized feed and quick stats</li>
                    <li><strong>Library:</strong> All your saved prompts and collections</li>
                    <li><strong>Community:</strong> Explore trending and recent prompts from others</li>
                    <li><strong>Create:</strong> Access the prompt builder and tools</li>
                    <li><strong>Profile:</strong> Manage your account and settings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Creating Your First Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-purple-500/50 bg-purple-500/10">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Start simple! Begin with basic descriptions and gradually add style, 
                    lighting, and technical details as you learn what works.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">Basic Prompt Structure</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <p className="text-green-400">// Subject</p>
                    <p>A majestic dragon</p>
                    <p className="text-green-400 mt-2">// Style</p>
                    <p>digital art, fantasy illustration</p>
                    <p className="text-green-400 mt-2">// Details</p>
                    <p>scales shimmering with iridescent colors, breathing fire</p>
                    <p className="text-green-400 mt-2">// Quality</p>
                    <p>highly detailed, 8k resolution, masterpiece</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Using the Prompt Builder</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Create page</li>
                    <li>Select your target AI model (e.g., Stable Diffusion XL)</li>
                    <li>Use the category buttons to add elements:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li>Subject, Style, Lighting, Camera, Colors</li>
                      </ul>
                    </li>
                    <li>Fine-tune with the manual editor</li>
                    <li>Add negative prompts to exclude unwanted elements</li>
                    <li>Configure model settings (steps, CFG scale, etc.)</li>
                    <li>Save your prompt with a descriptive title</li>
                  </ol>
                </div>

                <div className="flex gap-4">
                  <Link href="/create">
                    <Button className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Start Creating
                    </Button>
                  </Link>
                  <Link href="/prompting-guides">
                    <Button variant="outline" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      View Guides
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Liking & Supporting
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Show appreciation for great prompts by liking them. This helps creators 
                      know what resonates and helps surface quality content.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <GitFork className="h-4 w-4 text-blue-500" />
                      Forking Prompts
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Build on existing ideas by forking prompts. This creates your own version 
                      while crediting the original creator.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-purple-500" />
                      Bookmarking
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Save prompts you want to reference later. Your bookmarks are private 
                      and accessible from your library.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      Comments & Discussion
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Engage with creators through comments. Ask questions, provide feedback, 
                      or share your results.
                    </p>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Community Guidelines:</strong> Be respectful, provide constructive feedback, 
                    credit original creators when forking, and mark NSFW content appropriately.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">Following Creators</h3>
                  <p className="text-muted-foreground mb-3">
                    Follow creators whose style you admire to see their latest work in your feed. 
                    Building connections helps foster a creative community.
                  </p>
                  <Link href="/community">
                    <Button variant="outline" className="gap-2">
                      <Users className="h-4 w-4" />
                      Explore Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Collections</h3>
                  <p className="text-muted-foreground mb-2">
                    Organize related prompts into collections. Perfect for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Themed prompt sets (e.g., "Cyberpunk Characters")</li>
                    <li>Style experiments</li>
                    <li>Client projects</li>
                    <li>Learning resources</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prompt Variables & Wildcards</h3>
                  <p className="text-muted-foreground mb-2">
                    Use variables and wildcards for dynamic prompt generation:
                  </p>
                  <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                    <p>{`{character} in {setting}, {mood} lighting`}</p>
                    <p className="text-green-400 mt-2">// Becomes:</p>
                    <p>warrior in ancient temple, dramatic lighting</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Model-Specific Optimization</h3>
                  <p className="text-muted-foreground">
                    Different AI models respond better to different prompt styles:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li><strong>Stable Diffusion:</strong> Detailed descriptions, artistic styles</li>
                    <li><strong>Midjourney:</strong> Artistic references, aspect ratios, parameters</li>
                    <li><strong>DALL-E:</strong> Natural language, clear descriptions</li>
                    <li><strong>Flux:</strong> Technical precision, structured formatting</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">API Integration</h3>
                  <p className="text-muted-foreground">
                    Coming soon: API access to integrate PromptAtrium with your workflow, 
                    enabling automated prompt management and generation.
                  </p>
                </div>
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