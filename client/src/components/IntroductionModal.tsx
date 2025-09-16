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

// Profile form schema
const introSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  birthday: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  twitterHandle: z.string().optional(),
  githubHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
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
  const [currentTab, setCurrentTab] = useState("guide");

  const form = useForm<IntroFormData>({
    resolver: zodResolver(introSchema),
    defaultValues: {
      username: "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: "",
      birthday: "",
      website: "",
      twitterHandle: "",
      githubHandle: "",
      linkedinHandle: "",
      instagramHandle: "",
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
        birthday: data.birthday ? new Date(data.birthday) : null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => {
        // Only prevent closing on outside click if user doesn't have a username
        if (!canClose) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to PromptAtrium!</DialogTitle>
          <DialogDescription>
            Your AI prompt creation and community hub. Let's get you started!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="guide" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Getting Started
                </TabsTrigger>
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Setup
                </TabsTrigger>
                <TabsTrigger value="social" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Social Links
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="space-y-4 mt-4">
                <div className="space-y-6">
                  {/* Username Section - Required */}
                  <Alert className="border-purple-500 bg-purple-500/10">
                    <AlertCircle className="h-4 w-4 text-purple-500" />
                    <AlertDescription className="text-sm">
                      <strong className="text-purple-400">First things first:</strong> Choose a unique username to get started. This is the only required field!
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="border-2 border-purple-500/50 rounded-lg p-4 bg-purple-500/5">
                        <FormLabel className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          Choose Your Username <span className="text-red-500 text-xl">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="Enter a unique username" 
                              className={`text-lg py-6 ${usernameAvailable === false ? "pr-10 border-red-500" : usernameAvailable === true ? "pr-10 border-green-500" : "pr-10 border-purple-500/50"}`}
                              data-testid="input-intro-username"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isCheckingUsername && (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              )}
                              {!isCheckingUsername && usernameAvailable === true && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              {!isCheckingUsername && usernameAvailable === false && (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        </FormControl>
                        {usernameMessage && (
                          <p className={`text-sm mt-2 font-medium ${usernameAvailable ? "text-green-600" : "text-red-600"}`}>
                            {usernameMessage}
                          </p>
                        )}
                        <FormDescription className="text-sm mt-2">
                          This will be your unique identifier on PromptAtrium. Choose wisely - it cannot be changed later!
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* App Introduction */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Wand2 className="h-5 w-5 text-blue-500" />
                          Creating Prompts & Collections
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-300">
                        <p><strong>Prompts:</strong> Create and save your AI generation prompts with model settings, negative prompts, and generated images.</p>
                        <p><strong>Collections:</strong> Organize related prompts into themed collections for easy access and sharing.</p>
                        <p>Use our Prompt Builder tool for guided creation or write directly in the editor!</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="h-5 w-5 text-green-500" />
                          Community Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-300">
                        <p><strong>Explore:</strong> Discover prompts from other creators, sorted by popularity, recent, or categories.</p>
                        <p><strong>Follow:</strong> Follow creators whose style you love to see their latest work.</p>
                        <p><strong>Engage:</strong> Like and comment on prompts to show appreciation and provide feedback.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Bookmark className="h-5 w-5 text-purple-500" />
                          Bookmarks & Forks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-300">
                        <p><strong>Bookmark:</strong> Save prompts you love to your personal library for quick access later.</p>
                        <p><strong>Fork:</strong> Create your own version of any public prompt, customizing it while crediting the original creator.</p>
                        <p>Build your inspiration library and iterate on community ideas!</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          Resources & Tools
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-300">
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
                      <strong>Ready to start?</strong> Enter your username above and click "Start Creating" to begin your journey, or explore the other tabs to complete your profile.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <Alert className="border-amber-500/50 bg-amber-500/10 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> You've already set your username. Update your profile details below or skip to explore the app!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                          <Input {...field} type="date" data-testid="input-intro-birthday" />
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
                <div className="grid grid-cols-2 gap-4">
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

                
                </div>
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

            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => {
                  // Skip for now - just submit with username only
                  if (username && usernameAvailable) {
                    onSubmit(form.getValues());
                  }
                }}
                disabled={!username || !usernameAvailable || updateProfileMutation.isPending}
                data-testid="button-intro-skip"
              >
                Skip Profile Setup
              </Button>
              <Button 
                type="submit" 
                disabled={!canSubmit || updateProfileMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}