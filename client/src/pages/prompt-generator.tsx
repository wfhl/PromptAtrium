import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  Info,
  BookOpen,
  Sparkles,
  FileText,
  Settings,
  History,
  Download,
  Upload,
  HelpCircle,
} from "lucide-react";
import { PromptGeneratorUI } from "@/components/prompt-generator/PromptGeneratorUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

export default function PromptGeneratorPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generator");

  // Save prompt to library mutation
  const savePromptMutation = useMutation({
    mutationFn: async (promptData: any) => {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save prompt");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Prompt saved",
        description: "Your prompt has been saved to your library",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save prompt to library",
        variant: "destructive",
      });
    },
  });

  const handleSaveToLibrary = async (promptData: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save prompts to your library",
        variant: "destructive",
      });
      return;
    }
    
    await savePromptMutation.mutateAsync(promptData);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prompt Generator</h1>
              <p className="text-muted-foreground">
                Create professional AI prompts with intelligent templates and components
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Elite Generator v2.0
            </Badge>
            {isAuthenticated && (
              <Badge variant="outline" className="px-3 py-1">
                <History className="h-3 w-3 mr-1" />
                Pro Features Enabled
              </Badge>
            )}
          </div>
        </div>

        {/* Info Alert */}
        {!isAuthenticated && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Sign in to save prompts, access generation history, and unlock premium templates.
              </span>
              <Link href="/invite">
                <Button size="sm" variant="outline" className="ml-4">
                  Sign In
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Generator</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guide</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <PromptGeneratorUI
            onSaveToLibrary={handleSaveToLibrary}
            showHistory={isAuthenticated}
            showAdvancedSettings={true}
          />
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Prompt Generator</CardTitle>
              <CardDescription>
                Learn how to create effective prompts for AI image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. Choose a Template</h3>
                  <p className="text-muted-foreground mb-4">
                    Templates provide structured formats optimized for different types of images:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Standard:</strong> Balanced format for general use</li>
                    <li><strong>Cinematic:</strong> Film-like compositions with dramatic lighting</li>
                    <li><strong>Portrait:</strong> Focused on character details and expressions</li>
                    <li><strong>Landscape:</strong> Environmental and scenic compositions</li>
                    <li><strong>Artistic:</strong> Creative and experimental styles</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Define Your Subject</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter a clear description of your main subject. Be specific but concise:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">✓ Good Examples:</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                        <li>"A majestic dragon perched on a cliff"</li>
                        <li>"Cyberpunk city at night"</li>
                        <li>"Portrait of a wise elderly wizard"</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">✗ Avoid:</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                        <li>"Something cool"</li>
                        <li>"Nice picture"</li>
                        <li>Overly complex descriptions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Select Components</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the component selector to add specific elements to your prompt:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: <Settings className="h-4 w-4" />, label: "Art Style", desc: "Digital, Oil, Watercolor" },
                      { icon: <Sparkles className="h-4 w-4" />, label: "Lighting", desc: "Dramatic, Soft, Neon" },
                      { icon: <FileText className="h-4 w-4" />, label: "Composition", desc: "Rule of thirds, Centered" },
                      { icon: <Wand2 className="h-4 w-4" />, label: "Mood", desc: "Mysterious, Cheerful, Dark" },
                    ].map((item, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {item.icon}
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">4. Advanced Settings</h3>
                  <p className="text-muted-foreground">
                    Fine-tune your generation with advanced options:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                    <li><strong>Randomization:</strong> Add variety to your prompts</li>
                    <li><strong>Negative Prompts:</strong> Specify what to avoid</li>
                    <li><strong>Seed:</strong> Reproduce consistent results</li>
                    <li><strong>Quality Presets:</strong> Apply professional quality modifiers</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">5. Generate and Save</h3>
                  <p className="text-muted-foreground">
                    Click Generate to create your prompt. You can then:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                    <li>Copy prompts in multiple formats</li>
                    <li>Save to your library (requires sign-in)</li>
                    <li>View generation history</li>
                    <li>Export prompts for external use</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-1">What models are supported?</p>
                  <p className="text-sm text-muted-foreground">
                    The generator supports MidJourney, DALL-E 3, Stable Diffusion, and more.
                    Each format is optimized for its specific model.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Can I create custom templates?</p>
                  <p className="text-sm text-muted-foreground">
                    Yes! Click the + button in the template selector to create your own
                    custom templates with variables.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">How do I use negative prompts?</p>
                  <p className="text-sm text-muted-foreground">
                    Enable negative prompts in advanced settings. They tell the AI what
                    to avoid in the generation.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">What's the seed for?</p>
                  <p className="text-sm text-muted-foreground">
                    Seeds provide deterministic randomization. Using the same seed
                    will produce the same random selections.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips for Better Prompts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Badge className="h-6 w-6 p-1 rounded-full">1</Badge>
                  <div>
                    <p className="font-medium text-sm mb-1">Be Specific</p>
                    <p className="text-sm text-muted-foreground">
                      Instead of "a tree", try "an ancient oak tree with twisted branches"
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 w-6 p-1 rounded-full">2</Badge>
                  <div>
                    <p className="font-medium text-sm mb-1">Layer Your Details</p>
                    <p className="text-sm text-muted-foreground">
                      Start with the subject, then add style, lighting, and mood
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 w-6 p-1 rounded-full">3</Badge>
                  <div>
                    <p className="font-medium text-sm mb-1">Use Quality Modifiers</p>
                    <p className="text-sm text-muted-foreground">
                      Terms like "highly detailed", "8K", "masterpiece" improve quality
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 w-6 p-1 rounded-full">4</Badge>
                  <div>
                    <p className="font-medium text-sm mb-1">Reference Artists</p>
                    <p className="text-sm text-muted-foreground">
                      "In the style of [artist]" can guide the aesthetic direction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl + G</kbd>
                    <span className="text-muted-foreground">Generate Prompt</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl + C</kbd>
                    <span className="text-muted-foreground">Copy Current Prompt</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl + S</kbd>
                    <span className="text-muted-foreground">Save to Library</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded">Ctrl + R</kbd>
                    <span className="text-muted-foreground">Reset Settings</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/prompting-guides">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Prompting Guides
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Community Prompts
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download Templates (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Templates (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}