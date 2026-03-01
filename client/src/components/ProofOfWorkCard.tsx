import * as React from "react";
import { Award, Star, Palette, Code2, BookOpen, Sparkles, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProofOfWork } from "@/hooks/use-gigs";

const categoryIcons: Record<string, typeof Palette> = { creative: Palette, tech: Code2, academic: BookOpen };
const categoryGradients: Record<string, string> = {
    creative: "from-pink-500 via-rose-500 to-fuchsia-500",
    tech: "from-blue-500 via-cyan-500 to-teal-500",
    academic: "from-emerald-500 via-green-500 to-lime-500",
};

export function ProofOfWorkCard({ gigId }: { gigId: string }) {
    const powQuery = useProofOfWork(gigId);
    const pow = powQuery.data as any;

    if (powQuery.isLoading) return <div className="h-48 rounded-2xl animate-pulse bg-muted/50" />;
    if (!pow) return null;

    const CatIcon = categoryIcons[pow.category] ?? Sparkles;
    const gradient = categoryGradients[pow.category] ?? "from-violet-500 to-fuchsia-500";

    return (
        <Card
            className="rounded-2xl overflow-hidden shadow-xl"
            data-testid="proof-of-work-card"
        >
            {/* Top gradient bar */}
            <div className={`h-2 bg-gradient-to-r ${gradient}`} />

            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Proof of Work</div>
                        <div className="font-display text-lg tracking-tight">Certificate of Completion</div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <div>
                        <div className="text-xs text-muted-foreground">Gig Title</div>
                        <div className="font-medium">{pow.title}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Helper</div>
                            <div className="font-medium">{pow.helper?.firstName} {pow.helper?.lastName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Posted by</div>
                            <div className="font-medium">{pow.posterUser?.firstName} {pow.posterUser?.lastName}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Category</div>
                            <Badge className="mt-0.5 rounded-lg text-xs">
                                <CatIcon className="h-3 w-3 mr-1" />
                                {pow.category}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                            <div className="text-sm">{new Date(pow.completedAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Rating */}
                    {pow.rating && (
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Rating</div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star key={n} className={`h-4 w-4 ${n <= pow.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                                ))}
                                <span className="text-sm font-medium ml-1">{pow.rating}/5</span>
                            </div>
                        </div>
                    )}

                    {/* Review */}
                    {pow.review && (
                        <div>
                            <div className="text-xs text-muted-foreground">Review</div>
                            <p className="text-sm italic text-muted-foreground">"{pow.review}"</p>
                        </div>
                    )}

                    {/* Skills */}
                    {pow.skillsUsed?.length > 0 && (
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Skills Used</div>
                            <div className="flex flex-wrap gap-1.5">
                                {pow.skillsUsed.map((skill: string) => (
                                    <span key={skill} className="text-xs bg-muted/60 px-2 py-0.5 rounded-md">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer + Share */}
                <div className="mt-5 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground">
                            Verified by <span className="font-medium text-foreground">Kai</span> • Campus Gig Marketplace
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 text-xs flex-1 hover:bg-[#0a66c2] hover:text-white hover:border-[#0a66c2] transition-all"
                            onClick={() => {
                                const text = `🎓 Proof of Work — ${pow.title}\n\nCompleted a micro-gig on Kai Campus Marketplace!\n${pow.skillsUsed?.length ? `Skills: ${pow.skillsUsed.join(", ")}` : ""}${pow.rating ? `\nRating: ${"⭐".repeat(pow.rating)} (${pow.rating}/5)` : ""}\n\n#Kai #CampusGig #PeerHelp`;
                                const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
                                window.open(url, "_blank", "width=600,height=500");
                            }}
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            Share to LinkedIn
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 text-xs flex-1 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
                            onClick={() => {
                                const text = `🎓 *Proof of Work — Kai*\n\n📌 ${pow.title}\n👤 Helper: ${pow.helper?.firstName} ${pow.helper?.lastName}\n${pow.skillsUsed?.length ? `🛠 Skills: ${pow.skillsUsed.join(", ")}` : ""}${pow.rating ? `\n⭐ Rating: ${pow.rating}/5` : ""}${pow.review ? `\n💬 "${pow.review}"` : ""}\n\n_Verified on Kai Campus Marketplace_`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                            }}
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            Share to WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
