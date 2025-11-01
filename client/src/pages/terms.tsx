import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ScrollText, Shield, Users, Gavel, AlertTriangle, Ban, Scale, Mail, ArrowLeft, FileText, CheckCircle } from "lucide-react";

export default function TermsAndConditions() {
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
            <ScrollText className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Quick Summary */}
        <Alert className="mb-8 border-amber-500/50 bg-amber-500/10">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Summary:</strong> Use PromptAtrium responsibly, respect others' content, 
            follow community guidelines, and understand that the service is provided "as is". 
            Full terms below.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                By accessing or using PromptAtrium ("the Service"), you agree to be bound by these 
                Terms and Conditions ("Terms"). If you disagree with any part of these terms, 
                you do not have permission to access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service, 
                including but not limited to registered users, content creators, and API users.
              </p>
              <p>
                We reserve the right to update these Terms at any time. We will notify users of 
                significant changes via email or prominent notice on our Service. Your continued 
                use after such modifications constitutes acceptance of the updated Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. Account Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Creation</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You must be 13 years or older to use this Service</li>
                  <li>You must provide accurate and complete registration information</li>
                  <li>You are responsible for maintaining the security of your account and password</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You may not use the Service for any illegal or unauthorized purpose</li>
                  <li>You must not transmit any worms, viruses, or malicious code</li>
                  <li>One person or legal entity may maintain no more than one account</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Username Policy</h3>
                <p>
                  Usernames are provided on a first-come, first-served basis and cannot be 
                  changed once set. We reserve the right to remove or reclaim usernames that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Violate trademark or intellectual property rights</li>
                  <li>Impersonate others in a misleading manner</li>
                  <li>Contain offensive or inappropriate content</li>
                  <li>Are inactive for extended periods</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                3. Content Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Content</h3>
                <p className="mb-2">By posting content on PromptAtrium, you:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Retain ownership of content you create</li>
                  <li>Grant us a license to display, distribute, and promote your public content</li>
                  <li>Confirm you have the right to share the content</li>
                  <li>Accept responsibility for the content's legality and appropriateness</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Prohibited Content</h3>
                <p className="mb-2">You may not post content that:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains hate speech, harassment, or threats</li>
                  <li>Includes spam, malware, or phishing attempts</li>
                  <li>Depicts illegal activities or extreme violence</li>
                  <li>Violates others' privacy or shares personal information without consent</li>
                  <li>Misrepresents facts or spreads misinformation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">NSFW Content</h3>
                <p>
                  Adult or NSFW (Not Safe For Work) content must be properly marked. 
                  Users can control NSFW visibility in their settings. Failure to properly 
                  mark NSFW content may result in content removal or account suspension.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Content Moderation</h3>
                <p>
                  We reserve the right to remove content that violates these Terms or 
                  community guidelines. Repeated violations may result in account suspension 
                  or termination.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                4. Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Rights</h3>
                <p>
                  You retain all rights to the content you create and share on PromptAtrium. 
                  By making content public, you grant us a non-exclusive, worldwide, royalty-free 
                  license to use, display, and distribute your content as part of the Service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Platform Rights</h3>
                <p>
                  The PromptAtrium platform, including its design, features, and functionality, 
                  is owned by us and protected by intellectual property laws. You may not copy, 
                  modify, or reverse engineer any part of the Service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Branching & Attribution</h3>
                <p>
                  When branching another user's prompt:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>The original creator is automatically attributed</li>
                  <li>You must not remove or hide this attribution</li>
                  <li>You may modify the branched content</li>
                  <li>The branch creates a new work that you own</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">DMCA Compliance</h3>
                <p>
                  We respect intellectual property rights and will respond to valid DMCA 
                  takedown requests. If you believe your copyright has been infringed, 
                  please contact us with:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Identification of the copyrighted work</li>
                  <li>Identification of the infringing material</li>
                  <li>Your contact information</li>
                  <li>A statement of good faith belief</li>
                  <li>A statement of accuracy under penalty of perjury</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                5. Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-foreground font-semibold">
                To maintain a positive community, all users must:
              </p>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Be Respectful</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Treat all users with respect and courtesy</li>
                  <li>Provide constructive feedback</li>
                  <li>Respect diverse perspectives and styles</li>
                  <li>Avoid personal attacks or harassment</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Be Honest</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Don't misrepresent your identity or affiliations</li>
                  <li>Don't manipulate engagement metrics</li>
                  <li>Don't create fake accounts or reviews</li>
                  <li>Properly attribute sources and inspirations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Be Helpful</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Share knowledge and help newcomers</li>
                  <li>Report bugs and provide feedback</li>
                  <li>Contribute to a positive community atmosphere</li>
                  <li>Flag inappropriate content when you see it</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                6. Service Availability & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service Availability</h3>
                <p>
                  While we strive for 99.9% uptime, we cannot guarantee uninterrupted access to 
                  the Service. The Service may be unavailable due to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Scheduled maintenance (announced in advance)</li>
                  <li>Emergency repairs or updates</li>
                  <li>Force majeure events</li>
                  <li>Internet or infrastructure failures</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Service Modifications</h3>
                <p>
                  We reserve the right to modify or discontinue any aspect of the Service at 
                  any time. Major changes will be announced in advance when possible.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">API Limitations</h3>
                <p>
                  If we provide API access:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Rate limits apply to prevent abuse</li>
                  <li>Commercial use requires prior approval</li>
                  <li>We may revoke access for violations</li>
                  <li>API terms are subject to additional agreements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                7. Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Right to Terminate</h3>
                <p>
                  You may terminate your account at any time through your account settings. 
                  Upon termination:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Your profile will be deactivated</li>
                  <li>Your content may be removed from public view</li>
                  <li>Some information may be retained for legal purposes</li>
                  <li>You can request data deletion per our Privacy Policy</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Right to Terminate</h3>
                <p>
                  We may suspend or terminate accounts that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Violate these Terms or community guidelines</li>
                  <li>Engage in illegal activities</li>
                  <li>Harm other users or the Service</li>
                  <li>Remain inactive for extended periods</li>
                </ul>
                <p className="mt-2">
                  In cases of severe violations, termination may be immediate without warning.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                8. Disclaimers & Limitations of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <Alert className="border-red-500/50 bg-red-500/10 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> The Service is provided "AS IS" without warranties 
                  of any kind, either express or implied.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-foreground mb-2">No Warranties</h3>
                <p>
                  We do not warrant that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>The Service will meet your requirements</li>
                  <li>The Service will be uninterrupted or error-free</li>
                  <li>Results obtained will be accurate or reliable</li>
                  <li>Any errors in the Service will be corrected</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by law, we shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages resulting 
                  from your use or inability to use the Service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Indemnification</h3>
                <p>
                  You agree to indemnify and hold us harmless from any claims arising from:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third party rights</li>
                  <li>Your content posted on the Service</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Governing Law & Disputes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                These Terms are governed by the laws of [Jurisdiction] without regard to 
                conflict of law principles.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service shall 
                be resolved through binding arbitration, except where prohibited by law. 
                You waive any right to a jury trial or class action lawsuit.
              </p>
              <p>
                Small claims court actions may be brought in your local jurisdiction 
                for disputes under the small claims threshold.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. General Provisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Entire Agreement</h3>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire 
                  agreement between you and PromptAtrium regarding the Service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Severability</h3>
                <p>
                  If any provision of these Terms is found to be unenforceable, the 
                  remaining provisions will continue in effect.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Waiver</h3>
                <p>
                  Our failure to enforce any provision of these Terms shall not be 
                  considered a waiver of that provision.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Assignment</h3>
                <p>
                  You may not assign these Terms without our prior written consent. 
                  We may assign our rights and obligations without restriction.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                For questions about these Terms, please contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> legal@promptatrium.com</p>
                <p><strong>Support:</strong> support@promptatrium.com</p>
                <p><strong>Mailing Address:</strong> [Your Business Address]</p>
              </div>
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertDescription>
                  For support issues, please use the in-app support feature for fastest response.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p>
            By using PromptAtrium, you acknowledge that you have read, understood, and agree 
            to be bound by these Terms & Conditions.
          </p>
          <p className="mt-4">
            Effective date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}