import { Link } from "wouter";
import { Palette, Code2, BookOpen, Sparkles, ArrowRight, Zap, Users, Award, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7", fontFamily: "'DM Sans', sans-serif", color: "#1A1A2E" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#E5E5E0]">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[#4338CA] flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Fraunces', serif" }}>K</span>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: "'Fraunces', serif", color: "#4338CA" }}>Kai</span>
        </div>
        <Link href="/auth">
          <Button className="rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white px-6">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero — Split Layout */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#B45309] border border-[#F59E0B]/20 mb-6">
              Engineering Track 4
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4" style={{ fontFamily: "'Fraunces', serif", color: "#1A1A2E" }}>
              Kai Micro-Gig &<br />Peer Help Marketplace
            </h1>
            <p className="text-lg md:text-xl italic mb-6" style={{ color: "#4338CA", fontFamily: "'Fraunces', serif" }}>
              "Pocket Money, Real Skills, Trusted Inside Your College"
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: "#555" }}>
              Students want pocket money, portfolio projects, and skill-based learning — but trusted peer discovery doesn't exist inside college ecosystems. The talent is there; the marketplace isn't. <strong style={{ color: "#4338CA" }}>Kai can build it in a day.</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth">
                <Button className="rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white h-12 px-8 text-base gap-2">
                  Post a Gig <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" className="rounded-xl h-12 px-8 text-base border-[#4338CA] text-[#4338CA] hover:bg-[#4338CA]/5">
                  Find Help
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <img src="/kai-hero.png" alt="Student working on laptop in a cafe" className="w-full h-auto object-cover" />
            </div>
            {/* Floating stats */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 border">
              <div className="h-8 w-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Active Helpers</div>
                <div className="font-bold text-sm">250+</div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 border">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Gigs Completed</div>
                <div className="font-bold text-sm">1,200+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Section from spec */}
      <section className="px-6 md:px-12 py-16 md:py-24" style={{ backgroundColor: "#F5F5F0" }}>
        <div className="max-w-7xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 mb-4">
            Engineering Track 4 — Build Spec + Loop
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ fontFamily: "'Fraunces', serif" }}>
            The Campus Gig Economy, Powered by Kai
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left — What Students Can Post */}
            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif" }}>
                <Sparkles className="h-5 w-5 text-[#F59E0B]" /> What Students Can Post
              </h3>
              <div className="space-y-4">
                <Card className="rounded-2xl p-5 border-l-4 border-l-[#F59E0B] bg-white shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <Palette className="h-5 w-5 text-[#F59E0B]" />
                    <span className="font-bold" style={{ fontFamily: "'Fraunces', serif" }}>🎨 Creative Gigs</span>
                  </div>
                  <p className="text-sm" style={{ color: "#666" }}>
                    "Need poster design", "Need video edit", "Need PPT design" — quick creative tasks with fair pricing suggested by Kai
                  </p>
                </Card>

                <Card className="rounded-2xl p-5 border-l-4 border-l-[#4338CA] bg-white shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <Code2 className="h-5 w-5 text-[#4338CA]" />
                    <span className="font-bold" style={{ fontFamily: "'Fraunces', serif" }}>💻 Tech Help</span>
                  </div>
                  <p className="text-sm" style={{ color: "#666" }}>
                    "Need DSA mentor", "Need code review", "Need app testing partner" — peer-to-peer skill exchange
                  </p>
                </Card>

                <Card className="rounded-2xl p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <span className="font-bold" style={{ fontFamily: "'Fraunces', serif" }}>📚 Academic Help</span>
                  </div>
                  <p className="text-sm" style={{ color: "#666" }}>
                    "Need lab report help", "Need exam prep partner", "Need project collaborator" — academic micro-tasks
                  </p>
                </Card>
              </div>
            </div>

            {/* Right — How Kai Adds Value */}
            <div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif" }}>
                <Zap className="h-5 w-5 text-[#4338CA]" /> How Kai Adds Value
              </h3>
              <div className="space-y-4 mb-8">
                {[
                  { text: "Auto-writes a clean, professional gig post from a rough description", icon: "✅" },
                  { text: "Matches helpers based on their listed skills and past work", icon: "✅" },
                  { text: "Suggests fair pricing and realistic time estimates", icon: "✅" },
                  { text: "Generates a Proof of Work card — a mini portfolio entry after each completed gig", icon: "✅" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E5E5E0] shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Growth Loop */}
              <Card className="rounded-2xl p-5 bg-gradient-to-br from-[#4338CA]/5 to-[#F59E0B]/5 border border-[#4338CA]/10">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-[#4338CA]" />
                  <span className="font-bold text-sm" style={{ fontFamily: "'Fraunces', serif" }}>Growth Loop</span>
                </div>
                <p className="text-sm" style={{ color: "#555" }}>
                  Weekly "Gig Board Digest" — a WhatsApp-forwardable summary of top open gigs + "Top Helpers of the Week" leaderboard. Every college gets its own board.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Ready to earn or get help?
          </h2>
          <p className="text-base mb-8" style={{ color: "#555" }}>
            Join your college's micro-gig marketplace. Post a task, find skilled helpers, build your portfolio — all within your campus.
          </p>
          <Link href="/auth">
            <Button className="rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white h-12 px-10 text-base gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-[#E5E5E0] text-center">
        <p className="text-xs" style={{ color: "#999" }}>
          © 2026 Kai • Campus Gig Marketplace • Built for Engineering Track 4
        </p>
      </footer>
    </div>
  );
}
