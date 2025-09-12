import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, Search, Shield, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import PromptCardBeam from "@/components/PromptCardBeam";

export default function Landing() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize dark theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/ATRIUM2 090725.png" 
              alt="PromptAtrium Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4" data-testid="text-hero-title">
            AI Prompt Library & Community
          </h1>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto" data-testid="text-hero-description">
            PromptAtrium is an open, central space for managing, sharing, and refining AI prompts. 
            Join creators, teams, and communities to cultivate ideas together.
          </p>
        </div>
      </section>

      {/* Prompt Card Beam Animation */}
      <section className="py-2">
        <PromptCardBeam />
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="text-features-title">
            Everything you need for AI prompt management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card data-testid="card-feature-organize">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Organize & Manage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Store, categorize, and version your prompts with advanced metadata and organization tools.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-community">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share, discover, and collaborate on prompts with a vibrant community of creators.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-search">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Advanced Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find the perfect prompt with full-text search, filtering by tags, categories, and more.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-secure">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep your prompts private or share them publicly with role-based access control.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6" data-testid="text-cta-title">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-cta-description">
            Join thousands of creators managing their AI prompts with PromptAtrium.
          </p>
          <Button size="lg" asChild data-testid="button-cta">
            <a href="/api/login">Sign Up Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p data-testid="text-footer">© 2024 PromptAtrium. Built for the AI community.</p>
        </div>
      </footer>
    </div>
  );
}
