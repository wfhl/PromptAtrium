import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Library from "@/pages/library";
import Community from "@/pages/community";
import Projects from "@/pages/projects";
import Admin from "@/pages/admin";
import Collections from "@/pages/collections";
import CollectionView from "@/pages/CollectionView";
import Invite from "@/pages/invite";
import ProfileSettings from "@/pages/profile-settings";
import UserProfile from "@/pages/user-profile";
import LikedPrompts from "@/pages/LikedPrompts";
import ForkedPrompts from "@/pages/ForkedPrompts";
import AspectRatioCalculatorPage from "@/pages/tools/aspect-ratio-calculator";
import MetadataAnalyzerPage from "@/pages/tools/metadata-analyzer";
import InstallGuide from "@/pages/install-guide";
import PromptDetail from "@/pages/prompt-detail";
import PromptingGuides from "@/pages/prompting-guides";
import GettingStarted from "@/pages/getting-started";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsAndConditions from "@/pages/terms";
import { IntroductionModal } from "@/components/IntroductionModal";
import { useAuth } from "@/hooks/useAuth";
import { useDynamicManifest } from "@/hooks/useDynamicManifest";
import type { User } from "@shared/schema";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  useDynamicManifest();
  const [showIntroModal, setShowIntroModal] = useState(false);
  
  useEffect(() => {
    // Show intro modal if user is authenticated and hasn't completed intro
    // Only show if they don't have a username set
    if (isAuthenticated && user && !(user as User).hasCompletedIntro && !(user as User).username) {
      setShowIntroModal(true);
    } else if (isAuthenticated && user && (user as User).hasCompletedIntro) {
      // If intro is completed, make sure modal is closed
      setShowIntroModal(false);
    }
  }, [isAuthenticated, user]);

  // Temporary: Add keyboard shortcut to show intro modal for testing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'I' && isAuthenticated && user) {
        setShowIntroModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated, user]);
  
  const handleIntroComplete = () => {
    setShowIntroModal(false);
    // Refresh user data to reflect the changes
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return (
    <>
      {/* Introduction Modal for new users */}
      {isAuthenticated && user && (
        <IntroductionModal
          open={showIntroModal}
          onComplete={handleIntroComplete}
          user={user}
        />
      )}
      
      <Switch>
        {/* Public routes - always accessible */}
        <Route path="/prompt/:id">
          {() => isAuthenticated ? <Layout><PromptDetail /></Layout> : <PromptDetail />}
        </Route>
        <Route path="/user/:username">
          {() => isAuthenticated ? <Layout><UserProfile /></Layout> : <UserProfile />}
        </Route>
        <Route path="/tools/aspect-ratio-calculator">
          {() => isAuthenticated ? <Layout><AspectRatioCalculatorPage /></Layout> : <AspectRatioCalculatorPage />}
        </Route>
        <Route path="/tools/metadata-analyzer">
          {() => isAuthenticated ? <Layout><MetadataAnalyzerPage /></Layout> : <MetadataAnalyzerPage />}
        </Route>
        <Route path="/prompting-guides">
          {() => isAuthenticated ? <Layout><PromptingGuides /></Layout> : <PromptingGuides />}
        </Route>
        <Route path="/getting-started">
          {() => isAuthenticated ? <Layout><GettingStarted /></Layout> : <GettingStarted />}
        </Route>
        <Route path="/privacy-policy">
          {() => isAuthenticated ? <Layout><PrivacyPolicy /></Layout> : <PrivacyPolicy />}
        </Route>
        <Route path="/terms">
          {() => isAuthenticated ? <Layout><TermsAndConditions /></Layout> : <TermsAndConditions />}
        </Route>
        <Route path="/invite/:code" component={Invite} />
        <Route path="/invite" component={Invite} />
        
        {/* Conditional routes based on authentication */}
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/">
              {() => <Layout><Dashboard /></Layout>}
            </Route>
            <Route path="/library">
              {() => <Layout><Library /></Layout>}
            </Route>
            <Route path="/community">
              {() => <Layout><Community /></Layout>}
            </Route>
            <Route path="/projects">
              {() => <Layout><Projects /></Layout>}
            </Route>
            <Route path="/collections">
              {() => <Layout><Collections /></Layout>}
            </Route>
            <Route path="/collection/:id">
              {() => <Layout><CollectionView /></Layout>}
            </Route>
            <Route path="/admin">
              {() => <Layout><Admin /></Layout>}
            </Route>
            <Route path="/profile/settings">
              {() => <Layout><ProfileSettings /></Layout>}
            </Route>
            <Route path="/liked-prompts">
              {() => <Layout><LikedPrompts /></Layout>}
            </Route>
            <Route path="/forked-prompts">
              {() => <Layout><ForkedPrompts /></Layout>}
            </Route>
            <Route path="/install-guide">
              {() => <Layout><InstallGuide /></Layout>}
            </Route>
          </>
        )}
        
        {/* 404 fallback - must be last */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
