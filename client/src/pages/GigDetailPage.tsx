import * as React from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
    ArrowLeft, IndianRupee, Clock, Palette, Code2, BookOpen, Sparkles,
    User as UserIcon, CheckCircle2, XCircle, MessageCircle, Award, Loader2, Star,
    Mail, Phone, Link2, Send, ExternalLink, Handshake
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGig, useApplyToGig, useUpdateApplication, useCompleteGig } from "@/hooks/use-gigs";
import { useAuth } from "@/hooks/use-auth";
import { ProofOfWorkCard } from "@/components/ProofOfWorkCard";
import { apiRequest } from "@/hooks/use-api";

const categoryIcons: Record<string, typeof Palette> = { creative: Palette, tech: Code2, academic: BookOpen };
const categoryColors: Record<string, string> = {
    creative: "from-pink-500 to-rose-500",
    tech: "from-blue-500 to-cyan-500",
    academic: "from-emerald-500 to-teal-500",
};

const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function sortApplications(apps: any[], sort: "price" | "status" | "name") {
    const sorted = [...apps];
    if (sort === "price") sorted.sort((a, b) => (a.proposedPriceCents ?? 99999) - (b.proposedPriceCents ?? 99999));
    else if (sort === "status") {
        const order: Record<string, number> = { accepted: 0, pending: 1, rejected: 2 };
        sorted.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
    }
    else if (sort === "name") sorted.sort((a, b) => (a.applicant?.firstName ?? "").localeCompare(b.applicant?.firstName ?? ""));
    return sorted;
}

