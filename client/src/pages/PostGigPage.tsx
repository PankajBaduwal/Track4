import * as React from "react";
import { useLocation } from "wouter";
import { Sparkles, IndianRupee, Loader2, ArrowLeft, Palette, Code2, BookOpen, GraduationCap, BookMarked } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreateGig, useAiEnhance, useAiSuggestPrice } from "@/hooks/use-gigs";
import { Link } from "wouter";

const categoryOptions = [
    { id: "creative", label: "Creative", icon: Palette, description: "Poster design, video edit, PPT design", color: "from-pink-500 to-rose-500" },
    { id: "tech", label: "Tech Help", icon: Code2, description: "DSA mentor, code review, app testing", color: "from-blue-500 to-cyan-500" },
    { id: "academic", label: "Academic", icon: BookOpen, description: "Lab report, exam prep, project help", color: "from-emerald-500 to-teal-500" },
];

export default function PostGigPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const createGig = useCreateGig();
    const aiEnhance = useAiEnhance();
    const aiPrice = useAiSuggestPrice();

    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [category, setCategory] = React.useState("academic");
    const [postType, setPostType] = React.useState<"learn" | "teach">("learn"); // NEW
    const [budgetStr, setBudgetStr] = React.useState("");
    const [skills, setSkills] = React.useState("");
    const [deadline, setDeadline] = React.useState("");
    const [enhancedDescription, setEnhancedDescription] = React.useState<string | null>(null);
    const [suggestedPrice, setSuggestedPrice] = React.useState<{ amount: number; reasoning: string } | null>(null);

    const handleEnhance = async () => {
        const result = await aiEnhance.mutateAsync({ title, description, category });
        if (result.enhancedDescription) setDescription(result.enhancedDescription);
        if (result.suggestedTitle) setTitle(result.suggestedTitle);
        toast({ title: "✨ Enhanced by Kai!", description: "Your gig description has been polished and filled in." });
    };

    const handleSuggestPrice = async () => {
        const skillList = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        const result = await aiPrice.mutateAsync({ title, category, skills: skillList, description });
        setSuggestedPrice({ amount: result.suggestedPriceCents, reasoning: result.reasoning });
        setBudgetStr(String(result.suggestedPriceCents / 100));
        toast({ title: "💰 Price suggested by Kai!", description: result.reasoning });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const skillList = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        // Embed post type tag at start of description
        const tag = postType === "teach" ? "[TEACH]" : "[LEARN]";
        const finalDesc = `${tag} ${enhancedDescription || description}`;
        await createGig.mutateAsync({
            title,
            description: finalDesc,
            category,
            budgetCents: Math.round(Number(budgetStr) * 100),
            skillsRequired: skillList,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            aiEnhancedDescription: enhancedDescription ? `${tag} ${enhancedDescription}` : null,
            aiSuggestedPriceCents: suggestedPrice?.amount || null,
        });
        toast({ title: postType === "teach" ? "🎓 Teaching offer posted!" : "📚 Learning request posted!", description: "Your post is now live on the board." });
        navigate("/gig-board");
    };

    return (
        <AppShell title="Post a Gig">
            <div className="max-w-2xl mx-auto">
                <Link href="/gig-board">
                    <Button variant="ghost" className="mb-4 rounded-xl gap-2 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to Gig Board
                    </Button>
                </Link>

                <Card className="rounded-2xl border border-card-border/70 bg-card shadow-sm noise-overlay p-6">
                    <div className="mb-6">
                        <h2 className="font-display text-2xl tracking-tight">Post on the Board</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tell the community what you need — or what you can offer.
                        </p>
                    </div>

                    {/* ── Post Type Toggle ── */}
                    <div className="mb-6">
                        <p className="text-sm font-semibold mb-3">What are you posting?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPostType("learn")}
                                className={`
                                    flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200
                                    ${postType === "learn"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20"
                                        : "border-border/70 bg-card hover:bg-accent/50"
                                    }
                                `}
                            >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${postType === "learn" ? "bg-blue-500" : "bg-muted"}`}>
                                    <BookMarked className={`h-6 w-6 ${postType === "learn" ? "text-white" : "text-muted-foreground"}`} />
                                </div>
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${postType === "learn" ? "text-blue-700 dark:text-blue-300" : ""}`}>I want to Learn</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">Looking for a teacher</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPostType("teach")}
                                className={`
                                    flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200
                                    ${postType === "teach"
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/20"
                                        : "border-border/70 bg-card hover:bg-accent/50"
                                    }
                                `}
                            >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${postType === "teach" ? "bg-green-500" : "bg-muted"}`}>
                                    <GraduationCap className={`h-6 w-6 ${postType === "teach" ? "text-white" : "text-muted-foreground"}`} />
                                </div>
                                <div className="text-center">
                                    <div className={`font-semibold text-sm ${postType === "teach" ? "text-green-700 dark:text-green-300" : ""}`}>I want to Teach</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">Offering my expertise</div>
                                </div>
                            </button>
                        </div>

                        {/* Context tip */}
                        <div className={`mt-3 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 ${postType === "learn" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"}`}>
                            {postType === "learn"
                                ? <><BookMarked className="h-3.5 w-3.5 shrink-0" /> Students will apply to help you learn this topic.</>
                                : <><GraduationCap className="h-3.5 w-3.5 shrink-0" /> Students looking to learn will reach out to you.</>
                            }
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Category Selection */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Category</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {categoryOptions.map((cat) => {
                                    const Icon = cat.icon;
                                    const active = category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`
                        p-3 rounded-xl border text-left transition-all duration-200
                        ${active
                                                    ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-lg`
                                                    : "bg-card border-border/70 hover:bg-accent/50"
                                                }
                      `}
                                        >
                                            <Icon className="h-5 w-5 mb-1" />
                                            <div className="font-medium text-sm">{cat.label}</div>
                                            <div className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-muted-foreground"}`}>
                                                {cat.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder='e.g., "Need PPT design for project presentation"'
                                className="mt-1.5 rounded-xl"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEnhance}
                                    disabled={aiEnhance.isPending || !title || !description}
                                    className="rounded-lg text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20 gap-1.5"
                                >
                                    {aiEnhance.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    Enhance with Kai
                                </Button>
                            </div>
                            <Textarea
                                id="desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={postType === "teach"
                                    ? "Describe what you can teach, your experience, teaching style..."
                                    : "Describe what you want to learn, your current level, goals..."
                                }
                                className="mt-1.5 rounded-xl min-h-[100px]"
                                required
                            />
                            {enhancedDescription && (
                                <div className="mt-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                                    <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-medium mb-1">
                                        <Sparkles className="h-3 w-3" /> Kai's enhanced version
                                    </div>
                                    <p className="text-sm">{enhancedDescription}</p>
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="skills" className="text-sm font-medium">Skills Required</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const categorySkills: Record<string, string[]> = {
                                            creative: ["Graphic Design", "Poster Design", "Video Editing", "PowerPoint", "Illustration", "Canva", "Figma", "Adobe Photoshop"],
                                            tech: ["JavaScript", "Python", "React", "DSA", "Code Review", "Testing", "Git", "API Development"],
                                            academic: ["Research", "Report Writing", "Data Analysis", "Excel", "LaTeX", "Presentation", "Proofreading", "Note-Taking"],
                                        };
                                        const base = categorySkills[category] ?? categorySkills.academic;
                                        // Pick 3-5 relevant skills, biased by title/description keywords
                                        const text = `${title} ${description}`.toLowerCase();
                                        const relevant = base.filter(s => text.includes(s.toLowerCase().split(" ")[0]));
                                        const pick = relevant.length >= 3 ? relevant.slice(0, 5) : [...relevant, ...base.filter(s => !relevant.includes(s))].slice(0, 4);
                                        setSkills(pick.join(", "));
                                        toast({ title: "🧠 Skills suggested!", description: `${pick.length} skills added based on your gig category.` });
                                    }}
                                    disabled={!title}
                                    className="rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 gap-1.5"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Suggest Skills
                                </Button>
                            </div>
                            <Input
                                id="skills"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                placeholder="e.g., PowerPoint, Design, Data Analysis (comma-separated)"
                                className="mt-1.5 rounded-xl"
                            />
                        </div>

                        {/* Budget */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="budget" className="text-sm font-medium">Budget (₹)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSuggestPrice}
                                    disabled={aiPrice.isPending || !title}
                                    className="rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 gap-1.5"
                                >
                                    {aiPrice.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IndianRupee className="h-3.5 w-3.5" />}
                                    Suggest Price
                                </Button>
                            </div>
                            <Input
                                id="budget"
                                type="number"
                                value={budgetStr}
                                onChange={(e) => setBudgetStr(e.target.value)}
                                placeholder="e.g., 300"
                                className="mt-1.5 rounded-xl"
                                required
                            />
                            {suggestedPrice && (
                                <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        💡 {suggestedPrice.reasoning}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Deadline */}
                        <div>
                            <Label htmlFor="deadline" className="text-sm font-medium">Deadline (optional)</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="mt-1.5 rounded-xl"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={createGig.isPending || !title || !description || !budgetStr}
                            className={`w-full rounded-xl text-white shadow-lg h-12 text-base font-medium ${postType === "teach"
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/25 hover:shadow-green-500/40"
                                    : "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/25 hover:shadow-blue-500/40"
                                }`}
                        >
                            {createGig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {postType === "teach" ? "🎓 Post Teaching Offer" : "📚 Post Learning Request"}
                        </Button>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
