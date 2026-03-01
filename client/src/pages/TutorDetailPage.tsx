import * as React from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CalendarClock, Clock, GraduationCap, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useTutorDetail } from "@/hooks/use-tutors";
import { useCreateSession } from "@/hooks/use-sessions";
import { BookSessionDialog } from "@/components/forms/BookSessionDialog";
import { useToast } from "@/hooks/use-toast";
import { useReviewsForUser } from "@/hooks/use-reviews";
import { ReviewList } from "@/components/ReviewList";
import { useAuth } from "@/hooks/use-auth";
import { Link as WouterLink } from "wouter";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function TutorDetailPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/tutors/:tutorId");
  const tutorId = params?.tutorId;

  const detail = useTutorDetail(tutorId);
  const createSession = useCreateSession();
  const { data: authUser } = useAuth();
  const reviewsQuery = useReviewsForUser(tutorId);

  const [bookOpen, setBookOpen] = React.useState(false);

  const t = detail.data;

  return (
    <AppShell title="Tutor">
      <div className="mb-4">
        <Link
          href="/find-tutors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="tutor-detail-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
      </div>

      {detail.isLoading ? (
        <Card className="rounded-3xl border border-card-border/70 bg-card p-6 shadow-sm">
          <div className="h-5 w-56 rounded-lg bg-muted/60 animate-shimmer bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--muted))_40%,hsl(var(--background))_50%,hsl(var(--muted))_60%,hsl(var(--muted))_100%)]" />
          <div className="mt-3 h-4 w-80 rounded-lg bg-muted/60 animate-shimmer bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--muted))_40%,hsl(var(--background))_50%,hsl(var(--muted))_60%,hsl(var(--muted))_100%)]" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl border border-border/70 bg-muted/30"
              />
            ))}
          </div>
        </Card>
      ) : detail.isError ? (
        <Card className="rounded-3xl border border-destructive/30 bg-card p-6 shadow-sm">
          <div className="font-display text-xl tracking-tight">Couldn’t load tutor</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {(detail.error as any)?.message ?? "Unknown error"}
          </div>
          <Button
            type="button"
            className="mt-4 rounded-xl"
            onClick={() => detail.refetch()}
            data-testid="tutor-detail-retry"
          >
            Retry
          </Button>
        </Card>
      ) : !t ? (
        <EmptyState
          icon={<GraduationCap className="h-5 w-5 text-primary" />}
          title="Tutor not found"
          description="This profile may have been removed. Go back to search and try another."
          actionLabel="Back to search"
          onAction={() => (window.location.href = "/find-tutors")}
          data-testid="tutor-not-found"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay overflow-hidden">
              <div className="relative p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(circle_at_85%_25%,hsl(var(--accent)/0.12),transparent_55%)]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-display text-3xl tracking-tight">
                        {[t.user.firstName, t.user.lastName].filter(Boolean).join(" ") ||
                          t.user.email ||
                          "Tutor"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {t.tutorProfile.university}
                        {t.tutorProfile.major ? ` • ${t.tutorProfile.major}` : ""}
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setBookOpen(true)}
                      className="
                        rounded-xl px-5
                        bg-gradient-to-r from-primary to-primary/80
                        text-primary-foreground shadow-lg shadow-primary/20
                        hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5
                        transition-all duration-200
                      "
                      data-testid="tutor-detail-book"
                    >
                      <CalendarClock className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Book</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => (window.location.href = `/messages`)}
                      className="rounded-xl"
                      data-testid="tutor-detail-message"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Message</span>
                    </Button>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    {t.tutorProfile.bio ||
                      "No bio yet. Message with notes when requesting a session."}
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Proficiency
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t.subjects.length > 0
                          ? `Offers ${t.subjects.length} subject${t.subjects.length === 1 ? "" : "s"}`
                          : "No subjects listed yet"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-[hsl(var(--chart-3))]" />
                        Availability
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t.availability.length} weekly window{t.availability.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Status
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t.tutorProfile.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
              <div className="p-6">
                <div className="font-display text-2xl tracking-tight">Subjects</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Pick one when booking, or mention a custom topic in notes.
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.subjects ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="
                        rounded-2xl border border-border/70 bg-muted/10 p-4
                        hover:bg-muted/20 hover:shadow-sm transition-all duration-200
                      "
                      data-testid={`tutor-detail-subject-${s.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.subject}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {String(s.proficiency)} • {dollars(s.hourlyRateCents)}/hr
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold">
                          {dollars(s.hourlyRateCents)}
                        </div>
                      </div>
                      {s.description ? (
                        <div className="mt-3 text-xs text-muted-foreground">{s.description}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Reviews */}
            <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
              <div className="p-6">
                <div className="font-display text-2xl tracking-tight">Reviews</div>
                <div className="mt-4">
                  {reviewsQuery.isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading reviews...</div>
                  ) : (
                    <ReviewList
                      reviews={(reviewsQuery.data as any)?.reviews ?? []}
                      averageRating={(reviewsQuery.data as any)?.averageRating ?? null}
                      totalReviews={(reviewsQuery.data as any)?.totalReviews ?? 0}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
              <div className="p-6">
                <div className="font-display text-2xl tracking-tight">Availability</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Weekly windows (day + time). You can propose any time when booking.
                </div>

                <div className="mt-5 space-y-3">
                  {(t.availability ?? [])
                    .slice()
                    .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3"
                        data-testid={`tutor-detail-availability-${a.id}`}
                      >
                        <div className="font-medium">
                          {dayLabels[a.dayOfWeek ?? 0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.startTime}–{a.endTime}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <div className="font-medium">Booking tip</div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    Include your syllabus section, problem set link, or exam date in notes.
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setBookOpen(true)}
                  className="
                    mt-4 w-full rounded-xl
                    bg-gradient-to-r from-primary to-primary/80
                    text-primary-foreground shadow-lg shadow-primary/20
                    hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5
                    transition-all duration-200
                  "
                  data-testid="tutor-detail-book-bottom"
                >
                  Request session
                </Button>
              </div>
            </Card>
          </div>

          <BookSessionDialog
            open={bookOpen}
            onOpenChange={setBookOpen}
            tutorId={t.user.id}
            subjects={t.subjects ?? []}
            isPending={createSession.isPending}
            onSubmit={(values) =>
              createSession.mutate(values, {
                onSuccess: () => {
                  toast({ title: "Requested", description: "Session request sent." });
                  setBookOpen(false);
                  window.location.href = "/sessions";
                },
                onError: (e: any) =>
                  toast({
                    title: "Request failed",
                    description: String(e.message ?? e),
                    variant: "destructive" as any,
                  }),
              })
            }
          />
        </div>
      )}
    </AppShell>
  );
}
