/**
 * Kai AI Service
 * Uses NVIDIA Qwen 3.5-397B API for AI-powered gig enhancement,
 * pricing, and matching. Falls back to smart templates if API is unavailable.
 */

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_API_KEY = "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";
const MODEL = "qwen/qwen3.5-397b-a17b";

// ── NVIDIA Qwen API helper ──

async function callQwen(prompt: string): Promise<string | null> {
    try {
        const res = await fetch(NVIDIA_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1024,
                temperature: 0.6,
                top_p: 0.95,
                top_k: 20,
                stream: false,
                chat_template_kwargs: { enable_thinking: false },
            }),
        });

        if (!res.ok) {
            console.error("[ai] NVIDIA API error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        console.error("[ai] NVIDIA API error:", err);
        return null;
    }
}

// ── Enhance Gig Description ──

export async function enhanceGigDescription(
    title: string,
    description: string,
    category: string,
): Promise<{ enhancedDescription: string; suggestedTitle?: string }> {
    const prompt = `You are Kai, an AI assistant for a campus gig marketplace. A student posted a gig with:
Title: "${title}"
Category: ${category}
Description: "${description}"

Rewrite the description to be professional, clear, and appealing. Keep it concise (2-3 sentences max). Also suggest a better title if the original could be improved.

Respond ONLY with this exact JSON format, no markdown, no code blocks, no extra text:
{"enhancedDescription": "...", "suggestedTitle": "..."}`;

    const result = await callQwen(prompt);
    if (result) {
        try {
            const cleaned = result.replace(/```json\n?|\n?```/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            // Try to extract JSON from the response
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return { enhancedDescription: cleaned };
        } catch {
            return { enhancedDescription: result.replace(/<think>[\s\S]*?<\/think>/g, "").trim() };
        }
    }

    // Template fallback
    const categoryLabels: Record<string, string> = {
        creative: "creative project",
        tech: "technical task",
        academic: "academic assistance",
    };
    const label = categoryLabels[category] || "task";
    return {
        enhancedDescription: `Looking for a skilled student to help with a ${label}: ${description}. This is a great opportunity to build your portfolio and earn while helping a fellow student.`,
        suggestedTitle: title,
    };
}

// ── Suggest Fair Price ──

export async function suggestFairPrice(
    title: string,
    category: string,
    skills: string[],
    description: string,
): Promise<{ suggestedPriceCents: number; reasoning: string }> {
    const prompt = `You are Kai, an AI pricing advisor for a campus gig marketplace where students hire other students.
Gig: "${title}"
Category: ${category}
Skills needed: ${skills.join(", ") || "general"}
Description: "${description}"

Suggest a fair price in Indian Rupees (INR) that a college student would charge. Campus gigs are typically ₹100-₹2000.
Respond ONLY with this exact JSON format, no markdown, no code blocks, no extra text:
{"suggestedPriceCents": <integer in paise, e.g. 50000 for ₹500>, "reasoning": "..."}`;

    const result = await callQwen(prompt);
    if (result) {
        try {
            const cleaned = result.replace(/```json\n?|\n?```/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch {
            /* fall through */
        }
    }

    // Template fallback
    const basePrices: Record<string, number> = {
        creative: 30000, // ₹300
        tech: 50000, // ₹500
        academic: 20000, // ₹200
    };
    const base = basePrices[category] || 25000;
    const skillMultiplier = Math.min(1 + skills.length * 0.15, 2);
    const suggested = Math.round(base * skillMultiplier);
    return {
        suggestedPriceCents: suggested,
        reasoning: `Based on ${category} category and ${skills.length || 1} skill(s) required, ₹${(suggested / 100).toFixed(0)} is a fair campus rate.`,
    };
}

// ── Match Helpers ──

export async function matchHelpers(
    gigTitle: string,
    gigCategory: string,
    gigSkills: string[],
    helpers: Array<{ id: string; name: string; skills: string[]; completedGigs: number; avgRating: number | null }>,
): Promise<Array<{ userId: string; score: number; reason: string }>> {
    if (helpers.length === 0) return [];

    const prompt = `You are Kai, an AI matching engine for a campus gig marketplace.
Gig: "${gigTitle}" (category: ${gigCategory})
Skills needed: ${gigSkills.join(", ") || "general"}

Available helpers:
${helpers.map((h, i) => `${i + 1}. ${h.name} — skills: ${h.skills.join(", ") || "none listed"}, completed: ${h.completedGigs} gigs, rating: ${h.avgRating ?? "new"}`).join("\n")}

Rank the top helpers by fit. Respond ONLY as a JSON array, no markdown, no code blocks, no extra text:
[{"userId": "...", "score": 0-100, "reason": "..."}]`;

    const result = await callQwen(prompt);
    if (result) {
        try {
            const cleaned = result.replace(/```json\n?|\n?```/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch {
            /* fall through */
        }
    }

    // Template fallback: score by skill overlap + experience
    return helpers
        .map((h) => {
            const skillOverlap = gigSkills.filter((s) =>
                h.skills.some((hs) => hs.toLowerCase().includes(s.toLowerCase())),
            ).length;
            const skillScore = gigSkills.length > 0 ? (skillOverlap / gigSkills.length) * 60 : 30;
            const expScore = Math.min(h.completedGigs * 5, 20);
            const ratingScore = (h.avgRating ?? 3) * 4;
            const total = Math.round(skillScore + expScore + ratingScore);
            return {
                userId: h.id,
                score: Math.min(total, 100),
                reason: `${skillOverlap}/${gigSkills.length} skill match, ${h.completedGigs} completed gigs`,
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}
