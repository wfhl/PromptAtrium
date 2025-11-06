import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users, Search, Shield, Library, Sparkles, BookOpen, ShoppingCart, FolderOpen, Tags, Download, Archive, Copy, Brain, Wand2, Code, Layers, DollarSign, CreditCard, Globe, Lock, ArrowRight, ChevronRight, CheckCircle2, Star, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import PromptCardBeam from "@/components/PromptCardBeam";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

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
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-transparent p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
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

interface ToolFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ToolSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: ToolFeature[];
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  highlights?: string[];
  gradient: string;
}

const toolSections: ToolSection[] = [
  {
    id: "library",
    title: "Prompt Library",
    subtitle: "Your Personal AI Prompt Repository",
    description: "Organize, manage, and version control all your AI prompts in one centralized location. Create collections, add metadata, and track your prompt evolution over time.",
    icon: <Library className="h-6 w-6" />,
    gradient: "from-blue-500/20 to-cyan-500/20",
    features: [
      {
        icon: <FolderOpen className="h-4 w-4" />,
        title: "Smart Collections",
        description: "Organize prompts into themed collections with custom categories"
      },
      {
        icon: <Tags className="h-4 w-4" />,
        title: "Rich Metadata",
        description: "Tag prompts with categories, models, and custom attributes"
      },
      {
        icon: <Archive className="h-4 w-4" />,
        title: "Version History",
        description: "Track changes and iterations of your prompts over time"
      },
      {
        icon: <Download className="h-4 w-4" />,
        title: "Import & Export",
        description: "Bulk import/export prompts in various formats"
      }
    ],
    primaryAction: {
      label: "Explore Library",
      href: "/api/login"
    },
    highlights: [
      "Unlimited prompt storage",
      "Advanced search and filtering",
      "Private and public collections",
      "Bookmark favorite prompts"
    ]
  },
  {
    id: "generator",
    title: "Prompt Generator",
    subtitle: "AI-Powered Prompt Creation",
    description: "Generate professional prompts using our intelligent template system. Combine subjects, styles, and modifiers to create the perfect prompt for any AI model.",
    icon: <Sparkles className="h-6 w-6" />,
    gradient: "from-purple-500/20 to-pink-500/20",
    features: [
      {
        icon: <Brain className="h-4 w-4" />,
        title: "Smart Templates",
        description: "Pre-built templates for common use cases and scenarios"
      },
      {
        icon: <Wand2 className="h-4 w-4" />,
        title: "Auto Enhancement",
        description: "AI suggestions to improve and refine your prompts"
      },
      {
        icon: <Layers className="h-4 w-4" />,
        title: "Layered Building",
        description: "Build complex prompts step-by-step with guided assistance"
      },
      {
        icon: <Copy className="h-4 w-4" />,
        title: "Quick Copy",
        description: "One-click copy with format optimization for different models"
      }
    ],
    primaryAction: {
      label: "Start Generating",
      href: "/api/login"
    },
  
    highlights: [
      "50+ professional templates",
      "Model-specific optimization",
      "Character and scene builders",
      "Multiple Prompt Sytle Formats"
    ]
  },
  {
    id: "codex",
    title: "Wordsmith Codex",
    subtitle: "The Ultimate Prompt Engineering Reference",
    description: "Access a comprehensive database of AI prompt terms, modifiers, and techniques. Browse by category, assemble custom strings, and save your favorite combinations.",
    icon: <BookOpen className="h-6 w-6" />,
    gradient: "from-green-500/20 to-emerald-500/20",
    features: [
      {
        icon: <Code className="h-4 w-4" />,
        title: "Syntax Guides",
        description: "Master weight control, attention brackets, and advanced syntax"
      },
      {
        icon: <Layers className="h-4 w-4" />,
        title: "Category Browser",
        description: "Navigate organized categories from subjects to styles"
      },
      {
        icon: <Zap className="h-4 w-4" />,
        title: "Term Assembly",
        description: "Click to collect terms and build complex prompt strings"
      },
      {
        icon: <Star className="h-4 w-4" />,
        title: "Wildcard Lists",
        description: "Create dynamic wildcards for randomized generation"
      }
    ],
    primaryAction: {
      label: "Browse Codex",
      href: "/api/login"
    },
    highlights: [
      "10,000+ curated terms",
      "Anatomy of prompts guide",
      "Model-specific syntax",
      "Community contributions"
    ]
  },
  {
    id: "marketplace",
    title: "Prompt Marketplace",
    subtitle: "Buy, Sell, and Trade Premium Prompts",
    description: "Discover high-quality prompts from talented creators or monetize your own creations. Our secure marketplace supports both credit and money transactions.",
    icon: <ShoppingCart className="h-6 w-6" />,
    gradient: "from-orange-500/20 to-red-500/20",
    features: [
      {
        icon: <DollarSign className="h-4 w-4" />,
        title: "Flexible Pricing",
        description: "Set prices in credits or real money with Stripe integration"
      },
      {
        icon: <Globe className="h-4 w-4" />,
        title: "Global Reach",
        description: "Connect with buyers and sellers worldwide"
      },
      {
        icon: <Lock className="h-4 w-4" />,
        title: "Secure Transactions",
        description: "Protected payments and intellectual property rights"
      },
      {
        icon: <TrendingUp className="h-4 w-4" />,
        title: "Analytics Dashboard",
        description: "Track sales, views, and performance metrics"
      }
    ],
    primaryAction: {
      label: "Visit Marketplace",
      href: "/api/login"
    },
   
    highlights: [
      "Low commission rates",
      "Instant payouts",
      "Copyright protection",
      "Featured listings"
    ]
  }
];

