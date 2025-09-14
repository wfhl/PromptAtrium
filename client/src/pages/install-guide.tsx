import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Chrome, 
  Download,
  Home,
  Share2,
  Plus,
  MoreVertical,
  Bookmark,
  ExternalLink,
  Info,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

export default function InstallGuide() {
  const installablePages = [
    {
      name: "Main App",
      path: "/",
      description: "Full PromptAtrium experience with all features"
    },
    {
      name: "Aspect Ratio Calculator",
      path: "/tools/aspect-ratio-calculator",
      description: "Quick access to aspect ratio calculations"
    },
    {
      name: "Metadata Analyzer",
      path: "/tools/metadata-analyzer",
      description: "Extract prompts from AI-generated images"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Install PromptAtrium Apps</CardTitle>
          <CardDescription className="text-lg">
            Save PromptAtrium and its tools to your home screen for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Progressive Web App (PWA)</AlertTitle>
            <AlertDescription>
              PromptAtrium works as a Progressive Web App. You can install it on any device 
              for a native app-like experience with offline capabilities and instant access.
            </AlertDescription>
          </Alert>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Available Apps</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {installablePages.map((page) => (
                <Card key={page.path} className="border-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{page.name}</CardTitle>
                      <Link href={page.path}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{page.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                      <span>Ready to install</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">iOS (iPhone/iPad)</span>
                <span className="sm:hidden">iOS</span>
              </TabsTrigger>
              <TabsTrigger value="android" className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                <span className="hidden sm:inline">Android</span>
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Desktop</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Install on iOS (Safari)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You must use Safari browser on iOS to install web apps. Chrome and other browsers don't support this feature on iOS.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Open the page in Safari</p>
                        <p className="text-sm text-muted-foreground">
                          Navigate to the specific tool or main app page you want to install
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground">
                          Look for the <Share2 className="inline h-3 w-3" /> share icon in the Safari toolbar (bottom on iPhone, top on iPad)
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Select "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground">
                          Scroll down in the share menu and tap <Plus className="inline h-3 w-3" /> "Add to Home Screen"
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Name your app and tap "Add"</p>
                        <p className="text-sm text-muted-foreground">
                          You can customize the name or keep the default. The app icon will appear on your home screen
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Each tool page saves as its own app with a direct link to that specific feature!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="android" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tablet className="h-5 w-5" />
                    Install on Android (Chrome)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Open the page in Chrome</p>
                        <p className="text-sm text-muted-foreground">
                          Navigate to the specific tool or main app page you want to install
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Tap the menu button</p>
                        <p className="text-sm text-muted-foreground">
                          Tap the three dots <MoreVertical className="inline h-3 w-3" /> menu in the top right corner
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Select "Add to Home screen" or "Install app"</p>
                        <p className="text-sm text-muted-foreground">
                          You may see either option depending on your Chrome version
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-1">Confirm installation</p>
                        <p className="text-sm text-muted-foreground">
                          Name your app and tap "Add" or "Install". The app will appear on your home screen and app drawer
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Chrome may also show an install prompt banner at the bottom of the screen on supported pages
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Android gives you the full PWA experience with offline support and app-like behavior!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="desktop" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Install on Desktop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="chrome" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chrome">Chrome/Edge</TabsTrigger>
                      <TabsTrigger value="other">Safari/Firefox</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chrome" className="mt-4 space-y-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            1
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-1">Look for the install icon</p>
                            <p className="text-sm text-muted-foreground">
                              In the address bar, look for the <Download className="inline h-3 w-3" /> install icon on the right side
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            2
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-1">Click "Install"</p>
                            <p className="text-sm text-muted-foreground">
                              Click the install button and confirm in the dialog that appears
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            3
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-1">Launch from desktop or dock</p>
                            <p className="text-sm text-muted-foreground">
                              The app will be added to your desktop and can be launched like any native application
                            </p>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Alternative: Use the menu (⋮) → "Save and share" → "Install [App Name]..."
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="other" className="mt-4 space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Limited PWA Support</AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                          <p>Safari and Firefox have limited PWA support on desktop:</p>
                          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                            <li><strong>Safari (macOS):</strong> Add to Dock via Share menu, but limited offline features</li>
                            <li><strong>Firefox:</strong> No native PWA install, but you can bookmark or add to home screen on mobile</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <p className="font-medium">Alternative: Create a bookmark</p>
                        <div className="flex gap-3">
                          <Bookmark className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 text-xs border rounded">Ctrl/Cmd + D</kbd> to bookmark any page for quick access
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-8 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Benefits of Installing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Home className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Direct Access</p>
                    <p className="text-sm text-muted-foreground">Launch directly from your home screen or desktop</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Tool-Specific Shortcuts</p>
                    <p className="text-sm text-muted-foreground">Each tool saves as its own app with direct links</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Chrome className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Native Experience</p>
                    <p className="text-sm text-muted-foreground">Runs in its own window without browser UI</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}