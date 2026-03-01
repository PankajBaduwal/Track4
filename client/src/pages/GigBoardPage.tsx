import * as React from "react";
import { Link } from "wouter";
import { Palette, Code2, BookOpen, Plus, Clock, IndianRupee, Sparkles, Filter } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { useGigs } from "@/hooks/use-gigs";

const categories = [
    { id: "all", label: "All Gigs", icon: Sparkles, color: "from-violet-500 to-fuchsia-500" },
    { id: "creative", label: "Creative", icon: Palette, color: "from-pink-500 to-rose-500" },
    { id: "tech", label: "Tech", icon: Code2, color: "from-blue-500 to-cyan-500" },
    { id: "academic", label: "Academic", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
];

const categoryColors: Record<string, string> = {
    creative: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    tech: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    academic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const categoryIcons: Record<string, typeof Palette> = {
    creative: Palette,
    tech: Code2,
    academic: BookOpen,
};

export default function GigBoardPage() {
    const [activeCategory, setActiveCategory] = React.useState("all");
    const gigsQuery = useGigs(activeCategory !== "all" ? { category: activeCategory } : undefined);
    const gigList = (gigsQuery.data as any[]) ?? [];

    return (
        <AppShell title="Gig Board">
            {/* Category Filters */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const active = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 whitespace-nowrap border
                  ${active
                                        ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg shadow-primary/20`
                                        : "bg-card border-border/70 hover:bg-accent/50 hover:shadow-sm"
                                    }
                `}
                                data-testid={`filter-${cat.id}`}
                            >
                                <Icon className="h-4 w-4" />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
                <Link href="/post-gig">
                    <Button
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                        data-testid="post-gig-btn"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Post a Gig
                    </Button>
                </Link>
            </div>

            {/* Gig Cards */}
            {gigsQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="rounded-2xl h-48 animate-pulse bg-muted/50" />
                    ))}
                </div>
            ) : gigList.length === 0 ? (
                <EmptyState
                    title="No gigs yet"
                    description="Be the first to post a gig and get help from your campus!"
                    action={
                        <Link href="/post-gig">
                            <Button className="rounded-xl">
                                <Plus className="h-4 w-4 mr-2" />
                                Post a Gig
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gigList.map((gig: any) => {
                        const CatIcon = categoryIcons[gig.category] ?? Sparkles;
                        return (
                            <Link key={gig.id} href={`/gigs/${gig.id}`}>
                                <Card
                                    className="rounded-2xl border border-card-border/70 bg-card shadow-sm noise-overlay overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                                    data-testid={`gig-card-${gig.id}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={`${categoryColors[gig.category] ?? ""} rounded-lg text-xs px-2 py-0.5`}>
                                                        <CatIcon className="h-3 w-3 mr-1" />
                                                        {gig.category}
                                                    </Badge>
                                                    {gig.aiEnhancedDescription && (
                                                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-lg text-xs px-2 py-0.5">
                                                            <Sparkles className="h-3 w-3 mr-1" />
                                                            AI Enhanced
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-display text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                                    {gig.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {gig.aiEnhancedDescription || gig.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                {(gig.budgetCents / 100).toFixed(0)}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {gig.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(gig.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span>
                                                    by {gig.poster?.firstName || "Student"}
                                                </span>
                                            </div>
                                        </div>

                                        {gig.skillsRequired?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {gig.skillsRequired.slice(0, 4).map((skill: string) => (
                                                    <span key={skill} className="text-xs bg-muted/60 px-2 py-0.5 rounded-md">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {gig.skillsRequired.length > 4 && (
                                                    <span className="text-xs text-muted-foreground">+{gig.skillsRequired.length - 4}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </AppShell>
    );
}
