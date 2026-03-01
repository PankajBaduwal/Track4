import { useDashboardAnalytics } from "@/hooks/use-analytics";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    GraduationCap,
    Users,
    DollarSign,
    Star,
    BookOpen,
    TrendingUp,
    Target,
    Heart,
} from "lucide-react";

function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export default function AnalyticsPage() {
    const { data, isLoading } = useDashboardAnalytics();

    if (isLoading) {
        return (
            <AppShell title="Analytics">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">SDG Impact Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="pt-6">
                                    <div className="h-16 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </AppShell>
        );
    }

    const analytics = data as any;
    if (!analytics) return <AppShell title="Analytics"><p>No data</p></AppShell>;

    return (
        <AppShell title="Analytics">
            <div className="p-6 max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">SDG Impact Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Tracking our alignment with UN Sustainable Development Goals
                    </p>
                </div>

                {/* Platform Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Sessions"
                        value={analytics.totalSessions}
                        icon={<BookOpen className="h-5 w-5" />}
                        color="blue"
                    />
                    <StatCard
                        title="Completed Sessions"
                        value={analytics.completedSessions}
                        icon={<Target className="h-5 w-5" />}
                        color="green"
                    />
                    <StatCard
                        title="Active Users"
                        value={analytics.activeUsers}
                        icon={<Users className="h-5 w-5" />}
                        color="purple"
                    />
                    <StatCard
                        title="Avg Rating"
                        value={analytics.averageRating?.toFixed(1) ?? "—"}
                        icon={<Star className="h-5 w-5" />}
                        color="yellow"
                    />
                </div>

                {/* Financial Overview */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Financial Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard
                            title="Total Revenue"
                            value={formatCents(analytics.totalRevenueCents)}
                            icon={<DollarSign className="h-5 w-5" />}
                            color="green"
                        />
                        <StatCard
                            title="Tutor Earnings"
                            value={formatCents(analytics.tutorEarningsCents)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            color="blue"
                        />
                        <StatCard
                            title="Platform Fees"
                            value={formatCents(analytics.platformFeesCents)}
                            icon={<DollarSign className="h-5 w-5" />}
                            color="purple"
                        />
                    </div>
                </div>

                {/* SDG Alignment */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">
                        UN Sustainable Development Goals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* SDG #4: Quality Education */}
                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-red-500" />
                                    <CardTitle className="text-base">
                                        SDG #4: Quality Education
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-2xl font-bold">{analytics.sdg.sessionsCompleted}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Tutoring sessions completed
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{analytics.sdg.subjectsOffered}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Unique subjects offered
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {analytics.sdg.averageSessionRating?.toFixed(1) ?? "—"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Average session quality rating
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SDG #8: Decent Work */}
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-amber-500" />
                                    <CardTitle className="text-base">
                                        SDG #8: Decent Work
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-2xl font-bold">{analytics.sdg.activeTutors}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Active student tutors earning income
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {formatCents(analytics.sdg.totalTutorEarningsCents)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Total earnings generated for tutors
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SDG #10: Reduced Inequalities */}
                        <Card className="border-l-4 border-l-pink-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-pink-500" />
                                    <CardTitle className="text-base">
                                        SDG #10: Reduced Inequalities
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Students with access to affordable tutoring
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">$10-20/hr</p>
                                    <p className="text-xs text-muted-foreground">
                                        Affordable rates vs $50-60/hr professional tutors
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-500 bg-blue-50 dark:bg-blue-950",
        green: "text-green-500 bg-green-50 dark:bg-green-950",
        purple: "text-purple-500 bg-purple-50 dark:bg-purple-950",
        yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${colorMap[color] ?? colorMap.blue}`}
                    >
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{title}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
