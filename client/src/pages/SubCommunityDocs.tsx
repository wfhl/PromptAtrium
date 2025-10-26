import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Shield, 
  Eye, 
  EyeOff, 
  Lock,
  Unlock,
  UserPlus,
  Settings,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Link as LinkIcon,
  Copy,
  Check,
  Building,
  FolderTree,
  UserCheck,
  Info,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Mail,
  Globe,
  Share2,
  Key,
  Crown,
  UserX,
  Edit,
  Trash,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Navigation
} from "lucide-react";
import { Link } from "wouter";

export default function SubCommunityDocs() {
  const tocRef = useRef<HTMLDivElement>(null);
  
  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  // Table of Contents sections
  const tocSections = [
    { id: "overview", title: "What are Sub-Communities?", icon: Building },
    { id: "members", title: "For Members", icon: Users },
    { id: "admins", title: "For Sub-Community Admins", icon: Shield },
    { id: "visibility", title: "Content Visibility Guide", icon: Eye },
    { id: "invitations", title: "Invitation System", icon: UserPlus },
    { id: "faq", title: "Frequently Asked Questions", icon: HelpCircle }
  ];
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          Sub-Communities Guide
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about creating, managing, and participating in sub-communities
        </p>
      </div>
      
      {/* Table of Contents */}
      <Card className="mb-8 sticky top-4 z-10 bg-background/95 backdrop-blur" ref={tocRef}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tocSections.map(section => (
              <Button
                key={section.id}
                variant="outline"
                className="justify-start"
                onClick={() => scrollToSection(section.id)}
                data-testid={`nav-${section.id}`}
              >
                <section.icon className="h-4 w-4 mr-2" />
                {section.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Overview Section */}
      <section id="overview" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building className="h-6 w-6" />
              What are Sub-Communities?
            </CardTitle>
            <CardDescription>Understanding the hierarchy and benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed">
                Sub-communities are specialized spaces within larger parent communities that allow for more focused discussions, 
                content sharing, and collaboration around specific topics or interests. Think of them as rooms within a larger building, 
                each with its own purpose and membership.
              </p>
            </div>
            
            <Alert>
              <FolderTree className="h-4 w-4" />
              <AlertTitle>Hierarchy Concept</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-semibold">Parent Community</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Main organization or group</span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <FolderTree className="h-4 w-4" />
                    <span className="font-semibold">Sub-Communities</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Specialized teams or topics</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Benefits for Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Access to specialized content and discussions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Connect with like-minded individuals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Participate in focused projects</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Share content with specific audiences</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-500" />
                    Benefits for Admins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-sm">Organize content into logical groups</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-sm">Control access and visibility</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-sm">Delegate management responsibilities</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-sm">Foster specialized communities</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* For Members Section */}
      <section id="members" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              For Members
            </CardTitle>
            <CardDescription>How to participate in sub-communities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/50">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>Getting Started</AlertTitle>
              <AlertDescription>
                As a member, you can browse, join, and participate in sub-communities that interest you. 
                Each sub-community may have different requirements for joining.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Browsing Sub-Communities
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>Navigate to the Communities page from the main menu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>Click on a parent community to see its sub-communities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>Use the browser view for a hierarchical overview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>Look for public sub-communities or those you have invitations for</span>
                  </li>
                </ul>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Joining Sub-Communities
                </h3>
                <div className="space-y-3">
                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Via Invitation Link</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click on an invitation link shared with you. You'll be directed to an acceptance page
                            where you can review the sub-community details and join.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Key className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Via Invitation Code</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enter the invitation code on the invite page (/invite) to join a specific sub-community.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Understanding Visibility Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    Members Only
                  </Badge>
                  <Badge variant="destructive">
                    <Shield className="h-3 w-3 mr-1" />
                    Admins Only
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  These badges indicate who can see content within the sub-community. 
                  You'll only see content based on your membership status.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Participating in Sub-Communities
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Share prompts specific to the sub-community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>View and interact with member-only content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Collaborate on specialized projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500" />
                    <span>Leave the sub-community at any time from your profile settings</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* For Sub-Community Admins Section */}
      <section id="admins" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6" />
              For Sub-Community Admins
            </CardTitle>
            <CardDescription>Managing your sub-community effectively</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/50">
              <Crown className="h-4 w-4 text-purple-500" />
              <AlertTitle>Admin Privileges</AlertTitle>
              <AlertDescription>
                As a sub-community admin, you have full control over your sub-community's content, members, and settings.
                Parent community admins also have administrative access to all sub-communities.
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Creating Sub-Communities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>To create a new sub-community:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Navigate to the Communities page</li>
                      <li>Find your parent community</li>
                      <li>Click "Add Sub" button</li>
                      <li>Fill in the details (name, description)</li>
                      <li>Set initial visibility preferences</li>
                      <li>Click "Create" to establish your sub-community</li>
                    </ol>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Managing Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <UserPlus className="h-4 w-4 mt-0.5" />
                        <span>Invite new members via invitation links</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Edit className="h-4 w-4 mt-0.5" />
                        <span>Modify member roles and permissions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserX className="h-4 w-4 mt-0.5" />
                        <span>Remove members if necessary</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 mt-0.5" />
                        <span>View member activity and contributions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Creating Invitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Invitation options:</p>
                    <ul className="space-y-1 ml-2">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Unlimited</Badge>
                        <span>No usage restrictions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Limited</Badge>
                        <span>Set maximum uses (1-100)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Expiring</Badge>
                        <span>Set expiration date</span>
                      </li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      Share the generated link or code with prospective members.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Content Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 mt-0.5" />
                        <span>Set content visibility levels</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Share2 className="h-4 w-4 mt-0.5" />
                        <span>Moderate shared prompts</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Trash className="h-4 w-4 mt-0.5" />
                        <span>Remove inappropriate content</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Settings className="h-4 w-4 mt-0.5" />
                        <span>Configure sub-community settings</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Alert className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/50">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                Access your admin dashboard at <code className="bg-muted px-1 rounded">/sub-community/[id]/admin</code> 
                for comprehensive management tools and analytics.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
      
      {/* Content Visibility Section */}
      <section id="visibility" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Content Visibility Guide
            </CardTitle>
            <CardDescription>Understanding and managing who can see what</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    Public Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">Visible to everyone, including non-members</p>
                  <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Best for:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Showcasing community highlights</li>
                      <li>• Attracting new members</li>
                      <li>• Sharing general information</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Members Only
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">Only visible to sub-community members</p>
                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Best for:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Exclusive content and discussions</li>
                      <li>• Member-specific resources</li>
                      <li>• Collaborative projects</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Admins Only
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">Only visible to sub-community and parent community admins</p>
                  <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Best for:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Administrative planning</li>
                      <li>• Sensitive information</li>
                      <li>• Management discussions</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Sharing Prompts to Sub-Communities
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm mb-3">When creating or editing a prompt:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Look for the "Sub-Communities" section in the prompt form</li>
                  <li>Select the sub-communities you want to share with</li>
                  <li>Choose the appropriate visibility level for each</li>
                  <li>Save your prompt to apply the settings</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Invitation System Section */}
      <section id="invitations" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Invitation System
            </CardTitle>
            <CardDescription>How to invite and manage members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Secure Invitations</AlertTitle>
              <AlertDescription>
                Each invitation has a unique code that can be shared as a link or entered manually. 
                Admins can track usage and revoke invitations at any time.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Creating Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Access Admin Dashboard</p>
                        <p className="text-sm text-muted-foreground">Navigate to your sub-community admin panel</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Click "Create Invitation"</p>
                        <p className="text-sm text-muted-foreground">Found in the Members section</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Set Parameters</p>
                        <p className="text-sm text-muted-foreground">Choose max uses (1-100) and expiration date</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1">
                        <span className="text-sm font-bold">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Share the Link</p>
                        <p className="text-sm text-muted-foreground">Copy and share with prospective members</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Invitation Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">Example format:</p>
                    <code className="block bg-muted p-2 rounded text-xs">
                      yoursite.com/invite/sub-community/ABC123
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Links automatically direct users to the acceptance page
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Managing Active Invites
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>View usage statistics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Revoke unused invitations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      <span>Copy invitation links</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Common questions and troubleshooting</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How many sub-communities can I create?</AccordionTrigger>
                <AccordionContent>
                  There's no hard limit on the number of sub-communities you can create. However, 
                  we recommend keeping it organized and manageable. Each parent community admin can 
                  create multiple sub-communities based on their needs.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I transfer ownership of a sub-community?</AccordionTrigger>
                <AccordionContent>
                  Currently, ownership transfer requires contacting support. We're working on implementing 
                  a self-service option in the admin dashboard. Parent community admins always maintain 
                  administrative access to all sub-communities.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>What happens when an invitation expires?</AccordionTrigger>
                <AccordionContent>
                  Expired invitations become invalid and cannot be used to join the sub-community. 
                  The invitation link will show an error message. Admins can create new invitations 
                  at any time from the admin dashboard.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Can members leave a sub-community?</AccordionTrigger>
                <AccordionContent>
                  Yes, members can leave a sub-community at any time from their profile settings 
                  or the sub-community page. They can rejoin later if they have a valid invitation 
                  or if the admin re-invites them.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>How do I report inappropriate content in a sub-community?</AccordionTrigger>
                <AccordionContent>
                  You can report content directly to the sub-community admin or parent community admin. 
                  Look for the report button on individual content items, or contact the admin through 
                  the community page. All reports are handled confidentially.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger>Can non-members see sub-community content?</AccordionTrigger>
                <AccordionContent>
                  It depends on the visibility settings. Public content is visible to everyone, 
                  Members Only content requires membership, and Admins Only content is restricted 
                  to administrators. The visibility badge on each piece of content indicates who can see it.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7">
                <AccordionTrigger>What's the difference between a sub-community admin and a parent admin?</AccordionTrigger>
                <AccordionContent>
                  Sub-community admins manage their specific sub-community, while parent community admins 
                  have oversight of all sub-communities within their parent community. Parent admins can 
                  access and manage any sub-community under their parent community.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator className="my-6" />
            
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Need More Help?</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p>
                    If you couldn't find the answer to your question, we're here to help:
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild className="w-fit">
                      <a href="mailto:support@example.com">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Support
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-fit">
                      <Link href="/community">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Community Forum
                      </Link>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
      
      {/* Back to Top Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          data-testid="back-to-top"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Back to Top
        </Button>
      </div>
    </div>
  );
}