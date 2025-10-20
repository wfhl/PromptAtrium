import { Button } from "@/components/ui/button";
import { Lightbulb, Users, Search, Shield } from "lucide-react";
import { useEffect } from "react";
import PromptCardBeam from "@/components/PromptCardBeam";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  testId?: string;
}

const GridItem = ({ area, icon, title, description, testId }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)} data-testid={testId}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

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
          
          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-2 lg:gap-4">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/7]"
              icon={<Lightbulb className="h-4 w-4" />}
              title="Organize & Manage"
              description="Store, categorize, and version your prompts with advanced metadata and organization tools."
              testId="card-feature-organize"
            />
            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:1/7/2/13]"
              icon={<Users className="h-4 w-4" />}
              title="Community Driven"
              description="Share, discover, and collaborate on prompts with a vibrant community of creators."
              testId="card-feature-community"
            />
            <GridItem
              area="md:[grid-area:2/1/2/7] xl:[grid-area:2/1/3/7]"
              icon={<Search className="h-4 w-4" />}
              title="Advanced Search"
              description="Find the perfect prompt with full-text search, filtering by tags, categories, and more."
              testId="card-feature-search"
            />
            <GridItem
              area="md:[grid-area:2/7/2/13] xl:[grid-area:2/7/3/13]"
              icon={<Shield className="h-4 w-4" />}
              title="Secure & Private"
              description="Keep your prompts private or share them publicly with role-based access control."
              testId="card-feature-secure"
            />
          </ul>
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
