import * as React from "react";
import { Trophy, Medal, Star, Filter, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useLeaderboard } from "@/hooks/use-gigs";

const periods = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "all", label: "All Time" },
];

const categories = [
    { id: "all", label: "All" },
    { id: "creative", label: "Creative" },
    { id: "tech", label: "Tech" },
    { id: "academic", label: "Academic" },
];

const rankStyles: Record<number, { icon: typeof Trophy; bg: string; text: string }> = {
    1: { icon: Trophy, bg: "bg-gradient-to-r from-amber-400 to-yellow-500", text: "text-white" },
    2: { icon: Medal, bg: "bg-gradient-to-r from-gray-300 to-gray-400", text: "text-white" },
    3: { icon: Medal, bg: "bg-gradient-to-r from-amber-600 to-orange-600", text: "text-white" },
};

export default function LeaderboardPage() {
    const [period, setPeriod] = React.useState("week");
    const [category, setCategory] = React.useState("all");
    const lbQuery = useLeaderboard({
        period,
        category: category !== "all" ? category : undefined,
    });
    const leaders = (lbQuery.data as any[]) ?? [];

    return (
        <AppShell title="Leaderboard">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 mb-3">
                        <Trophy className="h-5 w-5 text-amber-600" />
                        <span className="font-display text-lg text-amber-700 dark:text-amber-400">Top Helpers of the Week</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Students making the biggest impact on campus</p>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6 gap-3">
                    <div className="flex gap-1.5 bg-muted/50 rounded-xl p-1">
                        {periods.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.id
                                    ? "bg-card shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5 bg-muted/50 rounded-xl p-1">
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c.id
                                    ? "bg-card shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                {leaders.length === 0 ? (
                    <EmptyState
                        icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
                        title="No helpers yet"
                        description="Complete gigs to climb the leaderboard!"
                    />
                ) : (
                    <div className="space-y-3">
                        {leaders.map((leader: any) => {
                            const style = rankStyles[leader.rank];
                            return (
                                <Card
                                    key={leader.userId}
                                    className={`rounded-2xl border border-card-border/70 overflow-hidden transition-all hover:shadow-md ${leader.rank <= 3 ? "ring-1 ring-amber-200/50 dark:ring-amber-800/30" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-4 p-4">
                                        {/* Rank */}
                                        <div
                                            className={`
                        grid place-items-center h-11 w-11 rounded-xl font-display font-bold text-lg shrink-0
                        ${style ? `${style.bg} ${style.text} shadow-lg` : "bg-muted text-muted-foreground"}
                      `}
                                        >
                                            {leader.rank <= 3 ? (
                                                <span>{leader.rank === 1 ? "🥇" : leader.rank === 2 ? "🥈" : "🥉"}</span>
                                            ) : (
                                                <span>{leader.rank}</span>
                                            )}
                                        </div>

                                        {/* Profile */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{leader.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Flame className="h-3 w-3 text-orange-500" />
                                                    {leader.completedGigs} gigs
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                    {leader.avgRating}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Streak badge for top 3 */}
                                        {leader.rank <= 3 && (
                                            <div className="text-right">
                                                <span className="text-xs bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-lg font-medium">
                                                    🔥 Top Helper
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
