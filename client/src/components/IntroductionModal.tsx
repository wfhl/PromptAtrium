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
import { Loader2, CheckCircle, XCircle, User, Globe, Lock, Calendar, Link2 } from "lucide-react";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

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
  const [currentTab, setCurrentTab] = useState("basic");

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

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to PromptAtrium!</DialogTitle>
          <DialogDescription>
            Let's set up your profile. Only your username is required - you can fill in the rest later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Info
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

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Username <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            placeholder="johndoe" 
                            className={usernameAvailable === false ? "pr-10 border-red-500" : usernameAvailable === true ? "pr-10 border-green-500" : "pr-10"}
                            data-testid="input-intro-username"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {isCheckingUsername && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {!isCheckingUsername && usernameAvailable === true && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {!isCheckingUsername && usernameAvailable === false && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      {usernameMessage && (
                        <p className={`text-sm ${usernameAvailable ? "text-green-600" : "text-red-600"}`}>
                          {usernameMessage}
                        </p>
                      )}
                      <FormDescription>
                        This will be your unique identifier on PromptAtrium
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          className="min-h-[100px]"
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
                Skip for now
              </Button>
              <Button 
                type="submit" 
                disabled={!canSubmit || updateProfileMutation.isPending}
                data-testid="button-intro-complete"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}