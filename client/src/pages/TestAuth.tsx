import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, Shield, CreditCard, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function TestAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const testUsers = [
    {
      id: "super_1761503615314",
      name: "Test Seller",
      description: "Super admin with seller profile and PayPal setup",
      features: ["Can sell prompts", "Has PayPal payout configured", "Can access admin panel"],
      icon: Shield,
      color: "text-purple-600 bg-purple-50"
    },
    {
      id: "test_buyer_001",
      name: "Test Buyer",
      description: "Regular user who can purchase prompts",
      features: ["Can browse marketplace", "Can purchase prompts", "Has purchase history"],
      icon: User,
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: "member_1761503615314",
      name: "Test Member",
      description: "Community member with basic access",
      features: ["Can view prompts", "Can join communities", "Can like and comment"],
      icon: User,
      color: "text-green-600 bg-green-50"
    }
  ];

  const handleTestLogin = async (userId: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Create a test session for the user
      const response = await fetch("/api/test/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error("Failed to create test session");
      }

      // Reload the page to get the new session
      window.location.href = "/marketplace";
    } catch (err) {
      setError("Test authentication is not available. Please use the regular login flow.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Marketplace Test Mode
          </CardTitle>
          <CardDescription className="text-lg">
            Select a test user to explore the marketplace functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Mode:</strong> This page is for testing the marketplace payment system.
              All transactions are simulated and no real money is involved.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {testUsers.map((user) => (
              <Card key={user.id} className="relative overflow-hidden">
                <div className={`absolute inset-0 ${user.color} opacity-5`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${user.color}`}>
                          <user.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                      </div>
                      <p className="text-muted-foreground mb-3">{user.description}</p>
                      <div className="space-y-1">
                        {user.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleTestLogin(user.id)}
                      disabled={isLoading}
                      className="ml-4"
                      data-testid={`test-login-${user.id}`}
                    >
                      {isLoading ? "Loading..." : "Use This Account"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Testing Workflow:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Select "Test Seller" to create and manage listings</li>
              <li>Go to Seller Dashboard to complete PayPal/Stripe setup</li>
              <li>Create a test listing with your prompt</li>
              <li>Switch to "Test Buyer" to purchase the listing</li>
              <li>Return to "Test Seller" to view earnings and payouts</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-yellow-900">PayPal Configuration:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>As Test Seller, go to Admin → PayPal Config</li>
              <li>Add your PayPal Client ID and Secret as Replit Secrets</li>
              <li>Configure webhook URL in PayPal Developer Dashboard</li>
              <li>Enable PayPal payouts in the admin panel</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}