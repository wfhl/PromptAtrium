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
import Invite from "@/pages/invite";
import ProfileSettings from "@/pages/profile-settings";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/library" component={Library} />
            <Route path="/community" component={Community} />
            <Route path="/projects" component={Projects} />
            <Route path="/collections" component={Collections} />
            <Route path="/admin" component={Admin} />
            <Route path="/profile/settings" component={ProfileSettings} />
          </Switch>
        </Layout>
      )}
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
