import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Plus, ChevronDown, Crown, LogOut, Moon, Sun, User as UserIcon, Eye, Menu, X, Settings, FolderPlus, FileUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PromptModal } from "@/components/PromptModal";
import { BulkImportModal } from "@/components/BulkImportModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Collection } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
  onCreatePrompt?: () => void;
}

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export function Layout({ children, onCreatePrompt }: LayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const typedUser = user as User;
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });
  
  // Modal states
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

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

  // Fetch user collections for the import modal
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Collection form
  const createCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Collection creation mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      return await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      createCollectionForm.reset();
      setCreateCollectionModalOpen(false);
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const handleCreatePrompt = () => {
    setPromptModalOpen(true);
  };

  const handleCreateCollection = () => {
    setCreateCollectionModalOpen(true);
  };

  const handleImportPrompts = () => {
    setBulkImportModalOpen(true);
  };

  const onCreateCollectionSubmit = (data: CollectionFormData) => {
    createCollectionMutation.mutate(data);
  };

  // Helper function to determine if a nav link is active
  const isActiveRoute = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/ATRIUM2 090725.png" 
            alt="PromptAtrium Logo" 
            className="w-8 h-8 object-contain mx-auto mb-4 animate-pulse"
          />
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
        <div className="container mx-auto px-2 sm:px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="flex items-center space-x-2 md:space-x-3">
              <img 
                src="/ATRIUM2 090725.png" 
                alt="PromptAtrium Logo" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={isActiveRoute("/") ? "text-primary font-medium border-b-2 border-primary pb-4 -mb-4" : "text-muted-foreground hover:text-foreground transition-colors"} 
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              <Link 
                href="/library" 
                className={isActiveRoute("/library") ? "text-primary font-medium border-b-2 border-primary pb-4 -mb-4" : "text-muted-foreground hover:text-foreground transition-colors"} 
                data-testid="nav-library"
              >
                My Library
              </Link>
              <Link 
                href="/community" 
                className={isActiveRoute("/community") ? "text-primary font-medium border-b-2 border-primary pb-4 -mb-4" : "text-muted-foreground hover:text-foreground transition-colors"} 
                data-testid="nav-community"
              >
                Community
              </Link>
              {(typedUser?.role === "super_admin" || typedUser?.role === "community_admin") && (
                <Link 
                  href="/admin" 
                  className={isActiveRoute("/admin") ? "text-yellow-600 font-medium border-b-2 border-yellow-600 pb-4 -mb-4 flex items-center gap-1" : "text-yellow-600 hover:text-yellow-700 transition-colors flex items-center gap-1"} 
                  data-testid="nav-admin"
                >
                  <Crown className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="hidden md:flex h-9 w-9"
                  data-testid="button-new-menu"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" data-testid="dropdown-new-menu">
                <DropdownMenuItem 
                  onClick={handleCreatePrompt}
                  className="cursor-pointer"
                  data-testid="menu-new-prompt"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Prompt
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleCreateCollection}
                  className="cursor-pointer"
                  data-testid="menu-new-collection"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Collection
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleImportPrompts}
                  className="cursor-pointer"
                  data-testid="menu-import-prompts"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Prompts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    {typedUser?.profileImageUrl ? (
                      <img
                        src={typedUser.profileImageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {typedUser?.firstName?.[0] || typedUser?.email?.[0] || "U"}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium" data-testid="text-username">
                    {typedUser?.firstName || typedUser?.email?.split("@")[0] || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" data-testid="dropdown-user-menu">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {typedUser?.firstName ? `${typedUser.firstName} ${typedUser.lastName || ''}` : typedUser?.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {typedUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href={`/user/${typedUser?.username}`} className="flex items-center cursor-pointer" data-testid="menu-view-profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="flex items-center cursor-pointer" data-testid="menu-profile-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Display Preferences
                </DropdownMenuLabel>
                
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer" data-testid="menu-theme-toggle">
                  {theme === 'light' ? (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Switch to Light Mode
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-status-options">
                  <Eye className="mr-2 h-4 w-4" />
                  Status Display Options
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile Menu Button - Now on the right */}
            <Button
              variant="ghost"
              className="md:hidden h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border">
            <nav className="container mx-auto px-2 sm:px-4 py-2 flex flex-col space-y-1">
              <Link 
                href="/" 
                className={isActiveRoute("/") ? "text-primary font-medium py-2" : "text-muted-foreground hover:text-foreground transition-colors py-2"} 
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-dashboard"
              >
                Dashboard
              </Link>
              <Link 
                href="/library" 
                className={isActiveRoute("/library") ? "text-primary font-medium py-2" : "text-muted-foreground hover:text-foreground transition-colors py-2"} 
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-library"
              >
                My Library
              </Link>
              <Link 
                href="/community" 
                className={isActiveRoute("/community") ? "text-primary font-medium py-2" : "text-muted-foreground hover:text-foreground transition-colors py-2"} 
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-community"
              >
                Community
              </Link>
              {(typedUser?.role === "super_admin" || typedUser?.role === "community_admin") && (
                <Link 
                  href="/admin" 
                  className={isActiveRoute("/admin") ? "text-yellow-600 font-medium py-2 flex items-center gap-1" : "text-yellow-600 hover:text-yellow-700 transition-colors py-2 flex items-center gap-1"} 
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-admin"
                >
                  <Crown className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Button
                className="w-full flex items-center justify-center space-x-2 mt-2"
                onClick={() => {
                  handleCreatePrompt();
                  setMobileMenuOpen(false);
                }}
                data-testid="mobile-button-new-prompt"
              >
                <Plus className="h-4 w-4" />
                <span>New Prompt</span>
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Global Modals */}
      <PromptModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        prompt={null}
        mode="create"
      />
      
      <BulkImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
        collections={collections}
      />
      
      {/* Create Collection Modal */}
      <Dialog open={createCollectionModalOpen} onOpenChange={setCreateCollectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <Form {...createCollectionForm}>
            <form onSubmit={createCollectionForm.handleSubmit(onCreateCollectionSubmit)} className="space-y-4">
              <FormField
                control={createCollectionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Creative Writing, Business Ideas" {...field} data-testid="input-collection-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createCollectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this collection contains..."
                        {...field}
                        data-testid="textarea-collection-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createCollectionForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Make Public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow others to view and use this collection
                      </p>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                        data-testid="checkbox-collection-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCollectionMutation.isPending}>
                  {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}