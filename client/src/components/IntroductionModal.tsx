import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, User, Globe, Lock, Calendar, Link2, BookOpen, Sparkles, Users, Bookmark, GitFork, Folder, Wand2, Lightbulb, AlertCircle } from "lucide-react";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Profile form schema
const introSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  birthday: z.date().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  twitterHandle: z.string().optional(),
  githubHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  redditHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  profileVisibility: z.enum(["public", "private"]).default("public"),
  emailVisibility: z.boolean().default(false),
  showStats: z.boolean().default(true),
  showBirthday: z.boolean().default(false),
  showNsfw: z.boolean().default(true),
});

type IntroFormData = z.infer<typeof introSchema>;

interface IntroductionModalProps {
  open: boolean;
  onComplete: () => void;
  user: any;
}

export function IntroductionModal({ open, onComplete, user }: IntroductionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [currentTab, setCurrentTab] = useState("basic");

  const form = useForm<IntroFormData>({
    resolver: zodResolver(introSchema),
    defaultValues: {
      username: "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: "",
      birthday: user?.birthday ? new Date(user.birthday) : undefined,
      website: "",
      twitterHandle: "",
      githubHandle: "",
      linkedinHandle: "",
      instagramHandle: "",
      redditHandle: "",
      tiktokHandle: "",
      profileVisibility: "public",
      emailVisibility: false,
      showStats: true,
      showBirthday: false,
      showNsfw: true,
    },
  });

  const username = form.watch("username");

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/check-username/${username}`);
        const data = await response.json();
        setUsernameAvailable(data.available);
        setUsernameMessage(data.message);
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameMessage("Error checking username availability");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [username]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: IntroFormData) => {
      const profileData = {
        ...data,
        birthday: data.birthday || null,
        hasCompletedIntro: true, // Mark intro as completed
      };
      const response = await apiRequest("PUT", "/api/profile", profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to PromptAtrium!",
        description: "Your profile has been set up successfully.",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IntroFormData) => {
    if (!usernameAvailable) {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(data);
  };

  const canSubmit = form.formState.isValid && usernameAvailable && !isCheckingUsername;
  
  // Tab navigation
  const tabs = ['basic', 'guide', 'social', 'installation', 'privacy-policy', 'terms'];
  const currentTabIndex = tabs.indexOf(currentTab);
  const isLastTab = currentTabIndex === tabs.length - 1;
  const isFirstTab = currentTabIndex === 0;
  
  const handleNextTab = () => {
    if (!isLastTab) {
      setCurrentTab(tabs[currentTabIndex + 1]);
    }
  };
  
  const handlePrevTab = () => {
    if (!isFirstTab) {
      setCurrentTab(tabs[currentTabIndex - 1]);
    }
  };

  // Allow closing the modal if user already has a username
  const canClose = user?.username ? true : false;
  
  const handleOpenChange = (newOpen: boolean) => {
    // Allow closing if user already has a username or if they're trying to complete the setup
    if (!newOpen && canClose) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onPointerDownOutside={(e) => {
        // Only prevent closing on outside click if user doesn't have a username
        if (!canClose) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Welcome to PromptAtrium!</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Your AI prompt creation and community hub. Let's get you started!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                <TabsTrigger value="basic" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Profile Setup</span>
                  <span className="sm:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="guide" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Getting Started</span>
                  <span className="sm:hidden">Start</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Link2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Social Links</span>
                  <span className="sm:hidden">Social</span>
                </TabsTrigger>
                <TabsTrigger value="installation" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Globe className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Installation</span>
                  <span className="sm:hidden">Install</span>
                </TabsTrigger>
                <TabsTrigger value="privacy-policy" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Lock className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Privacy Policy</span>
                  <span className="sm:hidden">Privacy</span>
                </TabsTrigger>
                <TabsTrigger value="terms" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Terms</span>
                  <span className="sm:hidden">Terms</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="space-y-4 mt-4">
                <div className="space-y-6">
                  {/* App Introduction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                          Creating Prompts & Collections
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm text-gray-300 p-3 sm:p-4 pt-0 sm:pt-0">
                        <p><strong>Prompts:</strong> Create and save your AI generation prompts with model settings, negative prompts, and generated images.</p>
                        <p><strong>Collections:</strong> Organize related prompts into themed collections for easy access and sharing.</p>
                        <p>Use our Prompt Builder tool for guided creation or write directly in the editor!</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          Community Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm text-gray-300 p-3 sm:p-4 pt-0 sm:pt-0">
                        <p><strong>Explore:</strong> Discover prompts from other creators, sorted by popularity, recent, or categories.</p>
                        <p><strong>Follow:</strong> Follow creators whose style you love to see their latest work.</p>
                        <p><strong>Engage:</strong> Like and comment on prompts to show appreciation and provide feedback.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                          Bookmarks & Branches
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm text-gray-300 p-3 sm:p-4 pt-0 sm:pt-0">
                        <p><strong>Bookmark:</strong> Save prompts you love to your personal library for quick access later.</p>
                        <p><strong>Branch:</strong> Create your own version of any public prompt, customizing it while crediting the original creator.</p>
                        <p>Build your inspiration library and iterate on community ideas!</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                          Resources & Tools
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm text-gray-300 p-3 sm:p-4 pt-0 sm:pt-0">
                        <p><strong>Prompt Generator:</strong> AI-powered tool to create complex prompts from simple ideas.</p>
                        <p><strong>Flux Generator:</strong> Specialized tool for Flux model prompting.</p>
                        <p><strong>Guides:</strong> Comprehensive tutorials on prompt anatomy, syntax, and best practices.</p>
                        <p><strong>Model Info:</strong> Detailed information about different AI models and their capabilities.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-sm">
                      <strong>Welcome to PromptAtrium!</strong> This guide will help you understand the platform's features and capabilities. Click "Next Page" to continue setting up your profile.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Username Section - Required */}
                <Alert className="border-purple-500 bg-purple-500/10">
                  <AlertCircle className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-sm">
                    <strong className="text-purple-400">Required:</strong> Choose a unique username to get started. You can fill in other profile details later.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="border-2 border-purple-500/50 rounded-lg p-4 bg-purple-500/5">
                      <FormLabel className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                        Choose Your Username <span className="text-red-500 text-lg md:text-xl">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="Enter a unique username" 
                            className={`text-base md:text-lg py-4 md:py-6 ${usernameAvailable === false ? "pr-10 border-red-500" : usernameAvailable === true ? "pr-10 border-green-500" : "pr-10 border-purple-500/50"}`}
                            data-testid="input-intro-username"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingUsername && (
                              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-muted-foreground" />
                            )}
                            {!isCheckingUsername && usernameAvailable === true && (
                              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                            )}
                            {!isCheckingUsername && usernameAvailable === false && (
                              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      {usernameMessage && (
                        <p className={`text-xs md:text-sm mt-2 font-medium ${usernameAvailable ? "text-green-600" : "text-red-600"}`}>
                          {usernameMessage}
                        </p>
                      )}
                      <FormDescription className="text-xs md:text-sm mt-2">
                        This will be your unique identifier on PromptAtrium. Choose wisely - it cannot be changed later!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" data-testid="input-intro-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" data-testid="input-intro-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px] bg-black"
                          data-testid="textarea-intro-bio"
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description about yourself ({field.value?.length || 0}/500)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Birthday
                        </FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="input-intro-birthday"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Globe className="inline h-4 w-4 mr-2" />
                          Website
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" data-testid="input-intro-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@username" data-testid="input-intro-instagram" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitterHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter/X</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@username" data-testid="input-intro-twitter" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="githubHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="username" data-testid="input-intro-github" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="in/username" data-testid="input-intro-linkedin" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redditHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reddit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="u/username" data-testid="input-intro-reddit" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiktokHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@username" data-testid="input-intro-tiktok" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                
                </div>
              </TabsContent>

              <TabsContent value="installation" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        Installing PromptAtrium
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-0">
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription>
                          Install PromptAtrium as a PWA (Progressive Web App) for quick access and an app-like experience! 
                          <a 
                            href="https://web.dev/progressive-web-apps/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline text-green-400 ml-1"
                          >
                            Learn more about PWAs
                          </a>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">
                            Desktop (Chrome/Edge):
                            <a 
                              href="https://support.google.com/chrome/answer/9658361" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 ml-2 text-xs font-normal underline"
                            >
                              Official Guide
                            </a>
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-gray-300">
                            <li>Click the install icon in your browser's address bar</li>
                            <li>Or go to Settings → Apps → Install this site as an app</li>
                            <li>Click "Install" when prompted</li>
                          </ol>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">
                            Mobile (iOS):
                            <a 
                              href="https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 ml-2 text-xs font-normal underline"
                            >
                              Safari Guide
                            </a>
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-gray-300">
                            <li>Open PromptAtrium in Safari</li>
                            <li>Tap the Share button</li>
                            <li>Scroll down and tap "Add to Home Screen"</li>
                            <li>Tap "Add" to confirm</li>
                          </ol>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">
                            Mobile (Android):
                            <a 
                              href="https://support.google.com/chrome/answer/9658361#zippy=%2Candroid" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 ml-2 text-xs font-normal underline"
                            >
                              Chrome Guide
                            </a>
                          </h4>
                          <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-gray-300">
                            <li>Open PromptAtrium in Chrome</li>
                            <li>Tap the menu button (three dots)</li>
                            <li>Tap "Install app" or "Add to Home screen"</li>
                            <li>Tap "Install" to confirm</li>
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="privacy-policy" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      Privacy Policy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 pt-0">
                    <div className="text-xs sm:text-sm text-gray-300 space-y-3">
                      <p><strong>Data Collection:</strong> We collect minimal personal information necessary for providing our services, including your email, username, and profile information you choose to share.</p>
                      
                      <p><strong>Data Usage:</strong> Your data is used solely to provide and improve PromptAtrium's services. We never sell your personal information to third parties.</p>
                      
                      <p><strong>Content Ownership:</strong> You retain full ownership of all prompts and content you create. Public prompts may be viewed by other users as part of the community features.</p>
                      
                      <p><strong>Security:</strong> We implement industry-standard security measures to protect your data. All communications are encrypted using HTTPS.</p>
                      
                      <p><strong>Cookies:</strong> We use essential cookies for authentication and user preferences. No tracking cookies are used without your consent.</p>
                      
                      <p><strong>Your Rights:</strong> You can request to view, export, or delete your data at any time through your account settings.</p>
                      
                      <p><strong>Updates:</strong> We may update this policy occasionally. You'll be notified of significant changes via email or platform notifications.</p>
                    </div>
                    
                    <Alert className="border-blue-500/50 bg-blue-500/10">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-xs sm:text-sm">
                        For the full privacy policy, visit <a href="/privacy-policy" className="underline text-blue-400">Privacy Policy page</a>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      Terms & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 pt-0">
                    <div className="text-xs sm:text-sm text-gray-300 space-y-3">
                      <p><strong>Acceptance:</strong> By using PromptAtrium, you agree to these terms. If you disagree with any part, please discontinue use of our services.</p>
                      
                      <p><strong>Account Responsibility:</strong> You're responsible for maintaining the security of your account and all activities under your account.</p>
                      
                      <p><strong>Content Guidelines:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>No illegal, harmful, or offensive content</li>
                        <li>Respect intellectual property rights</li>
                        <li>No spam or misleading information</li>
                        <li>Mark NSFW content appropriately</li>
                      </ul>
                      
                      <p><strong>Service Availability:</strong> We strive for 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance.</p>
                      
                      <p><strong>Intellectual Property:</strong> Content you create remains yours. By sharing publicly, you grant us a license to display it within the platform.</p>
                      
                      <p><strong>Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful behavior.</p>
                      
                      <p><strong>Limitation of Liability:</strong> PromptAtrium is provided "as is" without warranties. We're not liable for any indirect damages from using our service.</p>
                    </div>
                    
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-xs sm:text-sm">
                        For complete terms and conditions, visit <a href="/terms" className="underline text-amber-400">Terms & Conditions page</a>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <FormField
                      control={form.control}
                      name="profileVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Visibility</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-intro-visibility">
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Control who can see your profile
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailVisibility"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Show Email</FormLabel>
                            <FormDescription>
                              Display your email on your public profile
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-intro-email"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showStats"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Show Statistics</FormLabel>
                            <FormDescription>
                              Display your prompt statistics on your profile
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-intro-stats"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showBirthday"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Show Birthday</FormLabel>
                            <FormDescription>
                              Display your birthday on your public profile
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-intro-birthday"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showNsfw"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Show NSFW Content</FormLabel>
                            <FormDescription>
                              Display NSFW prompts in your feed
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-intro-nsfw"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
              {/* Left side - Skip button */}
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  // Skip introduction - just submit with username only
                  if (username && usernameAvailable) {
                    onSubmit(form.getValues());
                  }
                }}
                disabled={!username || !usernameAvailable || updateProfileMutation.isPending}
                data-testid="button-intro-skip"
                className="w-full sm:w-auto"
              >
                Skip Introduction
              </Button>
              
              {/* Right side - Navigation buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                {!isFirstTab && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevTab}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 sm:flex-initial"
                  >
                    Previous
                  </Button>
                )}
                
                {!isLastTab ? (
                  <Button
                    type="button"
                    onClick={handleNextTab}
                    disabled={currentTab === 'basic' && (!username || !usernameAvailable)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 flex-1 sm:flex-initial"
                    data-testid="button-intro-next"
                  >
                    Next Page
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={!canSubmit || updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 flex-1 sm:flex-initial"
                    data-testid="button-intro-complete"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Creating
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}