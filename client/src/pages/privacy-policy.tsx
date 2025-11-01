import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Lock, Shield, Eye, Database, Cookie, UserCheck, Mail, ArrowLeft, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Quick Summary */}
        <Alert className="mb-8 border-purple-500/50 bg-purple-500/10">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Your Privacy Matters:</strong> We collect only essential information, never sell your data, 
            and give you full control over your information. Read below for details.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Email address for authentication and communication</li>
                  <li>Username and display name you choose</li>
                  <li>Profile information you voluntarily provide (bio, website, social links)</li>
                  <li>Profile picture if you choose to upload one</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Content You Create</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Prompts, including text and any generated images you upload</li>
                  <li>Collections and their metadata</li>
                  <li>Comments and interactions with other users' content</li>
                  <li>Likes, bookmarks, and branches of prompts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Login timestamps and session information</li>
                  <li>Feature usage statistics (anonymized)</li>
                  <li>Device type and browser information for compatibility</li>
                  <li>IP address for security and abuse prevention</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">To Provide Our Services</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Authenticate your account and maintain sessions</li>
                  <li>Display your profile and content to other users (respecting privacy settings)</li>
                  <li>Enable community features like following, commenting, and sharing</li>
                  <li>Send notifications about interactions with your content</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">To Improve PromptAtrium</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Analyze usage patterns to improve features</li>
                  <li>Debug issues and maintain platform stability</li>
                  <li>Develop new features based on community needs</li>
                  <li>Prevent abuse and maintain community standards</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Communications</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Essential service updates and security alerts</li>
                  <li>Optional newsletters about new features (you can opt-out)</li>
                  <li>Responses to your support requests</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All data transmission is encrypted using HTTPS/TLS</li>
                <li>Passwords are hashed using bcrypt before storage</li>
                <li>Regular security audits and updates</li>
                <li>Access controls limiting data access to authorized personnel</li>
                <li>Regular backups to prevent data loss</li>
              </ul>
              <Alert className="mt-4">
                <AlertDescription>
                  While we strive to protect your information, no method of electronic storage 
                  is 100% secure. We cannot guarantee absolute security but commit to promptly 
                  notifying you of any breaches.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookies & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p className="mb-2">We use essential cookies for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintaining your login session</li>
                  <li>Remembering your preferences (theme, language)</li>
                  <li>Security features and CSRF protection</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
                <p>
                  We may use privacy-focused analytics (like Plausible or Fathom) to understand 
                  usage patterns. These tools don't track individual users or use cookies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Third-Party Services</h3>
                <p>
                  We don't use third-party tracking cookies or advertising networks. 
                  Any third-party services we integrate (like image hosting) are chosen 
                  for their privacy practices.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Your Rights & Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-foreground font-semibold">
                You have complete control over your data:
              </p>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Access & Portability</h3>
                <p>
                  You can request a copy of all your data in a machine-readable format 
                  through your account settings or by contacting support.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Correction</h3>
                <p>
                  Update your information anytime through your profile settings. 
                  Contact us if you need help with corrections.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Deletion</h3>
                <p>
                  You can delete your account and all associated data through account settings. 
                  Some information may be retained for legal obligations or abuse prevention.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Privacy Controls</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Set your profile to public or private</li>
                  <li>Control who can see your email and personal information</li>
                  <li>Manage notification preferences</li>
                  <li>Block users you don't want to interact with</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Opt-Out</h3>
                <p>
                  You can opt-out of non-essential communications and features 
                  while maintaining your account.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We retain your information only as long as necessary:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Active account data is kept while your account is active</li>
                <li>Deleted content is removed from public view immediately and from backups within 30 days</li>
                <li>After account deletion, some data may be retained for up to 90 days for recovery purposes</li>
                <li>Anonymized analytics data may be kept indefinitely for service improvement</li>
                <li>Data required for legal obligations is retained as required by law</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                PromptAtrium is not intended for users under 13 years of age. 
                We do not knowingly collect information from children under 13. 
                If we discover we've collected data from a child under 13, 
                we will delete it immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Users</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                PromptAtrium serves users globally. By using our service, you consent 
                to your information being processed in the country where our servers 
                are located. We ensure appropriate safeguards for international data transfers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We may update this policy occasionally. Significant changes will be:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Announced via email to all users</li>
                <li>Displayed prominently on the platform</li>
                <li>Subject to a review period before taking effect</li>
              </ul>
              <p className="mt-4">
                Continued use after changes means you accept the updated policy. 
                You can always view the policy history in our transparency reports.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Questions or concerns about your privacy? We're here to help:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> privacy@promptatrium.com</p>
                <p><strong>Support:</strong> Use the in-app support feature</p>
                <p><strong>Data Protection Officer:</strong> dpo@promptatrium.com</p>
              </div>
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertDescription>
                  For fastest response, please include your username and clearly describe 
                  your privacy concern or request.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p>
            This privacy policy is effective as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
            and applies to all users of PromptAtrium.
          </p>
        </div>
      </div>
    </div>
  );
}