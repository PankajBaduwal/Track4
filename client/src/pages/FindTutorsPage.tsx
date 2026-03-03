import * as React from "react";
import { Link } from "wouter";
import {
  Filter, GraduationCap, MapPin, Search, SlidersHorizontal,
  Sparkles, Star, ArrowUpDown, TrendingUp, IndianRupee, Award,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTutorSearch } from "@/hooks/use-tutors";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

function dollars(cents?: number | null) {
  if (cents === undefined || cents === null) return "—";
  return `$${(cents / 100).toFixed(0)}`;
}

function StarRating({ rating, total }: { rating: number | null | undefined; total: number }) {
  if (rating === null || rating === undefined) {
    return <span className="text-xs text-muted-foreground italic">No reviews yet</span>;
  }
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i <= full
                ? "fill-amber-400 text-amber-400"
                : i === full + 1 && half
                  ? "fill-amber-200 text-amber-400"
                  : "fill-muted text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{rating?.toFixed(1) ?? "0.0"}</span>
      <span className="text-xs text-muted-foreground">({total})</span>
    </div>
  );
}

type SortKey = "rating" | "price_low" | "price_high" | "skills_match" | "default";

const sortOptions: { key: SortKey; label: string; icon: typeof Star }[] = [
  { key: "default", label: "Default", icon: ArrowUpDown },
  { key: "rating", label: "Highest Rated", icon: Star },
  { key: "price_low", label: "Price: Low → High", icon: IndianRupee },
  { key: "price_high", label: "Price: High → Low", icon: TrendingUp },
  { key: "skills_match", label: "Most Skills", icon: Award },
];

