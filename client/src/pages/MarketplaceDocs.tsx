import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Store, 
  Coins, 
  Shield, 
  HelpCircle,
  Search,
  CreditCard,
  Package,
  Star,
  DollarSign,
  TrendingUp,
  BarChart,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  FileText,
  Award,
  Gift,
  Share2,
  MessageSquare,
  Trophy,
  ArrowRight,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  FileCheck,
  UserCheck,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function MarketplaceDocs() {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    // Smooth scroll behavior
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // Track active section on scroll
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = '';
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = section.getAttribute('data-section') || '';
        }
      });
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${sectionId}`);
    }
  };

  // Table of Contents items
  const tocItems = [
    { id: 'buyers', label: 'For Buyers', icon: ShoppingBag },
    { id: 'sellers', label: 'For Sellers', icon: Store },
    { id: 'credits', label: 'Credits System', icon: Coins },
    { id: 'safety', label: 'Safety & Trust', icon: Shield },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-900/20 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
            <h1 className="text-4xl font-bold mb-4">Marketplace Guide</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about buying and selling prompts on our marketplace
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Desktop Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1 p-4">
                  {tocItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                          activeSection === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        data-testid={`toc-${item.id}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Mobile Table of Contents */}
            <Card className="lg:hidden mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {tocItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      onClick={() => scrollToSection(item.id)}
                      data-testid={`mobile-toc-${item.id}`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {item.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* For Buyers Section */}
            <section id="buyers" data-section="buyers" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <ShoppingBag className="h-6 w-6 text-indigo-500" />
                    For Buyers
                  </CardTitle>
                  <CardDescription>
                    Learn how to discover, purchase, and use prompts from our marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      How to Browse and Search Listings
                    </h3>
                    <ul className="space-y-2 ml-7">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>Use the search bar to find specific prompts by keywords</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>Filter by categories to narrow down your search</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>Sort listings by popularity, price, or newest first</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>Use price range filters for USD or Credits</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Understanding Pricing
                    </h3>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Dual Pricing System</AlertTitle>
                      <AlertDescription>
                        Sellers can offer their prompts in both USD and Credits, giving you flexibility in payment options.
                      </AlertDescription>
                    </Alert>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">USD Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• Pay with credit/debit cards via Stripe</li>
                            <li>• Prices shown in dollars ($)</li>
                            <li>• Secure payment processing</li>
                            <li>• Instant access after purchase</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Credits Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• Use earned platform credits</li>
                            <li>• 100 credits = $1 USD value</li>
                            <li>• No payment processing fees</li>
                            <li>• Great for frequent buyers</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview System
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Before purchasing, you can preview a portion of the prompt to ensure it meets your needs:
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">10-30%</Badge>
                        <span className="text-sm">Standard preview range</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">50%+</Badge>
                        <span className="text-sm">Extended preview (seller's choice)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        The preview percentage is set by the seller and shows you the beginning portion of the prompt.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Purchase Process Walkthrough
                    </h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="shrink-0">1</Badge>
                        <div>
                          <p className="font-medium">Browse and Select</p>
                          <p className="text-sm text-muted-foreground">Find a prompt that matches your needs</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="shrink-0">2</Badge>
                        <div>
                          <p className="font-medium">Preview Content</p>
                          <p className="text-sm text-muted-foreground">Review the preview to ensure quality</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="shrink-0">3</Badge>
                        <div>
                          <p className="font-medium">Choose Payment Method</p>
                          <p className="text-sm text-muted-foreground">Select between USD or Credits</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="shrink-0">4</Badge>
                        <div>
                          <p className="font-medium">Complete Purchase</p>
                          <p className="text-sm text-muted-foreground">Process payment securely</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="shrink-0">5</Badge>
                        <div>
                          <p className="font-medium">Access Your Content</p>
                          <p className="text-sm text-muted-foreground">View full prompt in your purchase history</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Accessing Purchased Content
                    </h3>
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-6">
                        <p className="mb-3">All your purchased prompts are stored in your account:</p>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span>Access from "Purchase History" in your profile</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span>Download prompts for offline use</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span>Lifetime access to purchased content</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                            <span>Re-download anytime from your library</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Digital Licenses and Usage Rights
                    </h3>
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertTitle>Personal Use License</AlertTitle>
                      <AlertDescription>
                        All purchased prompts come with a personal use license. You can:
                        <ul className="mt-2 space-y-1">
                          <li>• Use prompts for personal and commercial projects</li>
                          <li>• Modify prompts to suit your needs</li>
                          <li>• Generate unlimited outputs</li>
                        </ul>
                        You cannot resell or redistribute the original prompts.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      How to Leave Reviews and Earn Credits
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Share your experience and help other buyers make informed decisions:
                      </p>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="font-medium text-green-800 dark:text-green-300 mb-2">
                          Earn 10 Credits per Review!
                        </p>
                        <ol className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>1. Purchase a prompt from the marketplace</li>
                          <li>2. Use the prompt and evaluate its quality</li>
                          <li>3. Leave a thoughtful review (min 50 characters)</li>
                          <li>4. Receive 10 credits instantly</li>
                        </ol>
                      </div>
                      <Alert variant="default" className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 dark:text-orange-300">
                          Only verified purchasers can leave reviews. One review per purchase.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* For Sellers Section */}
            <section id="sellers" data-section="sellers" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Store className="h-6 w-6 text-green-500" />
                    For Sellers
                  </CardTitle>
                  <CardDescription>
                    Start selling your prompts and grow your business on our marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Getting Started as a Seller
                    </h3>
                    <div className="space-y-3">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Ready to start selling?</AlertTitle>
                        <AlertDescription>
                          Navigate to your <Link href="/seller/dashboard" className="font-medium underline">Seller Dashboard</Link> to begin the onboarding process.
                        </AlertDescription>
                      </Alert>
                      <div className="grid md:grid-cols-3 gap-3">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 1</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Complete seller onboarding</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 2</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Verify tax information</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 3</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Create your first listing</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Seller Onboarding Requirements
                    </h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Business Type</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex gap-2">
                            <Badge variant="outline">Individual</Badge>
                            <span className="text-sm text-muted-foreground">Selling as a person</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">Business</Badge>
                            <span className="text-sm text-muted-foreground">Selling as a company</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Tax Information Required</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Tax ID Number (SSN/EIN for US sellers)</li>
                          <li>• VAT Number (for EU sellers)</li>
                          <li>• Business Name (if applicable)</li>
                          <li>• Business Address</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Payout Methods</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm">Stripe Connect (recommended)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm">Manual payouts (upon request)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Creating Your First Listing
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Follow these best practices when creating listings:
                      </p>
                      <div className="space-y-3">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Title & Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              <li>• Use clear, descriptive titles</li>
                              <li>• Include key features and benefits</li>
                              <li>• Specify compatible AI models</li>
                              <li>• Add relevant tags and categories</li>
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Content Quality</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              <li>• Test prompts thoroughly before listing</li>
                              <li>• Include example outputs</li>
                              <li>• Provide usage instructions</li>
                              <li>• Mention any limitations</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Setting Dual Pricing Strategies
                    </h3>
                    <Alert className="mb-4">
                      <DollarSign className="h-4 w-4" />
                      <AlertTitle>Maximize Your Revenue</AlertTitle>
                      <AlertDescription>
                        Offer both USD and Credit pricing to appeal to all buyer types and increase sales.
                      </AlertDescription>
                    </Alert>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">USD Pricing Tips</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Research competitor pricing</li>
                          <li>• Start with introductory prices</li>
                          <li>• Consider value-based pricing</li>
                          <li>• Factor in the 15% platform fee</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Credits Pricing Tips</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Use round numbers (500, 1000)</li>
                          <li>• Offer credit discounts for loyalty</li>
                          <li>• Remember: 100 credits = $1 USD</li>
                          <li>• Consider psychological pricing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview Percentage Best Practices
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-3">Recommended Preview Percentages:</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Simple prompts (&lt; 100 words)</span>
                          <Badge>20-30%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Medium prompts (100-500 words)</span>
                          <Badge>15-25%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Complex prompts (&gt; 500 words)</span>
                          <Badge>10-20%</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        💡 Show enough to demonstrate quality without revealing the secret sauce!
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Understanding the Platform Fee
                    </h3>
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                      <CardHeader>
                        <CardTitle className="text-base">15% Platform Fee</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">The platform charges a 15% fee on all sales to cover:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Payment processing</li>
                          <li>• Hosting and infrastructure</li>
                          <li>• Marketing and promotion</li>
                          <li>• Customer support</li>
                          <li>• Platform development</li>
                        </ul>
                        <Separator className="my-3" />
                        <div className="bg-white dark:bg-gray-900 rounded p-3">
                          <p className="text-sm font-medium mb-1">Example Calculation:</p>
                          <p className="text-xs text-muted-foreground">$10 sale = $8.50 to seller + $1.50 platform fee</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Responding to Customer Reviews
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Engage with your customers professionally:
                      </p>
                      <div className="grid gap-3">
                        <Alert>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertTitle>Do's</AlertTitle>
                          <AlertDescription>
                            <ul className="text-sm mt-1 space-y-0.5">
                              <li>• Thank customers for feedback</li>
                              <li>• Address concerns professionally</li>
                              <li>• Offer solutions to problems</li>
                              <li>• Update listings based on feedback</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                        <Alert>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <AlertTitle>Don'ts</AlertTitle>
                          <AlertDescription>
                            <ul className="text-sm mt-1 space-y-0.5">
                              <li>• Never argue with customers</li>
                              <li>• Avoid defensive responses</li>
                              <li>• Don't ignore valid criticism</li>
                              <li>• Never share customer info</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Payout Schedules and Methods
                    </h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Payout Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Processing time</span>
                              <Badge variant="outline">7 days after sale</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Payout frequency</span>
                              <Badge variant="outline">Weekly</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Minimum payout</span>
                              <Badge variant="outline">$10 USD</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Payouts are automatically processed to your configured payment method. 
                          Ensure your tax information is up to date to avoid delays.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Credits System Section */}
            <section id="credits" data-section="credits" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    Credits System
                  </CardTitle>
                  <CardDescription>
                    Understand how to earn and spend credits on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">What Are Credits?</h3>
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Coins className="h-8 w-8 text-yellow-600" />
                            <div>
                              <p className="font-semibold">Platform Credits</p>
                              <p className="text-sm text-muted-foreground">Virtual currency for the marketplace</p>
                            </div>
                          </div>
                          <Badge className="text-lg px-3 py-1">100 Credits = $1 USD</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      How to Earn Credits
                    </h3>
                    <div className="grid gap-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-500" />
                            Daily Login Rewards
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Base reward</span>
                              <Badge variant="secondary">10 credits/day</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">7-day streak</span>
                              <Badge variant="secondary">+5 bonus credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">30-day streak</span>
                              <Badge variant="secondary">+20 bonus credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Max daily with streak</span>
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">35 credits</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-green-500" />
                            Sharing Public Prompts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Share your creativity with the community!</p>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                              <p className="text-sm font-medium">50 Credits per shared prompt</p>
                              <p className="text-xs text-muted-foreground mt-1">Must be original and high quality</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-purple-500" />
                            Writing Reviews
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Help others with your feedback!</p>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3">
                              <p className="text-sm font-medium">10 Credits per review</p>
                              <p className="text-xs text-muted-foreground mt-1">Minimum 50 characters, verified purchases only</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-indigo-500" />
                            Achievements and Milestones
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span>First Purchase</span>
                              <Badge variant="outline">100 credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>10 Reviews</span>
                              <Badge variant="outline">200 credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Power User</span>
                              <Badge variant="outline">500 credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Top Contributor</span>
                              <Badge variant="outline">1000 credits</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      How to Spend Credits
                    </h3>
                    <div className="space-y-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Current Uses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                              <span className="text-sm">Purchase marketplace listings at credit prices</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                              <span className="text-sm">Get discounts on premium prompts</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Coming Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 opacity-75">
                            <li className="flex items-start gap-2">
                              <Coins className="h-4 w-4 mt-0.5" />
                              <span className="text-sm">Premium features and tools</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Coins className="h-4 w-4 mt-0.5" />
                              <span className="text-sm">Priority support tickets</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Coins className="h-4 w-4 mt-0.5" />
                              <span className="text-sm">Exclusive content access</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Coins className="h-4 w-4 mt-0.5" />
                              <span className="text-sm">Custom prompt requests</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Credit Balance Management
                    </h3>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Important Information</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-2 space-y-1">
                          <li>• Credits have no expiration date</li>
                          <li>• Credits are non-transferable between accounts</li>
                          <li>• Credits cannot be exchanged for cash</li>
                          <li>• Your balance is displayed in the header navigation</li>
                          <li>• Transaction history available in your profile</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Safety & Trust Section */}
            <section id="safety" data-section="safety" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Shield className="h-6 w-6 text-blue-500" />
                    Safety & Trust
                  </CardTitle>
                  <CardDescription>
                    Our commitment to a secure and trustworthy marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Verified Purchase Badges
                    </h3>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-green-500">Verified</Badge>
                        <div className="flex-1">
                          <p className="font-medium mb-1">What does "Verified Purchase" mean?</p>
                          <p className="text-sm text-muted-foreground">
                            Reviews with this badge come from users who actually purchased and used the prompt. 
                            This ensures authentic feedback you can trust.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Review Authenticity
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Our Review Policy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• Only verified buyers can review</li>
                            <li>• One review per purchase</li>
                            <li>• Minimum 50 characters required</li>
                            <li>• No incentivized fake reviews</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Moderation Process</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• AI screening for spam</li>
                            <li>• Manual review of flagged content</li>
                            <li>• Removal of policy violations</li>
                            <li>• Seller response monitoring</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Dispute Resolution Process
                    </h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge variant="outline">1</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Contact Seller</p>
                          <p className="text-sm text-muted-foreground">Try to resolve issues directly through messaging</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">2</Badge>
                        <div className="flex-1">
                          <p className="font-medium">File a Dispute</p>
                          <p className="text-sm text-muted-foreground">If unresolved, open a formal dispute within 30 days</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">3</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Platform Review</p>
                          <p className="text-sm text-muted-foreground">Our team reviews evidence from both parties</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">4</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Resolution</p>
                          <p className="text-sm text-muted-foreground">Decision made within 7 business days</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Seller Verification
                    </h3>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Verified Sellers</AlertTitle>
                      <AlertDescription>
                        All sellers must complete identity and tax verification before listing products. 
                        Look for the verified badge on seller profiles.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium mb-2">Verification includes:</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Identity verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Tax information</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Payment method</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Business details</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Refund Policies
                    </h3>
                    <div className="space-y-3">
                      <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Digital Product Policy</AlertTitle>
                        <AlertDescription>
                          Due to the digital nature of prompts, refunds are limited to specific circumstances.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-green-200">
                          <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20">
                            <CardTitle className="text-base text-green-800 dark:text-green-300">
                              Eligible for Refund
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <ul className="text-sm space-y-1">
                              <li>• Product not as described</li>
                              <li>• Technical issues preventing access</li>
                              <li>• Duplicate purchases</li>
                              <li>• Seller account suspended</li>
                            </ul>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-red-200">
                          <CardHeader className="pb-3 bg-red-50 dark:bg-red-900/20">
                            <CardTitle className="text-base text-red-800 dark:text-red-300">
                              Not Eligible
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <ul className="text-sm space-y-1">
                              <li>• Change of mind</li>
                              <li>• Already downloaded/used</li>
                              <li>• Minor issues fixable by seller</li>
                              <li>• After 30 days of purchase</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* FAQ Section */}
            <section id="faq" data-section="faq" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <HelpCircle className="h-6 w-6 text-purple-500" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Quick answers to common questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="buyers" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="buyers">Buyers</TabsTrigger>
                      <TabsTrigger value="sellers">Sellers</TabsTrigger>
                      <TabsTrigger value="general">General</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="buyers" className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>Can I get a refund if I'm not satisfied?</AccordionTrigger>
                          <AccordionContent>
                            Refunds are available for products not as described, technical issues, or duplicate purchases. 
                            Please review our refund policy in the Safety & Trust section for full details. 
                            Contact support within 30 days of purchase to request a refund.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-2">
                          <AccordionTrigger>How do I know if a prompt will work for my AI model?</AccordionTrigger>
                          <AccordionContent>
                            Check the listing description for compatible AI models. Most sellers specify which models 
                            (GPT-4, Claude, Midjourney, etc.) their prompts are optimized for. You can also message 
                            the seller before purchasing if you're unsure.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-3">
                          <AccordionTrigger>Can I modify purchased prompts?</AccordionTrigger>
                          <AccordionContent>
                            Yes! All purchased prompts come with a personal use license that allows you to modify 
                            and adapt them for your needs. However, you cannot resell the original or modified 
                            versions of the prompts.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-4">
                          <AccordionTrigger>How long do I have access to purchased prompts?</AccordionTrigger>
                          <AccordionContent>
                            You have lifetime access to all purchased prompts. They're stored in your account and 
                            can be accessed anytime from your Purchase History. We recommend downloading a backup 
                            copy for your records.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-5">
                          <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
                          <AccordionContent>
                            We accept all major credit and debit cards through Stripe for USD purchases. 
                            You can also use platform Credits earned through various activities. Credits offer 
                            a fee-free way to purchase prompts.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="sellers" className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="seller-1">
                          <AccordionTrigger>How much does it cost to sell on the marketplace?</AccordionTrigger>
                          <AccordionContent>
                            There's no upfront cost to become a seller. We charge a 15% platform fee on each sale, 
                            which covers payment processing, hosting, marketing, and platform maintenance. 
                            You keep 85% of your sales revenue.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-2">
                          <AccordionTrigger>How quickly will I receive payouts?</AccordionTrigger>
                          <AccordionContent>
                            Payouts are processed weekly with a 7-day hold period after each sale (for fraud prevention). 
                            Once cleared, funds are automatically transferred to your configured payout method. 
                            The minimum payout threshold is $10 USD.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-3">
                          <AccordionTrigger>Can I offer discounts or promotions?</AccordionTrigger>
                          <AccordionContent>
                            Currently, you can offer competitive pricing through the dual pricing system (USD and Credits). 
                            Promotional features like discount codes and limited-time offers are planned for future updates.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-4">
                          <AccordionTrigger>What happens if a buyer disputes my sale?</AccordionTrigger>
                          <AccordionContent>
                            You'll be notified of any disputes and given the opportunity to resolve them directly with the buyer. 
                            If unresolved, our support team will review the case and make a fair decision based on our policies 
                            and the evidence provided by both parties.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-5">
                          <AccordionTrigger>Can I sell prompts I've modified from other sources?</AccordionTrigger>
                          <AccordionContent>
                            You can only sell original prompts that you've created yourself. Selling modified versions of 
                            purchased or copyrighted prompts violates our terms of service and may result in account suspension. 
                            Always ensure you have the rights to sell any content you list.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="general" className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="general-1">
                          <AccordionTrigger>What are Credits and how do they work?</AccordionTrigger>
                          <AccordionContent>
                            Credits are our platform's virtual currency. 100 Credits equal $1 USD. You can earn Credits through 
                            daily logins, sharing prompts, writing reviews, and achievements. Credits never expire and can be 
                            used to purchase marketplace listings without payment fees.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-2">
                          <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                          <AccordionContent>
                            Yes! We use Stripe for all payment processing, which is PCI-compliant and uses industry-standard 
                            encryption. We never store your credit card information on our servers. All transactions are 
                            processed securely through Stripe's infrastructure.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-3">
                          <AccordionTrigger>How do I report inappropriate content?</AccordionTrigger>
                          <AccordionContent>
                            Use the report button on any listing or review to flag inappropriate content. Our moderation team 
                            reviews all reports within 24 hours. You can also contact support directly with concerns about 
                            specific users or content.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-4">
                          <AccordionTrigger>Can I have multiple accounts?</AccordionTrigger>
                          <AccordionContent>
                            No, each user is limited to one account. Creating multiple accounts violates our terms of service 
                            and may result in all associated accounts being suspended. If you need to change account details, 
                            please contact support.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-5">
                          <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
                          <AccordionContent>
                            You can reach our support team through the Help Center in your account dashboard, or by emailing 
                            support@example.com. We typically respond within 24-48 hours. For urgent issues related to 
                            transactions, please include your order ID.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg text-center">
                    <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
                    <p className="text-muted-foreground mb-4">
                      Our support team is here to help you succeed
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Help Articles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}