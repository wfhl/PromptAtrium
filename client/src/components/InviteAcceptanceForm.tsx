import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Users, AlertCircle, Loader, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface InviteResponse {
  type: 'community' | 'sub-community';
  invite: {
    code: string;
    role: string;
    currentUses: number;
    maxUses: number;
    expiresAt?: string;
    isActive: boolean;
    community?: {
      id: string;
      name: string;
      description?: string;
      memberCount?: number;
    };
    subCommunity?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}

interface InviteAcceptanceFormProps {
  embedded?: boolean; // When true, used in settings page
  initialCode?: string;
}

export function InviteAcceptanceForm({ embedded = false, initialCode = "" }: InviteAcceptanceFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [validatedCode, setValidatedCode] = useState("");
  const [hasAccepted, setHasAccepted] = useState(false);

  // Auto-validate if an initial code is provided
  useEffect(() => {
    if (initialCode && initialCode.length > 5) {
      setInviteCode(initialCode);
      setValidatedCode(initialCode);
    }
  }, [initialCode]);

  // Auto-accept after login if this is the pending invite
  useEffect(() => {
    if (user && validatedCode && inviteData && !hasAccepted && !acceptInviteMutation.isPending && !embedded) {
      const pendingCode = sessionStorage.getItem("pendingInviteCode");
      if (pendingCode === validatedCode) {
        // Clear the pending code and auto-accept
        sessionStorage.removeItem("pendingInviteCode");
        acceptInviteMutation.mutate();
      }
    }
  }, [user, validatedCode, inviteData, hasAccepted, embedded]);

  // Validate invite code
  const { data: inviteData, isLoading: validatingInvite, error: inviteError, refetch } = useQuery<InviteResponse>({
    queryKey: [`/api/invites/${validatedCode}`],
    enabled: !!validatedCode && validatedCode.length > 5,
    retry: false,
  });

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/invites/${validatedCode}/accept`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept invite");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setHasAccepted(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/sub-communities"] });
      
      const communityName = inviteData?.invite?.community?.name || inviteData?.invite?.subCommunity?.name;
      toast({
        title: "Success!",
        description: `You've successfully joined ${communityName}!`,
      });
      
      if (!embedded) {
        // Redirect to appropriate page
        setTimeout(() => {
          if (data.type === 'community') {
            setLocation(`/community/${data.communityId}`);
          } else if (data.type === 'sub-community') {
            setLocation(`/sub-community/${data.subCommunityId}/content`);
          } else {
            setLocation("/dashboard");
          }
        }, 2000);
      } else {
        // Reset form for next use in settings
        setTimeout(() => {
          setInviteCode("");
          setValidatedCode("");
          setHasAccepted(false);
        }, 3000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite",
        variant: "destructive",
      });
    },
  });

  const handleValidateCode = () => {
    if (inviteCode && inviteCode.length > 5) {
      setValidatedCode(inviteCode);
      setHasAccepted(false);
    }
  };

  const handleAcceptInvite = () => {
    if (!user && !embedded) {
      // For non-embedded forms (invite page), redirect to login
      sessionStorage.setItem("pendingInviteCode", validatedCode);
      toast({
        title: "Login Required",
        description: "Please log in to accept this invite. You'll be redirected back after logging in.",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    } else if (!user && embedded) {
      // For embedded forms (settings page), user should already be logged in
      toast({
        title: "Authentication Required",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    acceptInviteMutation.mutate();
  };

  const handleReset = () => {
    setInviteCode("");
    setValidatedCode("");
    setHasAccepted(false);
  };

  // Show input form when no code is being validated
  if (!validatedCode) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-code">Invite Code</Label>
          <div className="flex gap-2">
            <Input
              id="invite-code"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              data-testid="input-invite-code"
            />
            <Button 
              onClick={handleValidateCode}
              disabled={!inviteCode || inviteCode.length < 5}
              data-testid="button-validate-invite"
            >
              Validate
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the invite code you received to join a community or sub-community
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (validatingInvite) {
    return (
      <Alert>
        <Loader className="h-4 w-4 animate-spin" />
        <AlertTitle>Validating invite...</AlertTitle>
        <AlertDescription>Please wait while we check your invite code</AlertDescription>
      </Alert>
    );
  }

  // Show error state
  if (inviteError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Invite</AlertTitle>
        <AlertDescription>
          This invite code is invalid, expired, or has been used up.
          <Button 
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleReset}
            data-testid="button-try-again"
          >
            Try Different Code
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show invite details and accept button
  if (inviteData) {
    if (hasAccepted || acceptInviteMutation.isSuccess) {
      return (
        <Alert className="border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Successfully joined!</AlertTitle>
          <AlertDescription className="text-green-600">
            You are now a member of {inviteData.invite.community?.name || inviteData.invite.subCommunity?.name}
            {!embedded && " - Redirecting..."}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Valid Invite
          </CardTitle>
          <CardDescription>
            You've been invited to join {inviteData.type === 'community' ? 'this community' : 'this sub-community'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">
                  {inviteData.invite.community?.name || inviteData.invite.subCommunity?.name}
                </h3>
                <p className="text-sm text-green-700">
                  {inviteData.invite.community?.description || inviteData.invite.subCommunity?.description}
                </p>
                {inviteData.invite.community?.memberCount !== undefined && (
                  <p className="text-xs text-green-600 mt-1">
                    {inviteData.invite.community.memberCount} members
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Role:</strong> {inviteData.invite.role}</p>
            <p><strong>Uses:</strong> {inviteData.invite.currentUses} of {inviteData.invite.maxUses}</p>
            {inviteData.invite.expiresAt && (
              <p><strong>Expires:</strong> {new Date(inviteData.invite.expiresAt).toLocaleDateString()}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAcceptInvite}
              disabled={acceptInviteMutation.isPending}
              className="flex-1"
              data-testid="button-accept-invite"
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                `Accept Invite & Join ${inviteData.type === 'community' ? 'Community' : 'Sub-Community'}`
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleReset}
              disabled={acceptInviteMutation.isPending}
              data-testid="button-cancel-invite"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}