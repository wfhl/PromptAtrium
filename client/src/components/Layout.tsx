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
import { Lightbulb, Plus, ChevronDown, Crown, LogOut, Moon, Sun, User as UserIcon, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
  onCreatePrompt?: () => void;
}

export function Layout({ children, onCreatePrompt }: LayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const typedUser = user as User;
  const { toast } = useToast();
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

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

  const handleDefaultCreatePrompt = () => {
    toast({
      title: "Create Prompt",
      description: "Navigate to Dashboard to create new prompts",
    });
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
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="h-4 w-4 text-primary-foreground animate-pulse" />
          </div>
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
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-primary-foreground" />
              </div>
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
              <Link 
                href="/projects" 
                className={isActiveRoute("/projects") ? "text-primary font-medium border-b-2 border-primary pb-4 -mb-4" : "text-muted-foreground hover:text-foreground transition-colors"} 
                data-testid="nav-projects"
              >
                Projects
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
          
          <div className="flex items-center space-x-4">
            <Button
              className="hidden md:flex items-center space-x-2"
              onClick={onCreatePrompt || handleDefaultCreatePrompt}
              data-testid="button-new-prompt"
            >
              <Plus className="h-4 w-4" />
              <span>New Prompt</span>
            </Button>
            
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
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                  <Link href="/profile/settings" className="flex items-center cursor-pointer" data-testid="menu-profile-settings">
                    <UserIcon className="mr-2 h-4 w-4" />
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}