export default function GigDetailPage() {
    const [, params] = useRoute("/gigs/:gigId");
    const gigId = params?.gigId;
    const gigQuery = useGig(gigId);
    const { user } = useAuth();
    const { toast } = useToast();
    const applyToGig = useApplyToGig();
    const updateApp = useUpdateApplication();
    const completeGig = useCompleteGig();
    const [, navigate] = useLocation();

    const [applyMsg, setApplyMsg] = React.useState("");
    const [applyPrice, setApplyPrice] = React.useState("");
    const [showApply, setShowApply] = React.useState(false);
    const [rating, setRating] = React.useState(5);
    const [reviewText, setReviewText] = React.useState("");
    const [resourceLink, setResourceLink] = React.useState("");
    const [sharedResources, setSharedResources] = React.useState<Array<{ text: string; by: string; at: string }>>([]);
    const [appSort, setAppSort] = React.useState<"price" | "status" | "name">("status");

    const gig = gigQuery.data as any;
    if (gigQuery.isLoading) return <AppShell title="Loading..."><div className="animate-pulse h-96 rounded-2xl bg-muted/50" /></AppShell>;
    if (!gig) return <AppShell title="Not Found"><p>Gig not found.</p></AppShell>;

    const isOwner = user?.id === gig.posterId;
    const CatIcon = categoryIcons[gig.category] ?? Sparkles;
    const hasApplied = gig.applications?.some((a: any) => a.applicantId === user?.id);
    const acceptedApp = gig.applications?.find((a: any) => a.status === "accepted");

    const handleApply = async () => {
        await applyToGig.mutateAsync({
            gigId: gig.id,
            message: applyMsg,
            proposedPriceCents: applyPrice ? Math.round(Number(applyPrice) * 100) : undefined,
        });
        toast({ title: "✅ Application sent!", description: "The poster will review your application." });
        setShowApply(false);
        gigQuery.refetch();
    };

    const handleAccept = async (appId: string) => {
        await updateApp.mutateAsync({ gigId: gig.id, appId, status: "accepted" });
        toast({ title: "Accepted!", description: "The helper has been notified." });
        gigQuery.refetch();
    };

    const handleReject = async (appId: string) => {
        await updateApp.mutateAsync({ gigId: gig.id, appId, status: "rejected" });
        gigQuery.refetch();
    };

    const handleComplete = async () => {
        await completeGig.mutateAsync({ gigId: gig.id, rating, review: reviewText });
        toast({ title: "🎉 Gig Completed!", description: "A Proof of Work card has been generated." });
        gigQuery.refetch();
    };

    const handleOpenChat = async () => {
        try {
            const otherUserId = isOwner ? acceptedApp?.applicantId : gig.posterId;
            if (!otherUserId) return;
            await apiRequest("POST", "/api/messages", {
                receiverId: otherUserId,
                content: `Hey! Let's collaborate on the gig: "${gig.title}" 🤝`,
            });
            navigate("/messages");
        } catch {
            toast({ title: "Chat opened", description: "Go to Messages to continue the conversation." });
            navigate("/messages");
        }
    };

    return (
        <AppShell title={gig.title}>
            <div className="max-w-3xl mx-auto">
                <Link href="/gig-board">
                    <Button variant="ghost" className="mb-4 rounded-xl gap-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to Gig Board
                    </Button>
                </Link>

                {/* Main Card */}
                <Card className="rounded-2xl border border-card-border/70 bg-card shadow-sm noise-overlay overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${categoryColors[gig.category] ?? "from-gray-400 to-gray-500"}`} />
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge className={`${statusColors[gig.status]} rounded-lg text-xs px-2 py-0.5`}>
                                {gig.status.replace("_", " ")}
                            </Badge>
                            <Badge className="bg-muted/60 rounded-lg text-xs px-2 py-0.5">
                                <CatIcon className="h-3 w-3 mr-1" />
                                {gig.category}
                            </Badge>
                        </div>

                        <h1 className="font-display text-2xl tracking-tight mb-2">{gig.title}</h1>
                        <p className="text-muted-foreground">{gig.aiEnhancedDescription || gig.description}</p>

                        <div className="mt-4 flex items-center gap-6 text-sm">
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <IndianRupee className="h-4 w-4" />
                                {(gig.budgetCents / 100).toFixed(0)}
                            </span>
                            {gig.deadline && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Due: {new Date(gig.deadline).toLocaleDateString()}
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                                {gig.poster?.firstName} {gig.poster?.lastName}
                            </span>
                        </div>

                        {gig.skillsRequired?.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {gig.skillsRequired.map((skill: string) => (
                                    <span key={skill} className="text-xs bg-muted/60 px-2.5 py-1 rounded-lg">{skill}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Apply Section (for non-owners, if gig is open) */}
                {!isOwner && gig.status === "open" && !hasApplied && (
                    <Card className="rounded-2xl mt-4 p-5 border border-card-border/70">
                        {!showApply ? (
                            <Button onClick={() => setShowApply(true)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white h-11">
                                <MessageCircle className="h-4 w-4 mr-2" /> Apply to Help
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <Textarea value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} placeholder="Why are you the right person for this gig?" className="rounded-xl" />
                                <Input type="number" value={applyPrice} onChange={(e) => setApplyPrice(e.target.value)} placeholder="Your proposed price (₹)" className="rounded-xl" />
                                <div className="flex gap-2">
                                    <Button onClick={handleApply} disabled={applyToGig.isPending} className="rounded-xl flex-1">
                                        {applyToGig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit Application
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowApply(false)} className="rounded-xl">Cancel</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {hasApplied && gig.status === "open" && (
                    <Card className="rounded-2xl mt-4 p-5 border border-card-border/70 text-center">
                        <p className="text-sm text-muted-foreground">✅ You've already applied to this gig. Waiting for the poster to respond.</p>
                    </Card>
                )}

                {/* Applications (for owners) */}
                {isOwner && gig.applications?.length > 0 && (
                    <Card className="rounded-2xl mt-4 p-5 border border-card-border/70">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-display text-lg">Applications ({gig.applications.length})</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Sort:</span>
                                {["price", "status", "name"].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setAppSort(s as any)}
                                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${appSort === s ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 text-violet-700 dark:text-violet-300 font-medium" : "border-border/50 text-muted-foreground hover:bg-muted/50"}`}
                                    >
                                        {s === "price" ? "💰 Price" : s === "status" ? "✅ Status" : "👤 Name"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {sortApplications(gig.applications, appSort).map((app: any) => (
                                <div key={app.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                                    <div className="flex-1">
                                        <div className="font-medium">{app.applicant?.firstName} {app.applicant?.lastName}</div>
                                        {app.message && <p className="text-sm text-muted-foreground mt-1">{app.message}</p>}
                                        {app.proposedPriceCents && (
                                            <span className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                <IndianRupee className="h-3 w-3" /> {(app.proposedPriceCents / 100).toFixed(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {app.status === "pending" && gig.status === "open" ? (
                                            <>
                                                <Button size="sm" onClick={() => handleAccept(app.id)} className="rounded-lg gap-1 bg-green-600 hover:bg-green-700 text-white">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReject(app.id)} className="rounded-lg gap-1">
                                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                                </Button>
                                            </>
                                        ) : (
                                            <Badge className={app.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                {app.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Collaboration Hub (visible to poster & accepted helper when in_progress) */}
                {gig.status === "in_progress" && acceptedApp && (isOwner || acceptedApp.applicantId === user?.id) && (
                    <Card className="rounded-2xl mt-4 border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20 overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Handshake className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                <h3 className="font-display text-lg">Collaboration Hub</h3>
                            </div>

                            {/* Contact Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {/* Gig Poster */}
                                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                                    <div className="text-xs text-muted-foreground mb-1">Gig Poster</div>
                                    <div className="font-medium">{gig.poster?.firstName} {gig.poster?.lastName}</div>
                                    {gig.poster?.email && (
                                        <a href={`mailto:${gig.poster.email}`} className="flex items-center gap-1.5 mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline">
                                            <Mail className="h-3.5 w-3.5" />
                                            {gig.poster.email}
                                        </a>
                                    )}
                                </div>

                                {/* Accepted Helper */}
                                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                                    <div className="text-xs text-muted-foreground mb-1">Helper</div>
                                    <div className="font-medium">{acceptedApp.applicant?.firstName} {acceptedApp.applicant?.lastName}</div>
                                    {acceptedApp.applicant?.email && (
                                        <a href={`mailto:${acceptedApp.applicant.email}`} className="flex items-center gap-1.5 mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline">
                                            <Mail className="h-3.5 w-3.5" />
                                            {acceptedApp.applicant.email}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Button variant="outline" className="rounded-xl gap-2" onClick={handleOpenChat}>
                                    <MessageCircle className="h-4 w-4" /> Open Chat
                                </Button>
                                {gig.poster?.email && (
                                    <a href={`mailto:${isOwner ? acceptedApp.applicant?.email : gig.poster.email}?subject=Kai Gig: ${gig.title}`}>
                                        <Button variant="outline" className="rounded-xl gap-2">
                                            <Send className="h-4 w-4" /> Send Email
                                        </Button>
                                    </a>
                                )}
                            </div>

                            {/* Resource Sharing */}
                            <div className="border-t border-border/50 pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Link2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Shared Resources</span>
                                </div>

                                {sharedResources.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {sharedResources.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-card/80 border border-border/50">
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <a href={r.text.startsWith('http') ? r.text : `https://${r.text}`} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 dark:text-violet-400 hover:underline truncate">
                                                    {r.text}
                                                </a>
                                                <span className="text-xs text-muted-foreground ml-auto shrink-0">{r.by}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Input
                                        value={resourceLink}
                                        onChange={(e) => setResourceLink(e.target.value)}
                                        placeholder="Paste a link (Drive, GitHub, Meet, etc.)"
                                        className="rounded-xl flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && resourceLink.trim()) {
                                                setSharedResources(prev => [...prev, {
                                                    text: resourceLink.trim(),
                                                    by: user?.firstName || 'You',
                                                    at: new Date().toLocaleTimeString()
                                                }]);
                                                setResourceLink('');
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        disabled={!resourceLink.trim()}
                                        onClick={() => {
                                            if (resourceLink.trim()) {
                                                setSharedResources(prev => [...prev, {
                                                    text: resourceLink.trim(),
                                                    by: user?.firstName || 'You',
                                                    at: new Date().toLocaleTimeString()
                                                }]);
                                                setResourceLink('');
                                            }
                                        }}
                                    >
                                        Share
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Share Google Drive links, GitHub repos, meeting URLs, or any resources for this gig.</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Complete Gig (for owners, when in_progress) */}
                {isOwner && gig.status === "in_progress" && (
                    <Card className="rounded-2xl mt-4 p-5 border border-card-border/70">
                        <h3 className="font-display text-lg mb-3">Mark as Complete</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Rating</label>
                                <div className="flex gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button key={n} type="button" onClick={() => setRating(n)}>
                                            <Star className={`h-6 w-6 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="How did the helper do? (optional)" className="rounded-xl" />
                            <Button onClick={handleComplete} disabled={completeGig.isPending} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white h-11">
                                {completeGig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
                                Complete & Generate Proof of Work
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Proof of Work (once completed) */}
                {gig.status === "completed" && acceptedApp && (
                    <div className="mt-6">
                        <ProofOfWorkCard gigId={gig.id} />
                    </div>
                )}
            </div>
        </AppShell>
    );
}
