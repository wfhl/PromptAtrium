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
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
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
        </>
      )}
      <Route path="/user/:username">
        {() => <Layout><UserProfile /></Layout>}
      </Route>
      <Route path="/invite/:code" component={Invite} />
      <Route path="/invite" component={Invite} />
      <Route component={NotFound} />
    </Switch>
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
