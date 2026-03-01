import * as React from "react";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
    const [tab, setTab] = React.useState<"login" | "register">("login");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [error, setError] = React.useState("");
    const [, navigate] = useLocation();
    const { login, register, isLoggingIn, isRegistering, isAuthenticated } = useAuth();
    const { toast } = useToast();

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated) navigate("/dashboard");
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            if (tab === "login") {
                await login({ email, password });
                toast({ title: "Welcome back! 👋" });
            } else {
                if (!firstName.trim()) {
                    setError("First name is required.");
                    return;
                }
                await register({ email, password, firstName, lastName });
                toast({ title: "Account created! 🎉", description: "Welcome to Kai." });
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        }
    };

    return (
        <div className="min-h-screen mesh-campus flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30">
                <div className="glass">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-3">
                            <BrandMark />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
                <div className="h-px bg-border/70" />
            </header>

            {/* Main */}
            <main className="flex-1 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <Card className="rounded-3xl border border-card-border/70 bg-card/90 backdrop-blur shadow-xl noise-overlay overflow-hidden">
                        {/* Gradient top bar */}
                        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

                        <div className="p-8">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-3">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Campus Gig Marketplace</span>
                                </div>
                                <h1 className="font-display text-2xl tracking-tight">
                                    {tab === "login" ? "Welcome back" : "Create your account"}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {tab === "login"
                                        ? "Sign in to your Kai account"
                                        : "Join Kai and start earning on campus"}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => { setTab("login"); setError(""); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "login" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => { setTab("register"); setError(""); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "register" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Register
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {tab === "register" && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="Niraj"
                                                    className="pl-9 rounded-xl"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
                                            <Input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Optional"
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@college.edu"
                                            className="pl-9 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={tab === "register" ? "At least 6 characters" : "••••••••"}
                                            className="pl-9 rounded-xl"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoggingIn || isRegistering}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 transition-all"
                                >
                                    {(isLoggingIn || isRegistering) ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {tab === "login" ? "Sign In" : "Create Account"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>

                            {/* Switch tab prompt */}
                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                {tab === "login" ? (
                                    <>
                                        Don't have an account?{" "}
                                        <button onClick={() => { setTab("register"); setError(""); }} className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                                            Register
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button onClick={() => { setTab("login"); setError(""); }} className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Kai • Pocket money, real skills.
                    </div>
                </div>
            </main>
        </div>
    );
}
