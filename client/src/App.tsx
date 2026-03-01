import * as React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import FindTutorsPage from "@/pages/FindTutorsPage";
import TutorDetailPage from "@/pages/TutorDetailPage";
import SessionsPage from "@/pages/SessionsPage";
import MessagesPage from "@/pages/MessagesPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import GigBoardPage from "@/pages/GigBoardPage";
import PostGigPage from "@/pages/PostGigPage";
import GigDetailPage from "@/pages/GigDetailPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, path }: { component: React.ComponentType<any>; path: string }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-campus">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Route path={path} component={Component as any} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public: Auth page at root when not logged in */}
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center mesh-campus">
            <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
          </div>
        ) : isAuthenticated ? (
          <Redirect to="/dashboard" />
        ) : (
          <AuthPage />
        )}
      </Route>

      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/gig-board" component={GigBoardPage} />
      <ProtectedRoute path="/post-gig" component={PostGigPage} />
      <ProtectedRoute path="/gigs/:gigId" component={GigDetailPage} />
      <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />

      {/* Legacy tutor routes */}
      <ProtectedRoute path="/find-tutors" component={FindTutorsPage} />
      <ProtectedRoute path="/tutors/:tutorId" component={TutorDetailPage} />
      <ProtectedRoute path="/sessions" component={SessionsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
