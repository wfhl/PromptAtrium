import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Users, Mail, AlertCircle, Loader } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function InvitePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invite/:code");
  
  const [inviteCode, setInviteCode] = useState(params?.code || "");
  const [inviteValidated, setInviteValidated] = useState(false);

  // Validate invite code
  const { data: inviteData, isLoading: validatingInvite, error: inviteError } = useQuery({
    queryKey: ["/api/invites", inviteCode],
    queryFn: () => apiRequest("GET", `/api/invites/${inviteCode}`),
    enabled: !!inviteCode && inviteCode.length > 5,
    retry: false,
    onSuccess: () => setInviteValidated(true),
  });

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/invites/${inviteCode}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Success!",
        description: `You've successfully joined ${inviteData?.community?.name}!`,
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite",
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvite = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to accept this community invite",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }
    acceptInviteMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join Community</h1>
          <p className="text-gray-600 mt-2">Enter your invite code to join a community</p>
        </div>

        {!inviteCode && !match ? (
          /* Manual invite code entry */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Enter Invite Code
              </CardTitle>
              <CardDescription>
                Enter the invite code you received to join a community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter invite code..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                data-testid="input-invite-code"
              />
              <Button 
                onClick={() => setInviteValidated(false)}
                disabled={!inviteCode || inviteCode.length < 5}
                className="w-full"
                data-testid="button-validate-invite"
              >
                Validate Invite
              </Button>
            </CardContent>
          </Card>
        ) : validatingInvite ? (
          /* Loading state while validating */
          <Card>
            <CardContent className="p-8 text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-medium">Validating invite...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we check your invite code</p>
            </CardContent>
          </Card>
        ) : inviteError ? (
          /* Invalid invite */
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">Invalid Invite</h2>
              <p className="text-red-600 mb-4">
                {(inviteError as any)?.message || "This invite code is invalid, expired, or has been used up."}
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setInviteCode("");
                  setInviteValidated(false);
                }}
                data-testid="button-try-again"
              >
                Try Different Code
              </Button>
            </CardContent>
          </Card>
        ) : inviteData ? (
          /* Valid invite - show community info and accept button */
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Valid Invite
              </CardTitle>
              <CardDescription>
                You've been invited to join this community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">{inviteData.community?.name}</h3>
                    <p className="text-sm text-green-700">{inviteData.community?.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Uses:</strong> {inviteData.currentUses} of {inviteData.maxUses}</p>
                {inviteData.expiresAt && (
                  <p><strong>Expires:</strong> {new Date(inviteData.expiresAt).toLocaleDateString()}</p>
                )}
              </div>

              {acceptInviteMutation.isSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Successfully joined!</p>
                  <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
                </div>
              ) : (
                <Button 
                  onClick={handleAcceptInvite}
                  disabled={acceptInviteMutation.isPending}
                  className="w-full"
                  data-testid="button-accept-invite"
                >
                  {acceptInviteMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    "Accept Invite & Join Community"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Don't have an invite code? Contact a community admin.</p>
        </div>
      </div>
    </div>
  );
}