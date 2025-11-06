import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { InviteAcceptanceForm } from "@/components/InviteAcceptanceForm";
import { Loader } from "lucide-react";

export default function InvitePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/invite/:code");
  
  const inviteCode = params?.code || "";

  // Store invite code in sessionStorage when we have it and user is not authenticated
  useEffect(() => {
    if (inviteCode && !user) {
      sessionStorage.setItem("pendingInviteCode", inviteCode);
    }
  }, [inviteCode, user]);

  // Check for pending invite after login and redirect to the invite page
  useEffect(() => {
    if (user && !inviteCode) {
      const pendingCode = sessionStorage.getItem("pendingInviteCode");
      if (pendingCode) {
        setLocation(`/invite/${pendingCode}`);
      }
    }
  }, [user, inviteCode, setLocation]);

  // Handle authentication requirement for direct invite links
  useEffect(() => {
    if (!authLoading && !user && inviteCode) {
      // Just store the code, let the InviteAcceptanceForm component handle the auth flow
      sessionStorage.setItem("pendingInviteCode", inviteCode);
    }
  }, [authLoading, user, inviteCode]);

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
          <p className="text-gray-600 mt-2">
            {inviteCode ? "Validating your invite code..." : "Enter your invite code to join a community"}
          </p>
        </div>

        {/* Use the reusable InviteAcceptanceForm component */}
        <InviteAcceptanceForm initialCode={inviteCode} embedded={false} />

        {/* Footer */}
        {!inviteCode && (
          <div className="text-center text-sm text-gray-500">
            <p>Don't have an invite code? Contact a community admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}