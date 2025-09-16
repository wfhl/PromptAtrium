import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, Search, Shield } from "lucide-react";
import { useEffect } from "react";
import PromptCardBeam from "@/components/PromptCardBeam";

export default function Landing() {
  // Force dark theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

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
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In/Up</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-4 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2" data-testid="text-hero-title">
            AI Prompt Library & Community
          </h1>
          <p className="text-sm text-muted-foreground mb-1 max-w-xl mx-auto" data-testid="text-hero-description">
            PromptAtrium is an open, central space for managing, sharing, and refining AI prompts. Join the community and elevate your AI projects today.
          </p>
        </div>
      </section>

      {/* Prompt Card Beam Animation */}
      <section className="mt-2 mb-2">
        <PromptCardBeam />
      </section>

      {/* Features */}
      <section className="pt-3 pb-8 px-6 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl -mt-1 font-bold text-center text-foreground mb-8" data-testid="text-features-title">
            Everything you need for AI prompt management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            <Card className="p-2 md:p-6" data-testid="card-feature-organize">
              <CardHeader className="p-2 md:p-6">
                <div className="flex items-center gap-2 mb-1 justify-center md:block md:mb-0 md:justify-start">
                  <div className="w-6 h-6 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 md:mb-4">
                    <Lightbulb className="h-3 w-3 md:h-6 md:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-sm md:text-xl">Organize & Manage</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-6 md:pt-0">
                <p className="text-[10px] leading-tight text-center md:text-base md:text-left text-muted-foreground">
                  Store, categorize, and version your prompts with advanced metadata and organization tools.
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-6" data-testid="card-feature-community">
              <CardHeader className="p-2 md:p-6">
                <div className="flex items-center gap-2 mb-1 justify-center md:block md:mb-0 md:justify-start">
                  <div className="w-6 h-6 md:w-12 md:h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 md:mb-4">
                    <Users className="h-3 w-3 md:h-6 md:w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-sm md:text-xl">Community Driven</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-6 md:pt-0">
                <p className="text-[10px] leading-tight text-center md:text-base md:text-left text-muted-foreground">
                  Share, discover, and collaborate on prompts with a vibrant community of creators.
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-6" data-testid="card-feature-search">
              <CardHeader className="p-2 md:p-6">
                <div className="flex items-center gap-2 mb-1 justify-center md:block md:mb-0 md:justify-start">
                  <div className="w-6 h-6 md:w-12 md:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 md:mb-4">
                    <Search className="h-3 w-3 md:h-6 md:w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-sm md:text-xl">Advanced Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-6 md:pt-0">
                <p className="text-[10px] leading-tight text-center md:text-base md:text-left text-muted-foreground">
                  Find the perfect prompt with full-text search, filtering by tags, categories, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 md:p-6" data-testid="card-feature-secure">
              <CardHeader className="p-2 md:p-6">
                <div className="flex items-center gap-2 mb-1 justify-center md:block md:mb-0 md:justify-start">
                  <div className="w-6 h-6 md:w-12 md:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 md:mb-4">
                    <Shield className="h-3 w-3 md:h-6 md:w-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-sm md:text-xl">Secure & Private</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-6 md:pt-0">
                <p className="text-[10px] leading-tight text-center md:text-base md:text-left text-muted-foreground">
                  Keep your prompts private or share them publicly with role-based access control.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-8 pb-20 px-6">
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
          <p data-testid="text-footer">© 2025 PromptAtrium. Built for the AI community.</p>
          <div className="mt-4 space-x-4">
            <a href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