export default function FindTutorsPage() {
  const [subject, setSubject] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [minRate, setMinRate] = React.useState<string>("");
  const [maxRate, setMaxRate] = React.useState<string>("");
  const [activeOnly, setActiveOnly] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<SortKey>("rating");
  const [sortOpen, setSortOpen] = React.useState(false);

  const query = useTutorSearch({
    subject: subject || undefined,
    university: university || undefined,
    minRateCents: minRate ? Number(minRate) * 100 : undefined,
    maxRateCents: maxRate ? Number(maxRate) * 100 : undefined,
    isActive: activeOnly,
  });

  // Sort teachers client-side
  const sorted = React.useMemo(() => {
    const list = [...(query.data ?? [])];
    switch (sortBy) {
      case "rating":
        return list.sort((a, b) => {
          const ar = (a as any).averageRating ?? -1;
          const br = (b as any).averageRating ?? -1;
          return br - ar;
        });
      case "price_low":
        return list.sort((a, b) => {
          const ap = a.subjects.length > 0 ? Math.min(...a.subjects.map(s => s.hourlyRateCents ?? 0)) : Infinity;
          const bp = b.subjects.length > 0 ? Math.min(...b.subjects.map(s => s.hourlyRateCents ?? 0)) : Infinity;
          return ap - bp;
        });
      case "price_high":
        return list.sort((a, b) => {
          const ap = a.subjects.length > 0 ? Math.min(...a.subjects.map(s => s.hourlyRateCents ?? 0)) : 0;
          const bp = b.subjects.length > 0 ? Math.min(...b.subjects.map(s => s.hourlyRateCents ?? 0)) : 0;
          return bp - ap;
        });
      case "skills_match":
        return list.sort((a, b) => (b.subjects.length - a.subjects.length));
      default:
        return list;
    }
  }, [query.data, sortBy]);

  const currentSort = sortOptions.find(s => s.key === sortBy)!;

  return (
    <AppShell title="Find Teachers">
      <Card className="rounded-3xl border border-card-border/70 bg-card shadow-sm noise-overlay">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                  <GraduationCap className="h-3.5 w-3.5" /> Teachers
                </span>
              </div>
              <div className="font-display text-2xl tracking-tight mt-2">Find a Teacher</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Browse students who teach. Filter and sort to find your best match.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  setSubject("");
                  setUniversity("");
                  setMinRate("");
                  setMaxRate("");
                  setActiveOnly(true);
                  setSortBy("rating");
                }}
                data-testid="tutor-filters-reset"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="ml-2">Reset</span>
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <div className="text-xs text-muted-foreground mb-1">Subject</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Calculus"
                  className="pl-10 rounded-xl"
                  data-testid="tutor-filter-subject"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="text-xs text-muted-foreground mb-1">University</div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g., UC Berkeley"
                  className="pl-10 rounded-xl"
                  data-testid="tutor-filter-university"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Min $/hr</div>
              <Input
                value={minRate}
                onChange={(e) => setMinRate(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                inputMode="numeric"
                className="rounded-xl"
                data-testid="tutor-filter-minrate"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Max $/hr</div>
              <Input
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="60"
                inputMode="numeric"
                className="rounded-xl"
                data-testid="tutor-filter-maxrate"
              />
            </div>
          </div>

          {/* Bottom bar: active filter + sort + count */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm" data-testid="tutor-filter-active">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Active teachers only
            </label>

            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  <currentSort.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sort: <span className="text-foreground">{currentSort.label}</span></span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", sortOpen && "rotate-180")} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border border-border/70 bg-card shadow-xl overflow-hidden">
                    {sortOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = sortBy === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-accent/60",
                            active && "bg-accent font-semibold text-primary"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                          {opt.label}
                          {opt.key === "rating" && (
                            <span className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">⭐</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-4 w-4" />
                {query.isLoading ? "Loading…" : `${sorted.length} teachers`}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Click outside to close sort dropdown */}
      {sortOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
      )}

      <div className="mt-6">
        {query.isError ? (
          <Card className="rounded-3xl border border-destructive/30 bg-card p-6 shadow-sm">
            <div className="font-display text-xl tracking-tight">Couldn't load teachers</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {(query.error as any)?.message ?? "Unknown error"}
            </div>
            <Button
              type="button"
              className="mt-4 rounded-xl"
              onClick={() => query.refetch()}
              data-testid="tutor-search-retry"
            >
              Retry
            </Button>
          </Card>
        ) : null}

        {!query.isLoading && !query.isError && sorted.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5 text-accent" />}
            title="No teachers match that yet"
            description="Try a broader subject name, remove the university filter, or widen the rate range."
            actionLabel="Reset filters"
            onAction={() => {
              setSubject("");
              setUniversity("");
              setMinRate("");
              setMaxRate("");
              setActiveOnly(true);
              setSortBy("rating");
            }}
            data-testid="tutor-search-empty"
          />
        ) : null}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((t) => {
            const name =
              [t.user.firstName, t.user.lastName].filter(Boolean).join(" ") ||
              t.user.email ||
              "Teacher";

            const minPrice =
              (t.subjects ?? []).length > 0
                ? Math.min(...t.subjects.map((s) => s.hourlyRateCents ?? 0))
                : null;

            const avgRating = (t as any).averageRating as number | null;
            const totalReviews = (t as any).totalReviews as number ?? 0;

            return (
              <Link
                key={t.user.id}
                href={`/tutors/${t.user.id}`}
                className={cn(
                  "group block rounded-3xl border border-card-border/70 bg-card shadow-sm overflow-hidden",
                  "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
                  "noise-overlay",
                )}
                data-testid={`tutor-card-${t.user.id}`}
              >
                <div className="relative p-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(circle_at_90%_15%,hsl(var(--accent)/0.10),transparent_55%)]" />
                  <div className="relative">
                    {/* Top badges row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-300">
                        <GraduationCap className="h-3 w-3" /> Teacher
                      </span>

                      {/* RATING BADGE: Prominent Top Right */}
                      {typeof avgRating === "number" ? (
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-full px-2.5 py-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{avgRating.toFixed(1)}</span>
                          <span className="text-[10px] text-amber-500">({totalReviews})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">New teacher</span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-display text-xl tracking-tight truncate">{name}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground truncate">
                          {t.tutorProfile.university}
                          {t.tutorProfile.major ? ` • ${t.tutorProfile.major}` : ""}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shrink-0 text-right">
                        <div className="text-[11px] text-muted-foreground">from</div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {minPrice === null ? "—" : dollars(minPrice)}/hr
                        </div>
                      </div>
                    </div>

                    {/* Full star rating row */}
                    <div className="mt-2.5">
                      <StarRating rating={avgRating} total={totalReviews} />
                    </div>

                    {/* Subject pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(t.subjects ?? []).slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-3 py-0.5 text-xs"
                        >
                          {s.subject}
                          <span className="ml-1 text-muted-foreground">{dollars(s.hourlyRateCents)}</span>
                        </span>
                      ))}
                      {(t.subjects ?? []).length > 3 ? (
                        <span className="text-xs text-muted-foreground self-center">
                          +{(t.subjects ?? []).length - 3} more
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {(t.subjects ?? []).length} subject{(t.subjects ?? []).length === 1 ? "" : "s"} •{" "}
                        {(t.availability ?? []).length} slot{(t.availability ?? []).length === 1 ? "" : "s"}
                      </span>
                      <span className="text-primary font-semibold group-hover:underline">
                        Book a session →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
