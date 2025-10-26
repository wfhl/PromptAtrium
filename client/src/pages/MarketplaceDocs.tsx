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
  ChevronRight,
  AlertTriangle,
  Clock,
  LogIn,
  Zap,
  Gavel,
  Construction
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
    { id: 'disputes', label: 'Dispute Resolution', icon: Gavel },
    { id: 'safety', label: 'Safety & Trust', icon: Shield },
    { id: 'coming-soon', label: 'Coming Soon', icon: Construction },
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
            <Alert className="mt-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle>Marketplace Status: Beta</AlertTitle>
              <AlertDescription>
                Our marketplace is currently in beta. Some features are still under development. We're working hard to improve your experience!
              </AlertDescription>
            </Alert>
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
                        Sellers offer their prompts in both USD and Credits. Credits are earned through platform engagement - you cannot purchase credits.
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
                            <li>• Use earned platform credits only</li>
                            <li>• 100 credits = $1 USD value</li>
                            <li>• Credits are earned, not purchased</li>
                            <li>• No payment processing fees</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Buyer Protection
                    </h3>
                    <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle>30-Day Protection Policy</AlertTitle>
                      <AlertDescription>
                        All purchases are protected by our 30-day dispute window. If you encounter issues with your purchase, you can open a dispute for resolution.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">What's Covered</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• Product not as described</li>
                            <li>• Missing or incomplete content</li>
                            <li>• Quality issues</li>
                            <li>• Technical problems accessing content</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      How to Leave Reviews and Earn Credits
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Share your experience and earn credits while helping other buyers:
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
                    Start selling your prompts on our marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Important: Payouts Not Yet Available</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        <strong>Seller payouts are currently not available.</strong> We are working on implementing Stripe Connect for secure seller payouts.
                      </p>
                      <p>
                        You can still create listings and make sales, but funds will be held until the payout system is fully implemented. We'll notify all sellers when payouts become available.
                      </p>
                    </AlertDescription>
                  </Alert>

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
                          Navigate to your <Link href="/seller/dashboard" className="font-medium underline">Seller Dashboard</Link> to begin creating listings.
                        </AlertDescription>
                      </Alert>
                      <div className="grid md:grid-cols-3 gap-3">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 1</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Complete basic profile</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 2</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Create your listings</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Step 3</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Start making sales</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Creating Your Listings
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Follow these best practices when creating listings:
                      </p>
                      <div className="space-y-3">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">What You Can Do Now</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              <li>✅ Create listings with dual pricing (USD and Credits)</li>
                              <li>✅ Upload preview content</li>
                              <li>✅ Set preview percentages</li>
                              <li>✅ Track sales in analytics dashboard</li>
                              <li>✅ Respond to customer reviews</li>
                              <li>✅ Handle dispute resolutions</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Platform Fee Structure
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
                          <li>• Customer support</li>
                          <li>• Platform development</li>
                        </ul>
                        <Alert className="mt-3">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Note: While fees are calculated, actual payouts are pending implementation of Stripe Connect.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Dispute Handling Responsibilities
                    </h3>
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        As a seller, you're expected to:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Respond to disputes within 48 hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Provide evidence if product is as described</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Work toward fair resolutions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Maintain professional communication</span>
                        </li>
                      </ul>
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
                    Earn credits through engagement and use them in the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Credits are Earned, Not Purchased</AlertTitle>
                    <AlertDescription>
                      Credits cannot be bought with real money. They are exclusively earned through platform activities and engagement. This ensures fair access for all users.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">How to Earn Credits</h3>
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
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
                              <Badge variant="secondary">+5 bonus</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">30-day streak</span>
                              <Badge variant="secondary">+10 bonus</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Build your streak for extra rewards!
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Write Reviews
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Per review</span>
                              <Badge variant="secondary">10 credits</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Only for verified purchases. Min 50 characters.
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            Share Prompts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Share to library</span>
                              <Badge variant="secondary">50 credits</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Make your prompts public to earn rewards.
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Achievements
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Bronze badges</span>
                              <Badge variant="secondary">100 credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Silver badges</span>
                              <Badge variant="secondary">250 credits</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Gold badges</span>
                              <Badge variant="secondary">500 credits</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Complete milestones to unlock achievements.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Credit Value and Usage</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Credit Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">
                              100 Credits = $1 USD
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Fixed exchange rate for marketplace purchases
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-sm space-y-1">
                            <li>• Purchase marketplace listings</li>
                            <li>• No transaction fees</li>
                            <li>• Instant transactions</li>
                            <li>• Track balance in profile</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Credit Expiration Policy
                    </h3>
                    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle>Credits Expire After 12 Months</AlertTitle>
                      <AlertDescription>
                        Credits expire 12 months after being earned. Use them regularly to avoid losing them. Check your credit history to see expiration dates.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Dispute Resolution Section */}
            <section id="disputes" data-section="disputes" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Gavel className="h-6 w-6 text-red-500" />
                    Dispute Resolution
                  </CardTitle>
                  <CardDescription>
                    How we handle disputes between buyers and sellers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">When to Open a Dispute</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200">
                        <CardHeader className="pb-3 bg-green-50 dark:bg-green-900/20">
                          <CardTitle className="text-base text-green-800 dark:text-green-300">
                            Valid Reasons
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="text-sm space-y-1">
                            <li>• Product not as described</li>
                            <li>• Missing content</li>
                            <li>• Doesn't work as advertised</li>
                            <li>• Quality issues</li>
                            <li>• Technical problems</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200">
                        <CardHeader className="pb-3 bg-red-50 dark:bg-red-900/20">
                          <CardTitle className="text-base text-red-800 dark:text-red-300">
                            Invalid Reasons
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ul className="text-sm space-y-1">
                            <li>• Change of mind</li>
                            <li>• Found cheaper elsewhere</li>
                            <li>• Didn't read description</li>
                            <li>• Personal preference</li>
                            <li>• After 30 days</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Dispute Process</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge variant="outline">1</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Open Dispute</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Open Dispute" on your purchase within 30 days
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">2</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Provide Details</p>
                          <p className="text-sm text-muted-foreground">
                            Explain the issue and provide evidence (screenshots, etc.)
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">3</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Seller Response</p>
                          <p className="text-sm text-muted-foreground">
                            Seller has 48 hours to respond with their perspective
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">4</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Communication</p>
                          <p className="text-sm text-muted-foreground">
                            Try to resolve through the messaging system
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Badge variant="outline">5</Badge>
                        <div className="flex-1">
                          <p className="font-medium">Admin Review</p>
                          <p className="text-sm text-muted-foreground">
                            If unresolved, admins review and make final decision
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Resolution Options</h3>
                    <div className="grid gap-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Full Refund</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Complete refund of USD or credits for valid disputes
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Partial Refund</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Partial compensation for minor issues
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Replacement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Seller provides corrected or updated content
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important Timeline</AlertTitle>
                    <AlertDescription>
                      You have <strong>30 days</strong> from purchase date to open a dispute. After 30 days, purchases are final and cannot be disputed.
                    </AlertDescription>
                  </Alert>
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
                    How we keep the marketplace safe for everyone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Secure Transactions
                    </h3>
                    <div className="space-y-3">
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Payment Security</AlertTitle>
                        <AlertDescription>
                          All USD transactions are processed securely through Stripe. We never store your payment information.
                        </AlertDescription>
                      </Alert>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>PCI-compliant payment processing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Encrypted transactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                          <span>Fraud detection</span>
                        </li>
                      </ul>
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
                            <li>• Manual review of flagged content</li>
                            <li>• Removal of policy violations</li>
                            <li>• Seller response monitoring</li>
                            <li>• Community reporting system</li>
                          </ul>
                        </CardContent>
                      </Card>
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
                          Due to the digital nature of prompts, refunds are processed through our dispute system within 30 days of purchase.
                        </AlertDescription>
                      </Alert>
                      
                      <p className="text-sm text-muted-foreground">
                        Refunds are processed to the original payment method (USD or credits) and typically complete within 5-7 business days for card payments.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Coming Soon Section */}
            <section id="coming-soon" data-section="coming-soon" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Construction className="h-6 w-6 text-orange-500" />
                    Coming Soon
                  </CardTitle>
                  <CardDescription>
                    Features we're working on to improve your marketplace experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Under Active Development</AlertTitle>
                    <AlertDescription>
                      These features are planned but not yet available. We're working hard to bring them to you soon!
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Stripe Connect for Seller Payouts
                        </CardTitle>
                        <Badge className="w-fit" variant="destructive">High Priority</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Automated seller payouts through Stripe Connect for instant access to your earnings.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Promotional Tools
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Discount codes, limited-time offers, and promotional campaigns for sellers.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Bundle Listings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Create and sell prompt bundles at discounted prices.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          AI-Powered Search
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Smart search with semantic understanding and personalized recommendations.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Email Notifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Stay updated with purchase confirmations, dispute updates, and seller notifications.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      Want to suggest a feature? Contact us through the support channel!
                    </p>
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
                          <AccordionTrigger>Can I buy credits with real money?</AccordionTrigger>
                          <AccordionContent>
                            No, credits cannot be purchased. They are exclusively earned through platform activities like daily logins (10+ credits), 
                            writing reviews (10 credits), sharing prompts (50 credits), and completing achievements (100-500 credits).
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                          <AccordionTrigger>What if I have a problem with my purchase?</AccordionTrigger>
                          <AccordionContent>
                            You can open a dispute within 30 days of purchase. Navigate to your purchase history, click on the purchase, 
                            and select "Open Dispute". Provide details about the issue and communicate with the seller to resolve it.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-3">
                          <AccordionTrigger>Do credits expire?</AccordionTrigger>
                          <AccordionContent>
                            Yes, credits expire 12 months after being earned. Check your credit history regularly to see upcoming expirations 
                            and use your credits before they expire.
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
                            You can also use earned platform Credits for fee-free purchases.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="sellers" className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="seller-1">
                          <AccordionTrigger>When will I get paid for my sales?</AccordionTrigger>
                          <AccordionContent>
                            <strong>Seller payouts are not yet available.</strong> We're implementing Stripe Connect for secure payouts. 
                            Your earnings are being tracked and will be available once the payout system is fully implemented. 
                            We'll notify all sellers when this feature launches.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-2">
                          <AccordionTrigger>How much does it cost to sell?</AccordionTrigger>
                          <AccordionContent>
                            There's no upfront cost to become a seller. We charge a 15% platform fee on each sale, 
                            which covers payment processing, hosting, and platform maintenance. 
                            You keep 85% of your sales revenue (once payouts are enabled).
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-3">
                          <AccordionTrigger>Can I offer discounts or promotions?</AccordionTrigger>
                          <AccordionContent>
                            Promotional features like discount codes are coming soon. Currently, you can offer competitive 
                            pricing through our dual pricing system (USD and Credits) to attract different types of buyers.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-4">
                          <AccordionTrigger>What happens if a buyer disputes?</AccordionTrigger>
                          <AccordionContent>
                            You'll be notified immediately and have 48 hours to respond. Provide evidence if your product 
                            is as described, and try to resolve the issue directly with the buyer through our messaging system.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="seller-5">
                          <AccordionTrigger>Can I track my sales analytics?</AccordionTrigger>
                          <AccordionContent>
                            Yes! The seller dashboard includes comprehensive analytics with charts showing your sales, 
                            revenue, popular products, and customer demographics. Access it from your Seller Dashboard.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="general" className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="general-1">
                          <AccordionTrigger>What exactly are Credits?</AccordionTrigger>
                          <AccordionContent>
                            Credits are our platform's earned currency. 100 Credits equal $1 USD in marketplace value. 
                            You earn them through daily logins, reviews, sharing content, and achievements. 
                            They cannot be purchased with real money.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-2">
                          <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                          <AccordionContent>
                            Yes! We use Stripe for all payment processing, which is PCI-compliant and uses industry-standard 
                            encryption. We never store your credit card information on our servers.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-3">
                          <AccordionTrigger>What features are coming soon?</AccordionTrigger>
                          <AccordionContent>
                            We're working on: Stripe Connect for seller payouts (high priority), promotional tools, 
                            bundle listings, AI-powered search, email notifications, and more. Check the "Coming Soon" 
                            section above for the full list.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-4">
                          <AccordionTrigger>How do disputes work?</AccordionTrigger>
                          <AccordionContent>
                            Buyers can open disputes within 30 days of purchase for issues like "not as described" or quality problems. 
                            Both parties communicate through our messaging system to resolve the issue. If unresolved, 
                            admins review and make a final decision.
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="general-5">
                          <AccordionTrigger>How do I contact support?</AccordionTrigger>
                          <AccordionContent>
                            You can reach our support team through the Help Center in your account dashboard. 
                            We typically respond within 24-48 hours. For urgent transaction issues, 
                            please include your order ID.
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