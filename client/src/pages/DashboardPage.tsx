import * as React from "react";
import { Link } from "wouter";
import { BookMarked, CalendarClock, ChevronRight, GraduationCap, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMySessions } from "@/hooks/use-sessions";
import { useMyTutorProfile, useMyTutorSubjects } from "@/hooks/use-tutors";
import { useMyTuteeProfile } from "@/hooks/use-tutees";
import { cn } from "@/lib/utils";

function centsToDollars(cents?: number | null) {
  if (cents === undefined || cents === null) return "—";
  return `$${(cents / 100).toFixed(0)}`;
}

export default function DashboardPage() {
  const sessions = useMySessions();
  const tutorProfile = useMyTutorProfile();
  const tutorSubjects = useMyTutorSubjects();
  const tuteeProfile = useMyTuteeProfile();

  const upcomingCount =
    (sessions.data ?? []).filter((s) => ["pending", "confirmed"].includes(String(s.status))).length;

  const completedCount =
    (sessions.data ?? []).filter((s) => String(s.status) === "completed").length;

  const avgRate =
    (tutorSubjects.data ?? []).length > 0
      ? Math.round(
        (tutorSubjects.data ?? []).reduce((a, b) => a + (b.hourlyRateCents ?? 0), 0) /
        (tutorSubjects.data ?? []).length,
      )
      : null;

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Upcoming sessions"
              value={sessions.isLoading ? "…" : upcomingCount}
              hint="Pending + confirmed"
              tone="primary"
              icon={<CalendarClock className="h-4 w-4 text-primary" />}
              data-testid="stat-upcoming"
            />
            <StatCard
              label="Completed"
              value={sessions.isLoading ? "…" : completedCount}
              hint="This account, all time"
              tone="accent"
              icon={<Sparkles className="h-4 w-4 text-accent" />}
              data-testid="stat-completed"
            />
          </div>

          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-display text-2xl tracking-tight">Quick actions</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Set up your profile, then book or accept sessions.
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link
                  href="/profile"
                  className={cn(
                    "group rounded-2xl border border-border/70 bg-muted/20 p-4",
                    "hover:bg-muted/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200",
                  )}
                  data-testid="dash-go-profile"
                >
                  <div className="text-sm font-medium">Set up your profiles</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium"><GraduationCap className="h-3 w-3" /> Teacher</span>
                    {" or "}
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium"><BookMarked className="h-3 w-3" /> Student</span>
                    {" — or both!"}
                  </div>
                  <div className="mt-3 inline-flex items-center text-sm font-semibold">
                    Open <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </Link>

                <Link
                  href="/find-tutors"
                  className={cn(
                    "group rounded-2xl border border-border/70 bg-muted/20 p-4",
                    "hover:bg-muted/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200",
                  )}
                  data-testid="dash-go-find"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-accent" />
                    <div className="text-sm font-medium">Find a Teacher</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Browse students who teach near you.
                  </div>
                  <div className="mt-3 inline-flex items-center text-sm font-semibold">
                    Search <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </Link>

                <Link
                  href="/sessions"
                  className={cn(
                    "group rounded-2xl border border-border/70 bg-muted/20 p-4",
                    "hover:bg-muted/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200",
                  )}
                  data-testid="dash-go-sessions"
                >
                  <div className="text-sm font-medium">Sessions timeline</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Confirmed sessions show a meeting link.
                  </div>
                  <div className="mt-3 inline-flex items-center text-sm font-semibold">
                    Open <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
            <div className="p-6">
              <div className="font-display text-xl tracking-tight">Your footprint</div>
              <div className="mt-1 text-sm text-muted-foreground">
                A quick snapshot of how you appear in the marketplace.
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-green-600" /> Teacher profile
                  </div>
                  <div className="text-sm font-medium" data-testid="dash-tutor-profile">
                    {tutorProfile.isLoading ? "…" : tutorProfile.data ? (
                      <span className="text-green-600 font-semibold">Active ✓</span>
                    ) : "Not set"}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="text-sm text-muted-foreground">Subjects I teach</div>
                  <div className="text-sm font-medium" data-testid="dash-subject-count">
                    {tutorSubjects.isLoading ? "…" : (tutorSubjects.data ?? []).length}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="text-sm text-muted-foreground">Avg. hourly rate</div>
                  <div className="text-sm font-medium" data-testid="dash-avg-rate">
                    {tutorSubjects.isLoading ? "…" : centsToDollars(avgRate)}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <BookMarked className="h-3.5 w-3.5 text-blue-600" /> Student profile
                  </div>
                  <div className="text-sm font-medium" data-testid="dash-tutee-profile">
                    {tuteeProfile.isLoading ? "…" : tuteeProfile.data ? (
                      <span className="text-blue-600 font-semibold">Ready ✓</span>
                    ) : "Not set"}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  onClick={() => (window.location.href = "/profile")}
                  data-testid="dash-edit-profile"
                >
                  Edit profiles
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => (window.location.href = "/find-tutors")}
                  data-testid="dash-browse"
                >
                  Browse
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