export default function Landing() {
  const [activeToolTab, setActiveToolTab] = useState("library");
  
  // Force dark theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with Navigation */}
      <header className="border-b border-border bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/ATRIUM2 090725.png" 
              alt="PromptAtrium Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection('tools-overview')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tools
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In/Up</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 md:py-4 px-4 md:px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-2" data-testid="text-hero-title">
            AI Prompt Library & Community
          </h1>
          <p className="text-base md:text-sm text-muted-foreground mb-4 md:mb-1 max-w-xl mx-auto px-4 md:px-0" data-testid="text-hero-description">
            PromptAtrium is an open, central space for managing, sharing, and refining AI prompts. Join the community and elevate your AI projects today.
          </p>
        </div>
      </section>

      {/* Prompt Card Beam Animation */}
      <section className="mt-2 mb-2">
        <PromptCardBeam />
      </section>
      {/* Features */}
      <section id="features" className="pt-3 pb-8 px-6 bg-muted/20">
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
      {/* Tools Overview Section */}
      <section id="tools-overview" className="py-16 px-6 bg-gradient-to-b from-transparent to-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Powerful Tools for Every Creator
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover our comprehensive suite of AI prompt management tools designed to streamline your workflow and unleash your creativity
            </p>
            
            {/* Quick Access Cards - Used as Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {toolSections.map((tool) => (
                <Card 
                  key={tool.id}
                  onClick={() => setActiveToolTab(tool.id)}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    activeToolTab === tool.id 
                      ? "ring-2 ring-primary shadow-lg bg-primary/10" 
                      : "hover:shadow-lg"
                  )}
                >
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center transition-colors",
                      activeToolTab === tool.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-primary/10"
                    )}>
                      {tool.icon}
                    </div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">{tool.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{tool.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tool Details Display - Show Selected Tool */}
          <div className="mt-8">
            {toolSections.map((tool) => (
              tool.id === activeToolTab && (
                <Card key={tool.id} className={`border-2 bg-gradient-to-br ${tool.gradient} backdrop-blur animate-in fade-in-50 duration-500`}>
                  <CardHeader className="pb-8">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl flex items-center gap-3">
                          {tool.icon}
                          {tool.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm">
                          {tool.subtitle}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-base mt-4 text-foreground/80">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {tool.features.map((feature, idx) => (
                        <div key={idx} className="flex gap-3 p-4 rounded-lg bg-background/50 backdrop-blur">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {feature.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    {tool.highlights && (
                      <div className="mb-8">
                        <h4 className="font-semibold mb-3 text-foreground">Key Features:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tool.highlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-start sm:items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                              <span className="text-muted-foreground">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href={tool.primaryAction.href}>
                        <Button size="lg" className="w-full sm:w-auto">
                          {tool.primaryAction.label}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      {tool.secondaryAction && (
                        <Link href={tool.secondaryAction.href}>
                          <Button size="lg" variant="outline" className="w-full sm:w-auto">
                            {tool.secondaryAction.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>

      
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-6 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How PromptAtrium Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our intuitive workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create & Import</h3>
              <p className="text-muted-foreground">
                Start by creating new prompts or importing existing ones. Use our generator for quick creation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-500">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Organize & Enhance</h3>
              <p className="text-muted-foreground">
                Organize prompts into collections, add metadata, and use the Codex to enhance your prompts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-500">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Share & Monetize</h3>
              <p className="text-muted-foreground">
                Share with the community or sell your best prompts in the marketplace. Build your reputation.
              </p>
            </div>
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
