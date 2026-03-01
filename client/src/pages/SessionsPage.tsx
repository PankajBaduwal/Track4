import * as React from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, Sparkles, Star, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useMySessions, useUpdateSession } from "@/hooks/use-sessions";
import { useToast } from "@/hooks/use-toast";
import type { MarketplaceSession } from "@shared/schema";
import { ReviewForm } from "@/components/forms/ReviewForm";

function badgeTone(status: string) {
  switch (status) {
    case "pending":
      return "border-[hsl(var(--chart-3)/0.35)] bg-[hsl(var(--chart-3)/0.10)] text-foreground";
    case "confirmed":
      return "border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--accent)/0.12)] text-foreground";
    case "completed":
      return "border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.12)] text-foreground";
    case "cancelled":
      return "border-[hsl(var(--destructive)/0.35)] bg-[hsl(var(--destructive)/0.10)] text-foreground";
    default:
      return "border-border/70 bg-muted/20 text-foreground";
  }
}

function formatWhen(d: any) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dollars(cents?: number | null) {
  if (cents === undefined || cents === null) return "—";
  return `$${(cents / 100).toFixed(0)}`;
}

function nextActions(s: MarketplaceSession) {
  const status = String(s.status);
  if (status === "pending") return ["confirmed", "cancelled"] as const;
  if (status === "confirmed") return ["completed", "cancelled"] as const;
  return [] as const;
}

export default function SessionsPage() {
  const { toast } = useToast();
  const sessions = useMySessions();
  const update = useUpdateSession();
  const [reviewSessionId, setReviewSessionId] = React.useState<string | null>(null);

  const list = (sessions.data ?? []).slice().sort((a, b) => {
    const ad = new Date(a.scheduledAt as any).getTime();
    const bd = new Date(b.scheduledAt as any).getTime();
    return bd - ad;
  });

  return (
    <>
      <AppShell title="Sessions">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="font-display text-3xl tracking-tight">Your sessions</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Track requests, confirmations, and meeting links.
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => sessions.refetch()}
            data-testid="sessions-refresh"
          >
            Refresh
          </Button>
        </div>

        <div className="mt-6">
          {sessions.isError ? (
            <Card className="rounded-3xl border border-destructive/30 bg-card p-6 shadow-sm">
              <div className="font-display text-xl tracking-tight">Couldn’t load sessions</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {(sessions.error as any)?.message ?? "Unknown error"}
              </div>
              <Button
                type="button"
                className="mt-4 rounded-xl"
                onClick={() => sessions.refetch()}
                data-testid="sessions-retry"
              >
                Retry
              </Button>
            </Card>
          ) : null}

          {!sessions.isLoading && !sessions.isError && list.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5 text-accent" />}
              title="No sessions yet"
              description="Browse tutors and request your first session. Your timeline will appear here."
              actionLabel="Find tutors"
              onAction={() => (window.location.href = "/find-tutors")}
              secondaryLabel="Edit profile"
              onSecondary={() => (window.location.href = "/profile")}
              data-testid="sessions-empty"
            />
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map((s) => {
              const actions = nextActions(s);

              return (
                <Card
                  key={s.id}
                  className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay overflow-hidden"
                  data-testid={`session-card-${s.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display text-2xl tracking-tight truncate">
                          {s.subject}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {formatWhen(s.scheduledAt)}
                          <span className="mx-2">•</span>
                          {s.durationMinutes} min
                          <span className="mx-2">•</span>
                          {dollars(s.hourlyRateCents)}/hr
                        </div>
                      </div>
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium " +
                          badgeTone(String(s.status))
                        }
                        data-testid={`session-status-${s.id}`}
                      >
                        {String(s.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-[hsl(var(--chart-3))]" />
                          Payment
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground" data-testid={`session-payment-${s.id}`}>
                          {String(s.paymentStatus)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-accent" />
                          Notes
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {s.tuteeNotes || "—"}
                        </div>
                      </div>
                    </div>

                    {String(s.status) === "confirmed" && s.meetingLink ? (
                      <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="text-sm font-medium">Meeting link</div>
                        <a
                          href={s.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          data-testid={`session-meeting-link-${s.id}`}
                        >
                          Open meeting <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-col sm:flex-row gap-2">
                      {actions.includes("confirmed") ? (
                        <Button
                          type="button"
                          className="rounded-xl"
                          onClick={() =>
                            update.mutate(
                              { sessionId: s.id, status: "confirmed" },
                              {
                                onSuccess: () =>
                                  toast({ title: "Confirmed", description: "Session confirmed." }),
                                onError: (e: any) =>
                                  toast({
                                    title: "Update failed",
                                    description: String(e.message ?? e),
                                    variant: "destructive" as any,
                                  }),
                              },
                            )
                          }
                          disabled={update.isPending}
                          data-testid={`session-confirm-${s.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="ml-2">Confirm</span>
                        </Button>
                      ) : null}

                      {actions.includes("completed") ? (
                        <Button
                          type="button"
                          className="rounded-xl"
                          onClick={() =>
                            update.mutate(
                              { sessionId: s.id, status: "completed" },
                              {
                                onSuccess: () =>
                                  toast({ title: "Completed", description: "Marked as completed." }),
                                onError: (e: any) =>
                                  toast({
                                    title: "Update failed",
                                    description: String(e.message ?? e),
                                    variant: "destructive" as any,
                                  }),
                              },
                            )
                          }
                          disabled={update.isPending}
                          data-testid={`session-complete-${s.id}`}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="ml-2">Complete</span>
                        </Button>
                      ) : null}

                      {actions.includes("cancelled") ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() =>
                            update.mutate(
                              { sessionId: s.id, status: "cancelled" },
                              {
                                onSuccess: () =>
                                  toast({ title: "Cancelled", description: "Session cancelled." }),
                                onError: (e: any) =>
                                  toast({
                                    title: "Update failed",
                                    description: String(e.message ?? e),
                                    variant: "destructive" as any,
                                  }),
                              },
                            )
                          }
                          disabled={update.isPending}
                          data-testid={`session-cancel-${s.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="ml-2">Cancel</span>
                        </Button>
                      ) : null}

                      {String(s.status) === "completed" && !s.ratingScore ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => setReviewSessionId(s.id)}
                          data-testid={`session-review-${s.id}`}
                        >
                          <Star className="h-4 w-4" />
                          <span className="ml-2">Leave Review</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => alert("Session details coming soon.")}
                          data-testid={`session-details-${s.id}`}
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </AppShell>

      {
        reviewSessionId && (
          <ReviewForm
            sessionId={reviewSessionId}
            open={true}
            onClose={() => setReviewSessionId(null)}
          />
        )
      }
    </>
  );
}
