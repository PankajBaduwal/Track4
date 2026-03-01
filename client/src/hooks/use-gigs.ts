import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./use-api";

// ── Gig List (browse) ──
export function useGigs(filters?: { category?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return useQuery({
        queryKey: ["gigs", filters],
        queryFn: () => fetch(`/api/gigs${qs ? `?${qs}` : ""}`).then((r) => r.json()),
        refetchInterval: 15000,
    });
}

// ── My Gigs ──
export function useMyGigs() {
    return useQuery({
        queryKey: ["gigs", "mine"],
        queryFn: () => fetch("/api/gigs/mine").then((r) => r.json()),
    });
}

// ── Single Gig ──
export function useGig(gigId: string | undefined) {
    return useQuery({
        queryKey: ["gig", gigId],
        queryFn: () => fetch(`/api/gigs/${gigId}`).then((r) => r.json()),
        enabled: !!gigId,
    });
}

// ── Create Gig ──
export function useCreateGig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) =>
            apiRequest("POST", "/api/gigs", data).then((r) => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gigs"] });
        },
    });
}

// ── Update Gig ──
export function useUpdateGig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ gigId, ...data }: any) =>
            apiRequest("PATCH", `/api/gigs/${gigId}`, data).then((r) => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gigs"] });
            qc.invalidateQueries({ queryKey: ["gig"] });
        },
    });
}

// ── Apply to Gig ──
export function useApplyToGig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ gigId, ...data }: any) =>
            apiRequest("POST", `/api/gigs/${gigId}/apply`, data).then((r) => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gig"] });
        },
    });
}

// ── Update Application (accept/reject) ──
export function useUpdateApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ gigId, appId, ...data }: any) =>
            apiRequest("PATCH", `/api/gigs/${gigId}/applications/${appId}`, data).then((r) => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gig"] });
        },
    });
}

// ── Complete Gig ──
export function useCompleteGig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ gigId, ...data }: any) =>
            apiRequest("POST", `/api/gigs/${gigId}/complete`, data).then((r) => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gigs"] });
            qc.invalidateQueries({ queryKey: ["gig"] });
        },
    });
}

// ── AI: Enhance Gig ──
export function useAiEnhance() {
    return useMutation({
        mutationFn: (data: { title: string; description: string; category: string }) =>
            apiRequest("POST", "/api/ai/enhance-gig", data).then((r) => r.json()),
    });
}

// ── AI: Suggest Price ──
export function useAiSuggestPrice() {
    return useMutation({
        mutationFn: (data: { title: string; category: string; skills: string[]; description: string }) =>
            apiRequest("POST", "/api/ai/suggest-price", data).then((r) => r.json()),
    });
}

// ── Leaderboard ──
export function useLeaderboard(filters?: { category?: string; period?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.period) params.set("period", filters.period);
    const qs = params.toString();
    return useQuery({
        queryKey: ["leaderboard", filters],
        queryFn: () => fetch(`/api/leaderboard${qs ? `?${qs}` : ""}`).then((r) => r.json()),
    });
}

// ── Proof of Work ──
export function useMyProofOfWork() {
    return useQuery({
        queryKey: ["proof-of-work", "mine"],
        queryFn: () => fetch("/api/proof-of-work/mine").then((r) => r.json()),
    });
}

export function useProofOfWork(gigId: string | undefined) {
    return useQuery({
        queryKey: ["proof-of-work", gigId],
        queryFn: () => fetch(`/api/proof-of-work/${gigId}`).then((r) => r.json()),
        enabled: !!gigId,
    });
}
